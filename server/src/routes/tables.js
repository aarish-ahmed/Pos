import express from 'express';
import Table from '../models/Table.js';
import Order from '../models/Order.js';
import Reservation from '../models/Reservation.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  const windowMinutes = req.query.windowMinutes ? Number(req.query.windowMinutes) : 120;
  const now = new Date();
  const windowEnd = new Date(now.getTime() + Math.min(12 * 60, Math.max(15, windowMinutes)) * 60 * 1000);

  const tables = await Table.find().populate('currentOrder').sort('number');

  const activeReservations = await Reservation.find({
    status: { $in: ['booked', 'seated'] },
    table: { $ne: null },
    startAt: { $lt: windowEnd },
    endAt: { $gt: now },
  }).select('table startAt endAt customerName partySize status');

  const byTable = new Map();
  activeReservations.forEach((r) => byTable.set(String(r.table), r));

  const shaped = tables.map((t) => {
    const reservation = byTable.get(String(t._id)) || null;
    const obj = t.toObject();
    obj.activeReservation = reservation;
    if (reservation && obj.status === 'available' && !obj.currentOrder) {
      obj.status = 'reserved';
    }
    return obj;
  });

  res.json(shaped);
});

router.post('/', async (req, res) => {
  const table = await Table.create(req.body);
  res.status(201).json(table);
});

router.patch('/:id', async (req, res) => {
  const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!table) return res.status(404).json({ message: 'Table not found' });
  res.json(table);
});

router.post('/:id/clear', async (req, res) => {
  const table = await Table.findById(req.params.id);
  if (!table) return res.status(404).json({ message: 'Table not found' });
  if (table.currentOrder) {
    const order = await Order.findById(table.currentOrder);
    if (order && order.status !== 'paid' && order.status !== 'cancelled') {
      return res.status(400).json({ message: 'Close or pay the active order first' });
    }
  }
  table.status = 'available';
  table.currentOrder = null;
  await table.save();
  res.json(table);
});

export default router;
