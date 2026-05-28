import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingBag, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import api from '../api/client';
import { formatMoney } from '../utils/format';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/reports/dashboard'), api.get('/settings')]).then(([dash, set]) => {
      setData(dash.data);
      setSettings(set.data);
    });
  }, []);

  const sym = settings?.currencySymbol || '$';

  const stats = [
    {
      label: "Today's Revenue",
      value: formatMoney(data?.revenue, sym),
      icon: DollarSign,
      card: 'bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400',
      iconBg: 'bg-white/25 text-white',
    },
    {
      label: 'Orders Today',
      value: data?.orderCount ?? '—',
      icon: ShoppingBag,
      card: 'bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500',
      iconBg: 'bg-white/25 text-white',
    },
    {
      label: 'Avg Ticket',
      value: formatMoney(data?.avgTicket, sym),
      icon: TrendingUp,
      card: 'bg-gradient-to-br from-violet-600 via-purple-500 to-indigo-500',
      iconBg: 'bg-white/25 text-white',
    },
    {
      label: 'Open Orders',
      value: data?.openOrders ?? '—',
      icon: Clock,
      card: 'bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-500',
      iconBg: 'bg-white/25 text-white',
    },
  ];

  return (
    <div className="p-8">
      <header className="mb-8 surface p-6 border-l-4 border-l-brand-500">
        <h1 className="page-title">{settings?.restaurantName || 'Dashboard'}</h1>
        <p className="text-slate-600 mt-2 font-medium">Daily operations at a glance</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {stats.map(({ label, value, icon: Icon, card, iconBg }) => (
          <div key={label} className={`${card} rounded-2xl p-5 text-white shadow-card hover:scale-[1.02] transition-transform`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/90 font-medium">{label}</p>
                <p className="text-3xl font-bold mt-1 drop-shadow-sm">{value}</p>
              </div>
              <div className={`p-3 rounded-xl ${iconBg}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6 border-t-4 border-t-emerald-500">
          <h2 className="font-bold text-ink-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-6 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500" />
            Top Items Today
          </h2>
          {data?.topItems?.length ? (
            <ul className="space-y-3">
              {data.topItems.map((item, i) => (
                <li key={item.name} className="flex items-center justify-between p-2 rounded-xl hover:bg-violet-50 transition">
                  <span className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-rose-500 text-white text-xs font-bold flex items-center justify-center shadow">
                      {i + 1}
                    </span>
                    <span className="font-semibold text-ink-800">{item.name}</span>
                  </span>
                  <span className="text-sm font-medium text-violet-700">
                    {item.qty} sold · {formatMoney(item.revenue, sym)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-sm">No sales yet today</p>
          )}
        </div>

        <div className="card p-6 border-t-4 border-t-violet-500">
          <h2 className="font-bold text-ink-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-6 rounded-full bg-gradient-to-b from-violet-400 to-fuchsia-500" />
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              to="/pos"
              className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-md hover:shadow-glow transition group"
            >
              <span className="font-semibold">Open floor & take orders</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </Link>
            <Link
              to="/kitchen"
              className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-500 to-red-500 text-white shadow-md hover:shadow-lg transition group"
            >
              <span className="font-semibold">Kitchen display</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </Link>
            <Link
              to="/reservations"
              className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 text-white shadow-md hover:shadow-vivid transition group"
            >
              <span className="font-semibold">Manage reservations</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
