import express from 'express';
import Reservation from '../models/Reservation.js';
import Table from '../models/Table.js';
import Order from '../models/Order.js';
import Settings from '../models/Settings.js';
import { protect, requirePermission } from '../middleware/auth.js';
import { calcTotals, generateOrderNumber } from '../utils/orderCalc.js';

const router = express.Router();
router.use(protect);

const getSettings = async () => (await Settings.findOne()) || {};

const applyTotals = (order, settings) => {
  const totals = calcTotals(order.items, settings, order.discount);
  Object.assign(order, totals);
};

const clampWindow = (minutes) => {
  const n = Number(minutes);
  if (!Number.isFinite(n)) return 120;
  return Math.min(12 * 60, Math.max(15, n));
};

const ensureEndAt = (startAt, endAt, defaultMinutes = 90) => {
  const start = new Date(startAt);
  const end = endAt ? new Date(endAt) : new Date(start.getTime() + defaultMinutes * 60 * 1000);
  if (!(start instanceof Date) || Number.isNaN(start.getTime())) return null;
  if (!(end instanceof Date) || Number.isNaN(end.getTime())) return null;
  if (end <= start) return null;
  return { start, end };
};

const hasOverlappingReservation = async ({ tableId, start, end, ignoreId }) => {
  if (!tableId) return false;
  const q = {
    table: tableId,
    status: { $in: ['booked', 'seated'] },
    startAt: { $lt: end },
    endAt: { $gt: start },
  };
  if (ignoreId) q._id = { $ne: ignoreId };
  const existing = await Reservation.findOne(q).select('_id');
  return !!existing;
};

router.get('/', async (req, res) => {
  const days = Number(req.query.days) || 7;
  const from = req.query.from ? new Date(req.query.from) : new Date();
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + Math.min(31, Math.max(1, days)));

  const filter = {
    startAt: { $gte: start, $lt: end },
  };
  if (req.query.status) filter.status = req.query.status;

  const reservations = await Reservation.find(filter)
    .populate('table', 'number name zone capacity')
    .populate('createdBy', 'name role')
    .sort('startAt');

  res.json(reservations);
});

router.post('/', async (req, res) => {
  const { startAt, endAt, partySize, customerName, customerPhone, notes, table } = req.body;
  const window = ensureEndAt(startAt, endAt);
  if (!window) return res.status(400).json({ message: 'Invalid reservation time window' });

  if (table) {
    const exists = await Table.findById(table).select('_id');
    if (!exists) return res.status(400).json({ message: 'Table not found' });
    if (await hasOverlappingReservation({ tableId: table, start: window.start, end: window.end })) {
      return res.status(409).json({ message: 'Table already reserved for that time' });
    }
  }

  const r = await Reservation.create({
    startAt: window.start,
    endAt: window.end,
    partySize: Math.max(1, Number(partySize) || 1),
    customerName,
    customerPhone: customerPhone || '',
    notes: notes || '',
    table: table || null,
    createdBy: req.user._id,
  });

  const populated = await Reservation.findById(r._id)
    .populate('table', 'number name zone capacity')
    .populate('createdBy', 'name role');
  res.status(201).json(populated);
});

router.patch('/:id', async (req, res) => {
  const r = await Reservation.findById(req.params.id);
  if (!r) return res.status(404).json({ message: 'Reservation not found' });

  const nextStartAt = req.body.startAt ?? r.startAt;
  const nextEndAt = req.body.endAt ?? r.endAt;
  const window = ensureEndAt(nextStartAt, nextEndAt);
  if (!window) return res.status(400).json({ message: 'Invalid reservation time window' });

  const nextTable = req.body.table === undefined ? r.table : req.body.table || null;

  if (nextTable) {
    const exists = await Table.findById(nextTable).select('_id');
    if (!exists) return res.status(400).json({ message: 'Table not found' });
    if (
      await hasOverlappingReservation({
        tableId: nextTable,
        start: window.start,
        end: window.end,
        ignoreId: r._id,
      })
    ) {
      return res.status(409).json({ message: 'Table already reserved for that time' });
    }
  }

  r.startAt = window.start;
  r.endAt = window.end;
  if (req.body.partySize !== undefined) r.partySize = Math.max(1, Number(req.body.partySize) || 1);
  if (req.body.customerName !== undefined) r.customerName = req.body.customerName;
  if (req.body.customerPhone !== undefined) r.customerPhone = req.body.customerPhone;
  if (req.body.notes !== undefined) r.notes = req.body.notes;
  if (req.body.status) r.status = req.body.status;
  r.table = nextTable;

  await r.save();

  const populated = await Reservation.findById(r._id)
    .populate('table', 'number name zone capacity')
    .populate('createdBy', 'name role');
  res.json(populated);
});

router.post('/:id/cancel', requirePermission('reservations.cancel'), async (req, res) => {
  const r = await Reservation.findById(req.params.id);
  if (!r) return res.status(404).json({ message: 'Reservation not found' });
  r.status = 'cancelled';
  await r.save();
  res.json({ message: 'Cancelled', reservation: r });
});

router.post('/:id/noshow', requirePermission('reservations.cancel'), async (req, res) => {
  const r = await Reservation.findById(req.params.id);
  if (!r) return res.status(404).json({ message: 'Reservation not found' });
  r.status = 'no-show';
  await r.save();
  res.json({ message: 'Marked no-show', reservation: r });
});

router.post('/:id/seat', async (req, res) => {
  const r = await Reservation.findById(req.params.id);
  if (!r) return res.status(404).json({ message: 'Reservation not found' });
  r.status = 'seated';
  await r.save();
  res.json({ message: 'Seated', reservation: r });
});

router.post('/:id/seat-and-order', async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) return res.status(404).json({ message: 'Reservation not found' });
  if (!reservation.table) {
    return res.status(400).json({ message: 'Assign a table before seating and starting order' });
  }
  if (reservation.status === 'cancelled' || reservation.status === 'no-show') {
    return res.status(400).json({ message: 'Cannot start order for cancelled/no-show reservation' });
  }

  const table = await Table.findById(reservation.table).populate('currentOrder');
  if (!table) return res.status(404).json({ message: 'Assigned table not found' });

  if (table.currentOrder) {
    const existingOrder = await Order.findById(table.currentOrder._id || table.currentOrder);
    if (existingOrder && !['paid', 'cancelled'].includes(existingOrder.status)) {
      reservation.status = 'seated';
      await reservation.save();
      return res.status(200).json({
        message: 'Reservation seated and existing active order reused',
        reservation,
        order: existingOrder,
      });
    }
  }

  const settings = await getSettings();
  const orderNumber = await generateOrderNumber(Order);
  const order = new Order({
    orderNumber,
    type: 'dine-in',
    table: table._id,
    customerName: reservation.customerName || '',
    customerPhone: reservation.customerPhone || '',
    notes: reservation.notes || '',
    createdBy: req.user._id,
    items: [],
  });
  applyTotals(order, settings);
  await order.save();

  table.status = 'occupied';
  table.currentOrder = order._id;
  await table.save();

  reservation.status = 'seated';
  await reservation.save();

  res.status(201).json({
    message: 'Reservation seated and order started',
    reservation,
    order,
  });
});

router.get('/tables/availability', async (req, res) => {
  const minutes = clampWindow(req.query.windowMinutes);
  const start = req.query.startAt ? new Date(req.query.startAt) : new Date();
  if (Number.isNaN(start.getTime())) return res.status(400).json({ message: 'Invalid startAt' });
  const end = new Date(start.getTime() + minutes * 60 * 1000);

  const reserved = await Reservation.find({
    status: { $in: ['booked', 'seated'] },
    table: { $ne: null },
    startAt: { $lt: end },
    endAt: { $gt: start },
  }).select('table');

  const reservedIds = new Set(reserved.map((r) => String(r.table)));
  const tables = await Table.find().sort('number');
  res.json(
    tables.map((t) => ({
      ...t.toObject(),
      isReservedInWindow: reservedIds.has(String(t._id)),
    }))
  );
});

export default router;
