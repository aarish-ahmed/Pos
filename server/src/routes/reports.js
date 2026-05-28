import express from 'express';
import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import { protect, requirePermission } from '../middleware/auth.js';
import { can } from '../config/permissions.js';

const router = express.Router();
router.use(protect);

const parseDateRange = (query) => {
  const now = new Date();
  let end = query.to ? new Date(query.to) : new Date(now);
  if (Number.isNaN(end.getTime())) end = new Date(now);
  end.setHours(23, 59, 59, 999);

  let start;
  if (query.from) {
    start = new Date(query.from);
  } else {
    const days = Math.min(365, Math.max(1, Number(query.days) || 7));
    start = new Date(end);
    start.setDate(start.getDate() - days + 1);
  }
  if (Number.isNaN(start.getTime())) {
    start = new Date(end);
    start.setDate(start.getDate() - 6);
  }
  start.setHours(0, 0, 0, 0);
  return { start, end };
};

const round2 = (n) => Math.round(n * 100) / 100;

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

  const payload = { openOrders };

  if (can(req.user.role, 'dashboard.financial')) {
    Object.assign(payload, {
      revenue: round2(revenue),
      orderCount,
      avgTicket: round2(avgTicket),
      topItems,
      hourly: hourly.filter((h) => h.orders > 0 || h.hour >= 8),
    });
  }

  res.json(payload);
});

router.get('/analytics', requirePermission('reports.view'), async (req, res) => {
  const { start, end } = parseDateRange(req.query);
  const orderType = req.query.type && req.query.type !== 'all' ? req.query.type : null;

  const filter = {
    createdAt: { $gte: start, $lte: end },
    status: 'paid',
  };
  if (orderType) filter.type = orderType;

  const orders = await Order.find(filter)
    .populate('createdBy', 'name role')
    .populate('table', 'number zone')
    .sort('-createdAt');

  const menuItems = await MenuItem.find().populate('category', 'name');
  const menuMap = new Map(menuItems.map((m) => [String(m._id), m]));

  const byDay = {};
  const byHour = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: `${h === 0 ? '12' : h > 12 ? h - 12 : h}${h < 12 ? 'am' : 'pm'}`,
    orders: 0,
    revenue: 0,
  }));
  const byOrderType = {};
  const byCategory = {};
  const byItem = {};
  const byPayment = {};
  const byStaff = {};

  let itemsSold = 0;
  let discountsTotal = 0;
  let taxTotal = 0;
  let serviceTotal = 0;

  orders.forEach((o) => {
    const dayKey = o.createdAt.toISOString().slice(0, 10);
    if (!byDay[dayKey]) byDay[dayKey] = { date: dayKey, orders: 0, revenue: 0, itemsSold: 0 };
    byDay[dayKey].orders += 1;
    byDay[dayKey].revenue += o.total;

    discountsTotal += o.discount || 0;
    taxTotal += o.tax || 0;
    serviceTotal += o.serviceCharge || 0;

    const typeKey = o.type || 'dine-in';
    if (!byOrderType[typeKey]) byOrderType[typeKey] = { type: typeKey, orders: 0, revenue: 0 };
    byOrderType[typeKey].orders += 1;
    byOrderType[typeKey].revenue += o.total;

    const hour = new Date(o.createdAt).getHours();
    byHour[hour].orders += 1;
    byHour[hour].revenue += o.total;

    const staffKey = o.createdBy?._id ? String(o.createdBy._id) : 'unknown';
    if (!byStaff[staffKey]) {
      byStaff[staffKey] = {
        staffId: staffKey,
        name: o.createdBy?.name || 'Unknown',
        role: o.createdBy?.role || '',
        orders: 0,
        revenue: 0,
      };
    }
    byStaff[staffKey].orders += 1;
    byStaff[staffKey].revenue += o.total;

    (o.payments || []).forEach((p) => {
      const m = p.method || 'other';
      if (!byPayment[m]) byPayment[m] = { method: m, count: 0, amount: 0 };
      byPayment[m].count += 1;
      byPayment[m].amount += p.amount;
    });

    o.items.forEach((line) => {
      itemsSold += line.quantity;
      byDay[dayKey].itemsSold += line.quantity;

      const lineRev = line.price * line.quantity;
      if (!byItem[line.name]) {
        byItem[line.name] = { name: line.name, qty: 0, revenue: 0 };
      }
      byItem[line.name].qty += line.quantity;
      byItem[line.name].revenue += lineRev;

      const mi = menuMap.get(String(line.menuItem));
      const catName = mi?.category?.name || 'Uncategorized';
      if (!byCategory[catName]) byCategory[catName] = { category: catName, qty: 0, revenue: 0 };
      byCategory[catName].qty += line.quantity;
      byCategory[catName].revenue += lineRev;
    });
  });

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.length;

  const sortRevenue = (a, b) => b.revenue - a.revenue;

  res.json({
    range: {
      from: start.toISOString().slice(0, 10),
      to: end.toISOString().slice(0, 10),
    },
    filters: { type: orderType || 'all' },
    summary: {
      revenue: round2(totalRevenue),
      orders: totalOrders,
      avgTicket: round2(totalOrders ? totalRevenue / totalOrders : 0),
      itemsSold,
      discountsTotal: round2(discountsTotal),
      taxTotal: round2(taxTotal),
      serviceTotal: round2(serviceTotal),
    },
    byDay: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)),
    byHour: byHour
      .map((h) => ({ ...h, revenue: round2(h.revenue) }))
      .filter((h) => h.orders > 0 || h.hour >= 7),
    byOrderType: Object.values(byOrderType).map((r) => ({
      ...r,
      revenue: round2(r.revenue),
      share: totalRevenue ? round2((r.revenue / totalRevenue) * 100) : 0,
    })),
    byCategory: Object.values(byCategory)
      .map((c) => ({ ...c, revenue: round2(c.revenue) }))
      .sort(sortRevenue),
    byItem: Object.values(byItem)
      .map((i) => ({ ...i, revenue: round2(i.revenue) }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 50),
    byPayment: Object.values(byPayment).map((p) => ({
      ...p,
      amount: round2(p.amount),
    })),
    byStaff: Object.values(byStaff)
      .map((s) => ({ ...s, revenue: round2(s.revenue) }))
      .sort(sortRevenue),
    orders: orders.slice(0, 100).map((o) => ({
      orderNumber: o.orderNumber,
      date: o.createdAt.toISOString().slice(0, 10),
      time: o.createdAt.toISOString().slice(11, 16),
      type: o.type,
      table: o.table?.number,
      total: o.total,
      items: o.items.length,
      staff: o.createdBy?.name,
    })),
  });
});

/** Legacy endpoint — delegates to analytics shape */
router.get('/sales', requirePermission('reports.view'), async (req, res) => {
  const days = Number(req.query.days) || 7;
  req.query.days = String(days);
  const { start, end } = parseDateRange(req.query);

  const orders = await Order.find({
    createdAt: { $gte: start, $lte: end },
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
    orders: orders.map((o) => ({
      orderNumber: o.orderNumber,
      date: o.createdAt.toISOString().slice(0, 10),
      type: o.type,
      total: o.total,
      status: o.status,
    })),
  });
});

export default router;
