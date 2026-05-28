import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import Badge from '../components/Badge';
import { formatTime } from '../utils/format';

export default function Kitchen() {
  const [orders, setOrders] = useState([]);

  const load = useCallback(async () => {
    const { data } = await api.get('/orders/kitchen');
    setOrders(data);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [load]);

  const updateItemStatus = async (orderId, itemId, status) => {
    await api.patch(`/orders/${orderId}/items/${itemId}`, { status });
    if (status === 'ready') {
      const order = orders.find((o) => o._id === orderId);
      const allReady = order?.items.every((i) => i._id === itemId || i.status === 'ready' || i.status === 'served');
      if (allReady) await api.patch(`/orders/${orderId}/status`, { status: 'ready' });
    }
    toast.success(`Item marked ${status}`);
    load();
  };

  const markOrderReady = async (orderId) => {
    await api.patch(`/orders/${orderId}/status`, { status: 'ready' });
    toast.success('Order ready for pickup');
    load();
  };

  return (
    <div className="p-8">
      <header className="mb-8 flex items-center justify-between surface p-6 border-l-4 border-l-orange-500">
        <div>
          <h1 className="page-title">Kitchen Display</h1>
          <p className="text-slate-600 mt-1 font-medium">Active tickets · auto-refreshes</p>
        </div>
        <button onClick={load} className="btn-secondary">
          <Clock className="w-4 h-4" />
          Refresh
        </button>
      </header>

      {orders.length === 0 ? (
        <div className="card p-16 text-center">
          <CheckCircle className="w-12 h-12 text-sage-300 mx-auto mb-3" />
          <p className="text-sage-600">No active kitchen orders</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {orders.map((order) => (
            <div key={order._id} className="card overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-orange-600 via-red-500 to-rose-600 text-white flex justify-between items-center">
                <div>
                  <p className="font-bold text-lg">
                    {order.table ? `Table ${order.table.number}` : order.type}
                  </p>
                  <p className="text-sage-200 text-sm">{order.orderNumber}</p>
                </div>
                <div className="text-right">
                  <Badge status={order.status} />
                  <p className="text-xs text-sage-200 mt-1">{formatTime(order.updatedAt)}</p>
                </div>
              </div>
              <ul className="p-4 space-y-3">
                {order.items
                  .filter((i) => !['served', 'cancelled'].includes(i.status))
                  .map((item) => (
                    <li key={item._id} className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-sage-700 mr-2">{item.quantity}×</span>
                        <span className="font-medium">{item.name}</span>
                        {item.notes && <p className="text-xs text-amber-700 mt-0.5">{item.notes}</p>}
                      </div>
                      <div className="flex gap-1">
                        {item.status === 'preparing' && (
                          <button
                            onClick={() => updateItemStatus(order._id, item._id, 'ready')}
                            className="text-xs btn-primary py-1 px-2"
                          >
                            Ready
                          </button>
                        )}
                        {item.status === 'pending' && (
                          <button
                            onClick={() => updateItemStatus(order._id, item._id, 'preparing')}
                            className="text-xs btn-secondary py-1 px-2"
                          >
                            Start
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
              </ul>
              {order.status !== 'ready' && (
                <div className="px-4 pb-4">
                  <button onClick={() => markOrderReady(order._id)} className="btn-primary w-full text-sm">
                    Mark order ready
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
