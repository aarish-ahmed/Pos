import express from 'express';
import Order from '../models/Order.js';
import Table from '../models/Table.js';
import MenuItem from '../models/MenuItem.js';
import Settings from '../models/Settings.js';
import { protect, requirePermission } from '../middleware/auth.js';
import { calcTotals, generateOrderNumber } from '../utils/orderCalc.js';
import { isOrderClosed, isOrderLockedForUser } from '../utils/orderGuards.js';
import { can } from '../config/permissions.js';

const router = express.Router();
router.use(protect);

const getSettings = async () => (await Settings.findOne()) || {};

const applyTotals = (order, settings) => {
  const totals = calcTotals(order.items, settings, order.discount);
  Object.assign(order, totals);
};

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.table) filter.table = req.query.table;
  if (req.query.today === 'true') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    filter.createdAt = { $gte: start };
  }
  const orders = await Order.find(filter)
    .populate('table', 'number name zone')
    .populate('createdBy', 'name')
    .sort('-createdAt')
    .limit(req.query.limit ? Number(req.query.limit) : 100);
  res.json(orders);
});

router.get('/kitchen', requirePermission('kitchen.view'), async (req, res) => {
  const orders = await Order.find({
    status: { $in: ['sent', 'preparing'] },
  })
    .populate('table', 'number')
    .sort('updatedAt');
  res.json(orders);
});

router.get('/takeaway', async (req, res) => {
  const filter = { type: 'takeaway' };
  const view = req.query.view || 'active';

  if (view === 'active') {
    filter.status = { $nin: ['paid', 'cancelled'] };
  } else {
    filter.status = 'paid';
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    filter.createdAt = { $gte: start };
  }

  const statusOrder = { ready: 0, preparing: 1, sent: 2, open: 3, served: 4 };
  const orders = await Order.find(filter)
    .populate('createdBy', 'name')
    .sort('-updatedAt')
    .limit(80);

  orders.sort((a, b) => {
    const sa = statusOrder[a.status] ?? 5;
    const sb = statusOrder[b.status] ?? 5;
    if (sa !== sb) return sa - sb;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  res.json(orders);
});

router.get('/:id', async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('table', 'number name zone')
    .populate('createdBy', 'name');
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
});

router.post('/', requirePermission('orders.create'), async (req, res) => {
  const settings = await getSettings();
  const orderNumber = await generateOrderNumber(Order);
  const order = new Order({
    orderNumber,
    type: req.body.type || 'dine-in',
    table: req.body.table || null,
    customerName: req.body.customerName || '',
    customerPhone: req.body.customerPhone || '',
    notes: req.body.notes || '',
    createdBy: req.user._id,
    items: [],
  });
  applyTotals(order, settings);
  await order.save();

  if (order.table) {
    await Table.findByIdAndUpdate(order.table, {
      status: 'occupied',
      currentOrder: order._id,
    });
  }
  res.status(201).json(order);
});

router.post('/:id/items', requirePermission('orders.add_items'), async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (isOrderClosed(order)) return res.status(400).json({ message: 'Order is closed' });
  if (isOrderLockedForUser(order, req.user)) {
    return res.status(403).json({ message: 'Cannot add items after order was sent to kitchen' });
  }
  const menuItem = await MenuItem.findById(req.body.menuItemId);
  if (!menuItem || !menuItem.isAvailable) {
    return res.status(400).json({ message: 'Item unavailable' });
  }
  const qty = Math.max(1, Number(req.body.quantity) || 1);
  order.items.push({
    menuItem: menuItem._id,
    name: menuItem.name,
    price: menuItem.price,
    quantity: qty,
    notes: req.body.notes || '',
  });
  applyTotals(order, await getSettings());
  await order.save();
  res.json(order);
});

router.patch('/:id/items/:itemId', async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  const item = order.items.id(req.params.itemId);
  if (!item) return res.status(404).json({ message: 'Line item not found' });

  if (req.body.status) {
    if (!can(req.user.role, 'kitchen.update')) {
      return res.status(403).json({ message: 'Insufficient permissions for kitchen updates' });
    }
    item.status = req.body.status;
  } else {
    if (isOrderClosed(order)) return res.status(400).json({ message: 'Order is closed' });
    if (isOrderLockedForUser(order, req.user)) {
      return res.status(403).json({ message: 'Cannot edit items after order was sent to kitchen' });
    }
    if (req.body.quantity !== undefined) item.quantity = Math.max(1, req.body.quantity);
    if (req.body.notes !== undefined) item.notes = req.body.notes;
  }
  applyTotals(order, await getSettings());
  await order.save();
  res.json(order);
});

router.delete('/:id/items/:itemId', requirePermission('orders.remove_items'), async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (isOrderClosed(order)) return res.status(400).json({ message: 'Order is closed' });
  if (isOrderLockedForUser(order, req.user)) {
    return res.status(403).json({ message: 'Cannot remove items after order was sent to kitchen' });
  }
  order.items.pull(req.params.itemId);
  applyTotals(order, await getSettings());
  await order.save();
  res.json(order);
});

router.post('/:id/send', requirePermission('orders.send_kitchen'), async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (!order.items.length) return res.status(400).json({ message: 'Add items first' });
  if (['sent', 'preparing', 'ready'].includes(order.status)) {
    return res.status(400).json({ message: 'Order already sent to kitchen' });
  }
  order.status = 'sent';
  order.items.forEach((i) => {
    if (i.status === 'pending') i.status = 'preparing';
  });
  await order.save();
  res.json(order);
});

router.patch('/:id/status', async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (req.body.status === 'ready' && !can(req.user.role, 'kitchen.update')) {
    return res.status(403).json({ message: 'Insufficient permissions for kitchen updates' });
  }
  if (req.body.status === 'ready') {
    order.items.forEach((item) => {
      if (!['cancelled', 'served'].includes(item.status)) item.status = 'ready';
    });
    order.status = 'ready';
  } else if (req.body.status) {
    order.status = req.body.status;
  }
  await order.save();
  res.json(order);
});

router.post('/:id/discount', requirePermission('orders.discount'), async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (['paid', 'cancelled'].includes(order.status)) {
    return res.status(400).json({ message: 'Cannot discount a closed order' });
  }

  const settings = await getSettings();
  if (req.body.percent != null && req.body.percent !== '') {
    const pct = Math.min(100, Math.max(0, Number(req.body.percent)));
    order.discount = Math.round(order.subtotal * (pct / 100) * 100) / 100;
  } else {
    order.discount = Math.min(order.subtotal, Math.max(0, Number(req.body.discount ?? req.body.amount) || 0));
  }

  applyTotals(order, settings);
  await order.save();
  res.json(order);
});

router.post('/:id/pay', requirePermission('orders.pay'), async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (!order.items.length) return res.status(400).json({ message: 'Nothing to pay' });

  const settings = await getSettings();
  applyTotals(order, settings);

  const { method, amount } = req.body;
  const payAmount = Number(amount) || order.total - order.amountPaid;
  if (payAmount <= 0) return res.status(400).json({ message: 'Invalid amount' });

  order.payments.push({ method, amount: payAmount, reference: req.body.reference || '' });
  order.amountPaid = Math.round((order.amountPaid + payAmount) * 100) / 100;

  if (order.amountPaid >= order.total) {
    order.status = 'paid';
    order.changeDue = Math.round((order.amountPaid - order.total) * 100) / 100;
    order.closedAt = new Date();
    if (order.table) {
      await Table.findByIdAndUpdate(order.table, { status: 'cleaning', currentOrder: null });
    }
  }
  await order.save();
  res.json(order);
});

router.post('/:id/cancel', requirePermission('orders.cancel'), async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.status === 'paid') return res.status(400).json({ message: 'Cannot cancel paid order' });
  order.status = 'cancelled';
  await order.save();
  if (order.table) {
    await Table.findByIdAndUpdate(order.table, { status: 'available', currentOrder: null });
  }
  res.json(order);
});

export default router;
