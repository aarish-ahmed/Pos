import express from 'express';
import Order from '../models/Order.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/dashboard', async (req, res) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const todayOrders = await Order.find({
    createdAt: { $gte: start },
    status: { $in: ['paid', 'served'] },
  });

  const revenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const orderCount = todayOrders.length;
  const avgTicket = orderCount ? revenue / orderCount : 0;

  const openOrders = await Order.countDocuments({
    status: { $in: ['open', 'sent', 'preparing', 'ready', 'served'] },
  });

  const itemMap = {};
  todayOrders.forEach((order) => {
    order.items.forEach((item) => {
      const key = item.name;
      if (!itemMap[key]) itemMap[key] = { name: key, qty: 0, revenue: 0 };
      itemMap[key].qty += item.quantity;
      itemMap[key].revenue += item.price * item.quantity;
    });
  });
  const topItems = Object.values(itemMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, sales: 0, orders: 0 }));
  todayOrders.forEach((o) => {
    const h = new Date(o.createdAt).getHours();
    hourly[h].sales += o.total;
    hourly[h].orders += 1;
  });

  res.json({
    revenue: Math.round(revenue * 100) / 100,
    orderCount,
    avgTicket: Math.round(avgTicket * 100) / 100,
    openOrders,
    topItems,
    hourly: hourly.filter((h) => h.orders > 0 || h.hour >= 8),
  });
});

router.get('/sales', authorize('admin', 'manager'), async (req, res) => {
  const days = Number(req.query.days) || 7;
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);

  const orders = await Order.find({
    createdAt: { $gte: start },
    status: 'paid',
  }).sort('createdAt');

  const byDay = {};
  orders.forEach((o) => {
    const key = o.createdAt.toISOString().slice(0, 10);
    if (!byDay[key]) byDay[key] = { date: key, revenue: 0, orders: 0 };
    byDay[key].revenue += o.total;
    byDay[key].orders += 1;
  });

  res.json({
    totalRevenue: orders.reduce((s, o) => s + o.total, 0),
    totalOrders: orders.length,
    byDay: Object.values(byDay),
  });
});

export default router;
