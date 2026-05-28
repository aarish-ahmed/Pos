import { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import api from '../api/client';
import Badge from '../components/Badge';
import { formatMoney, formatDate, formatTime } from '../utils/format';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/orders?today=true'), api.get('/settings')]).then(([o, s]) => {
      setOrders(o.data);
      setSettings(s.data);
    });
  }, []);

  const sym = settings?.currencySymbol || '$';

  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="page-title">Order History</h1>
        <p className="text-slate-600 mt-1 font-medium">Today&apos;s orders</p>
      </header>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-sage-50 text-sage-700">
            <tr>
              <th className="text-left p-4 font-medium">Order</th>
              <th className="text-left p-4 font-medium">Type</th>
              <th className="text-left p-4 font-medium">Table</th>
              <th className="text-left p-4 font-medium">Items</th>
              <th className="text-left p-4 font-medium">Total</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-left p-4 font-medium">Time</th>
              <th className="text-left p-4 font-medium">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="border-t border-sage-100 hover:bg-cream-50">
                <td className="p-4 font-medium">{order.orderNumber}</td>
                <td className="p-4 capitalize">{order.type}</td>
                <td className="p-4">{order.table?.number ? `T${order.table.number}` : '—'}</td>
                <td className="p-4">{order.items.length}</td>
                <td className="p-4 font-semibold">{formatMoney(order.total, sym)}</td>
                <td className="p-4">
                  <Badge status={order.status} />
                </td>
                <td className="p-4 text-sage-600">
                  {formatDate(order.createdAt)} {formatTime(order.createdAt)}
                </td>
                <td className="p-4">
                  <button
                    className="btn-ghost !px-3 !py-1.5"
                    onClick={() => window.open(`/receipt/${order._id}`, '_blank', 'noopener,noreferrer')}
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!orders.length && (
          <p className="p-8 text-center text-sage-500">No orders today</p>
        )}
      </div>
    </div>
  );
}
