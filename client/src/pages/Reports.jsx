import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Download,
  RefreshCw,
  TrendingUp,
  ShoppingBag,
  Receipt,
  Percent,
  Clock,
  Utensils,
  Users,
  CreditCard,
  LayoutGrid,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { formatMoney, formatDate } from '../utils/format';
import BarChart from '../components/analytics/BarChart';

const DATE_PRESETS = [
  { id: '7', label: '7 days', days: 7 },
  { id: '14', label: '14 days', days: 14 },
  { id: '30', label: '30 days', days: 30 },
  { id: '90', label: '90 days', days: 90 },
];

const ORDER_TYPES = [
  { id: 'all', label: 'All types' },
  { id: 'dine-in', label: 'Dine-in' },
  { id: 'takeaway', label: 'Takeaway' },
  { id: 'delivery', label: 'Delivery' },
];

const POV_TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'time', label: 'Time', icon: Clock },
  { id: 'menu', label: 'Menu', icon: Utensils },
  { id: 'operations', label: 'Operations', icon: CreditCard },
  { id: 'team', label: 'Team', icon: Users },
];

const escapeCsv = (val) => {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

export default function Reports() {
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState('30');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [orderType, setOrderType] = useState('all');
  const [pov, setPov] = useState('overview');

  const sym = settings?.currencySymbol || '$';
  const fmt = (n) => formatMoney(n, sym);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (customFrom && customTo) {
        params.set('from', customFrom);
        params.set('to', customTo);
      } else {
        params.set('days', days);
      }
      if (orderType !== 'all') params.set('type', orderType);

      const [analytics, set] = await Promise.all([
        api.get(`/reports/analytics?${params}`),
        api.get('/settings'),
      ]);
      setData(analytics.data);
      setSettings(set.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [days, customFrom, customTo, orderType]);

  useEffect(() => {
    load();
  }, [load]);

  const summaryCards = useMemo(
    () => [
      { label: 'Revenue', value: fmt(data?.summary?.revenue), icon: TrendingUp, tint: 'from-brand-500 to-brand-700' },
      { label: 'Orders', value: data?.summary?.orders ?? 0, icon: ShoppingBag, tint: 'from-grape-500 to-grape-600' },
      { label: 'Avg ticket', value: fmt(data?.summary?.avgTicket), icon: Receipt, tint: 'from-accent-500 to-accent-600' },
      { label: 'Items sold', value: data?.summary?.itemsSold ?? 0, icon: Utensils, tint: 'from-mint-500 to-mint-600' },
      { label: 'Discounts', value: fmt(data?.summary?.discountsTotal), icon: Percent, tint: 'from-rose-400 to-rose-500' },
      { label: 'Tax collected', value: fmt(data?.summary?.taxTotal), icon: Receipt, tint: 'from-ocean-500 to-ocean-600' },
    ],
    [data, sym]
  );

  const exportCsv = () => {
    if (!data) return;
    const lines = [
      `Analytics ${data.range?.from} to ${data.range?.to}`,
      `Filter: ${data.filters?.type}`,
      '',
      'Summary',
      `Revenue,${data.summary?.revenue}`,
      `Orders,${data.summary?.orders}`,
      `Avg ticket,${data.summary?.avgTicket}`,
      '',
      'By day,Date,Orders,Revenue',
      ...(data.byDay || []).map((d) => [d.date, d.orders, d.revenue].join(',')),
      '',
      'Top items,Name,Qty,Revenue',
      ...(data.byItem || []).map((i) => [escapeCsv(i.name), i.qty, i.revenue].join(',')),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${data.range?.from}-${data.range?.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  const dayChartData = (data?.byDay || []).map((d) => ({
    label: d.date.slice(5),
    revenue: d.revenue,
    orders: d.orders,
  }));

  const hourChartData = (data?.byHour || []).map((h) => ({
    label: h.label,
    revenue: h.revenue,
    orders: h.orders,
  }));

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title page-title-accent">Analytics</h1>
          <p className="text-slate-600 mt-1 text-sm">
            {data?.range
              ? `${formatDate(data.range.from)} — ${formatDate(data.range.to)}`
              : 'Sales insights & filters'}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} className="btn-secondary" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button type="button" onClick={exportCsv} className="btn-primary" disabled={!data}>
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="card p-4 mb-6 space-y-4">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Date range</p>
          <div className="flex flex-wrap gap-2">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={days === p.id && !customFrom ? 'filter-chip-active' : 'filter-chip-inactive'}
                onClick={() => {
                  setDays(p.id);
                  setCustomFrom('');
                  setCustomTo('');
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-3 gap-3 mt-3">
            <div>
              <label className="label text-xs">From</label>
              <input
                type="date"
                className="input py-2"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="label text-xs">To</label>
              <input
                type="date"
                className="input py-2"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                className="btn-secondary w-full"
                disabled={!customFrom || !customTo}
                onClick={load}
              >
                Apply custom range
              </button>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Order type</p>
          <div className="flex flex-wrap gap-2">
            {ORDER_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={orderType === t.id ? 'filter-chip-active' : 'filter-chip-inactive'}
                onClick={() => setOrderType(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Point of view</p>
          <div className="flex flex-wrap gap-2">
            {POV_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={`${pov === id ? 'filter-chip-active' : 'filter-chip-inactive'} flex items-center gap-1.5`}
                onClick={() => setPov(id)}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && !data ? (
        <div className="card p-16 text-center text-slate-500">Loading analytics…</div>
      ) : (
        <>
          {/* Summary — always visible */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {summaryCards.map(({ label, value, icon: Icon, tint }) => (
              <div key={label} className="card p-4 overflow-hidden relative">
                <div className={`absolute inset-0 opacity-[0.07] bg-gradient-to-br ${tint}`} />
                <div className="relative">
                  <Icon className="w-4 h-4 text-brand-600 mb-2" />
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">{label}</p>
                  <p className="text-xl font-bold text-ink-900 mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {pov === 'overview' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="card p-5">
                <h2 className="font-bold text-ink-900 mb-4">Revenue by day</h2>
                <BarChart data={dayChartData} formatValue={fmt} height={140} />
              </div>
              <div className="card p-5">
                <h2 className="font-bold text-ink-900 mb-4">By order type</h2>
                <ul className="space-y-3">
                  {(data?.byOrderType || []).map((row) => (
                    <li key={row.type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize font-medium">{row.type}</span>
                        <span>{fmt(row.revenue)} · {row.share}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-sage-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                          style={{ width: `${row.share}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {pov === 'time' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="card p-5">
                <h2 className="font-bold text-ink-900 mb-4">Daily revenue</h2>
                <BarChart data={dayChartData} formatValue={fmt} />
              </div>
              <div className="card p-5">
                <h2 className="font-bold text-ink-900 mb-4">Peak hours</h2>
                <BarChart
                  data={hourChartData}
                  valueKey="orders"
                  formatValue={(v) => `${v} orders`}
                />
              </div>
              <div className="card overflow-hidden lg:col-span-2">
                <table className="w-full text-sm">
                  <thead className="bg-brand-50 text-brand-800">
                    <tr>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-right p-4 font-medium">Orders</th>
                      <th className="text-right p-4 font-medium">Items</th>
                      <th className="text-right p-4 font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.byDay || []).map((day) => (
                      <tr key={day.date} className="border-t border-sage-100">
                        <td className="p-4">{formatDate(day.date)}</td>
                        <td className="p-4 text-right">{day.orders}</td>
                        <td className="p-4 text-right">{day.itemsSold}</td>
                        <td className="p-4 text-right font-semibold">{fmt(day.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {pov === 'menu' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="card p-5">
                <h2 className="font-bold text-ink-900 mb-4">Revenue by category</h2>
                <BarChart
                  data={(data?.byCategory || []).slice(0, 8).map((c) => ({
                    label: c.category,
                    revenue: c.revenue,
                  }))}
                  formatValue={fmt}
                />
              </div>
              <div className="card overflow-hidden">
                <h2 className="font-bold text-ink-900 p-4 border-b border-sage-100">Top menu items</h2>
                <table className="w-full text-sm">
                  <thead className="bg-sage-50 text-sage-700">
                    <tr>
                      <th className="text-left p-3 font-medium">Item</th>
                      <th className="text-right p-3 font-medium">Qty</th>
                      <th className="text-right p-3 font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.byItem || []).map((item, i) => (
                      <tr key={item.name} className="border-t border-sage-100">
                        <td className="p-3">
                          <span className="text-brand-600 font-bold mr-2">{i + 1}</span>
                          {item.name}
                        </td>
                        <td className="p-3 text-right">{item.qty}</td>
                        <td className="p-3 text-right font-semibold">{fmt(item.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {pov === 'operations' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="card p-5">
                <h2 className="font-bold text-ink-900 mb-4">Order channels</h2>
                <ul className="space-y-4">
                  {(data?.byOrderType || []).map((row) => (
                    <li key={row.type} className="flex items-center justify-between p-3 rounded-xl bg-sage-50">
                      <span className="capitalize font-semibold">{row.type}</span>
                      <div className="text-right">
                        <p className="font-bold">{fmt(row.revenue)}</p>
                        <p className="text-xs text-slate-500">{row.orders} orders</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card p-5">
                <h2 className="font-bold text-ink-900 mb-4">Payment methods</h2>
                <BarChart
                  data={(data?.byPayment || []).map((p) => ({
                    label: p.method,
                    revenue: p.amount,
                  }))}
                  formatValue={fmt}
                />
                <ul className="mt-4 space-y-2 text-sm">
                  {(data?.byPayment || []).map((p) => (
                    <li key={p.method} className="flex justify-between capitalize">
                      <span>{p.method}</span>
                      <span className="font-medium">
                        {fmt(p.amount)} · {p.count} payments
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card overflow-hidden lg:col-span-2">
                <h2 className="font-bold text-ink-900 p-4 border-b border-sage-100">Recent paid orders</h2>
                <table className="w-full text-sm">
                  <thead className="bg-sage-50">
                    <tr>
                      <th className="text-left p-3">Order</th>
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Table</th>
                      <th className="text-left p-3">Staff</th>
                      <th className="text-right p-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.orders || []).slice(0, 20).map((o) => (
                      <tr key={o.orderNumber} className="border-t border-sage-100">
                        <td className="p-3 font-medium">{o.orderNumber}</td>
                        <td className="p-3 text-slate-600">
                          {o.date} {o.time}
                        </td>
                        <td className="p-3 capitalize">{o.type}</td>
                        <td className="p-3">{o.table ? `T${o.table}` : '—'}</td>
                        <td className="p-3">{o.staff || '—'}</td>
                        <td className="p-3 text-right font-semibold">{fmt(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {pov === 'team' && (
            <div className="card overflow-hidden">
              <h2 className="font-bold text-ink-900 p-4 border-b border-sage-100">
                Performance by staff
              </h2>
              <table className="w-full text-sm">
                <thead className="bg-brand-50 text-brand-800">
                  <tr>
                    <th className="text-left p-4 font-medium">Staff</th>
                    <th className="text-left p-4 font-medium">Role</th>
                    <th className="text-right p-4 font-medium">Orders</th>
                    <th className="text-right p-4 font-medium">Revenue</th>
                    <th className="text-right p-4 font-medium">Avg / order</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.byStaff || []).map((s) => (
                    <tr key={s.staffId} className="border-t border-sage-100">
                      <td className="p-4 font-medium">{s.name}</td>
                      <td className="p-4 capitalize text-slate-600">{s.role}</td>
                      <td className="p-4 text-right">{s.orders}</td>
                      <td className="p-4 text-right font-semibold">{fmt(s.revenue)}</td>
                      <td className="p-4 text-right text-slate-600">
                        {fmt(s.orders ? s.revenue / s.orders : 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data?.byStaff?.length && (
                <p className="p-8 text-center text-slate-500">No staff data in this period</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
