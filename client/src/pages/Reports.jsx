import { useEffect, useState } from 'react';
import api from '../api/client';
import { formatMoney, formatDate } from '../utils/format';

export default function Reports() {
  const [sales, setSales] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/reports/sales?days=7'), api.get('/settings')]).then(([s, set]) => {
      setSales(s.data);
      setSettings(set.data);
    });
  }, []);

  const sym = settings?.currencySymbol || '$';

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="page-title">Sales Reports</h1>
        <p className="text-slate-600 mt-1 font-medium">Last 7 days</p>
      </header>

      <div className="grid sm:grid-cols-2 gap-5 mb-8">
        <div className="card p-6">
          <p className="text-sm text-sage-600">Total Revenue</p>
          <p className="text-3xl font-bold text-warm-900 mt-1">
            {formatMoney(sales?.totalRevenue, sym)}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-sage-600">Total Orders</p>
          <p className="text-3xl font-bold text-warm-900 mt-1">{sales?.totalOrders ?? 0}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-sage-50 text-sage-700">
            <tr>
              <th className="text-left p-4 font-medium">Date</th>
              <th className="text-left p-4 font-medium">Orders</th>
              <th className="text-left p-4 font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {sales?.byDay?.map((day) => (
              <tr key={day.date} className="border-t border-sage-100">
                <td className="p-4">{formatDate(day.date)}</td>
                <td className="p-4">{day.orders}</td>
                <td className="p-4 font-semibold">{formatMoney(day.revenue, sym)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!sales?.byDay?.length && (
          <p className="p-8 text-center text-sage-500">No sales data yet</p>
        )}
      </div>
    </div>
  );
}
