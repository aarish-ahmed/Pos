import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import api from '../api/client';
import { formatDate, formatMoney, formatTime } from '../utils/format';

export default function Receipt() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    Promise.all([api.get(`/orders/${id}`), api.get('/settings')]).then(([o, s]) => {
      setOrder(o.data);
      setSettings(s.data);
    });
  }, [id]);

  const symbol = settings?.currencySymbol || '$';
  const paymentSummary = useMemo(() => {
    if (!order?.payments?.length) return 'Unpaid';
    return order.payments.map((p) => `${p.method.toUpperCase()} ${formatMoney(p.amount, symbol)}`).join(', ');
  }, [order, symbol]);

  if (!order || !settings) {
    return <div className="p-8 text-sage-600">Loading receipt...</div>;
  }

  return (
    <div className="min-h-screen bg-cream-50 p-8 print:bg-white print:p-0">
      <div className="max-w-xl mx-auto card p-8 print:shadow-none print:border-none print:max-w-none">
        <div className="print:hidden flex justify-end mb-4">
          <button onClick={() => window.print()} className="btn-primary">
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
        </div>

        <div className="text-center border-b border-dashed border-sage-300 pb-4">
          <h1 className="text-2xl font-bold text-warm-900">{settings.restaurantName}</h1>
          {settings.address ? <p className="text-sm text-sage-600">{settings.address}</p> : null}
          {settings.phone ? <p className="text-sm text-sage-600">{settings.phone}</p> : null}
          <p className="text-sm text-sage-600 mt-2">
            {formatDate(order.createdAt)} {formatTime(order.createdAt)}
          </p>
        </div>

        <div className="py-4 space-y-1 text-sm border-b border-dashed border-sage-300">
          <div className="flex justify-between">
            <span className="text-sage-600">Order</span>
            <span className="font-medium">{order.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sage-600">Type</span>
            <span className="capitalize">{order.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sage-600">Table</span>
            <span>{order.table?.number ? `Table ${order.table.number}` : '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sage-600">Served by</span>
            <span>{order.createdBy?.name || '-'}</span>
          </div>
        </div>

        <div className="py-4 border-b border-dashed border-sage-300">
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item._id} className="flex justify-between text-sm">
                <span>
                  {item.quantity} x {item.name}
                </span>
                <span>{formatMoney(item.quantity * item.price, symbol)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="py-4 space-y-1 text-sm border-b border-dashed border-sage-300">
          <div className="flex justify-between">
            <span className="text-sage-600">Subtotal</span>
            <span>{formatMoney(order.subtotal, symbol)}</span>
          </div>
          {order.discount > 0 ? (
            <div className="flex justify-between">
              <span className="text-sage-600">Discount</span>
              <span>-{formatMoney(order.discount, symbol)}</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span className="text-sage-600">Tax</span>
            <span>{formatMoney(order.tax, symbol)}</span>
          </div>
          {order.serviceCharge > 0 ? (
            <div className="flex justify-between">
              <span className="text-sage-600">Service</span>
              <span>{formatMoney(order.serviceCharge, symbol)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-base font-bold text-warm-900 pt-2">
            <span>Total</span>
            <span>{formatMoney(order.total, symbol)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sage-600">Paid</span>
            <span>{formatMoney(order.amountPaid, symbol)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sage-600">Change</span>
            <span>{formatMoney(order.changeDue, symbol)}</span>
          </div>
        </div>

        <div className="pt-4 text-sm">
          <p className="text-sage-600">Payment: {paymentSummary}</p>
          <p className="text-center mt-4 text-sage-700">{settings.receiptFooter || 'Thank you!'}</p>
        </div>
      </div>
    </div>
  );
}
