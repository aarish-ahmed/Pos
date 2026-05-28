import { useCallback, useEffect, useState } from 'react';
import { Plus, Minus, Send, CreditCard, Trash2, ShoppingBag, X, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { formatMoney, categoryGradients } from '../utils/format';
import { resolveImageUrl } from '../utils/imageUrl';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

export default function POS() {
  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [order, setOrder] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [payModal, setPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState('cash');
  const [payAmount, setPayAmount] = useState('');
  const [takeawayMode, setTakeawayMode] = useState(false);

  const sym = settings?.currencySymbol || '$';

  const loadFloor = useCallback(async () => {
    const [tRes, mRes, sRes] = await Promise.all([
      api.get('/tables?windowMinutes=120'),
      api.get('/menu/all'),
      api.get('/settings'),
    ]);
    setTables(tRes.data);
    setCategories(mRes.data.categories.filter((c) => c.isActive));
    setMenuItems(mRes.data.items.filter((i) => i.isAvailable));
    setSettings(sRes.data);
    if (!activeCategory && mRes.data.categories.length) {
      setActiveCategory(mRes.data.categories[0]._id);
    }
  }, [activeCategory]);

  useEffect(() => {
    loadFloor();
  }, [loadFloor]);

  const openOrder = async (table) => {
    if (table.currentOrder) {
      const { data } = await api.get(`/orders/${table.currentOrder._id || table.currentOrder}`);
      setOrder(data);
      setSelectedTable(table);
      return;
    }
    if (table.status === 'reserved' && table.activeReservation) {
      toast.error(
        `Reserved for ${table.activeReservation.customerName} (${table.activeReservation.partySize}). Use Reservations screen to seat/cancel.`
      );
      return;
    }
    const { data } = await api.post('/orders', { type: 'dine-in', table: table._id });
    setOrder(data);
    setSelectedTable(table);
    loadFloor();
    toast.success(`Order started for ${table.name}`);
  };

  const startTakeaway = async () => {
    const { data } = await api.post('/orders', { type: 'takeaway' });
    setOrder(data);
    setSelectedTable(null);
    setTakeawayMode(true);
    toast.success('Takeaway order started');
  };

  const addItem = async (item) => {
    if (!order) return;
    const { data } = await api.post(`/orders/${order._id}/items`, { menuItemId: item._id });
    setOrder(data);
  };

  const updateQty = async (itemId, quantity) => {
    const { data } = await api.patch(`/orders/${order._id}/items/${itemId}`, { quantity });
    setOrder(data);
  };

  const removeItem = async (itemId) => {
    const { data } = await api.delete(`/orders/${order._id}/items/${itemId}`);
    setOrder(data);
  };

  const sendToKitchen = async () => {
    try {
      const { data } = await api.post(`/orders/${order._id}/send`);
      setOrder(data);
      toast.success('Sent to kitchen');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handlePay = async () => {
    try {
      const amount = payAmount ? Number(payAmount) : order.total - order.amountPaid;
      const { data } = await api.post(`/orders/${order._id}/pay`, { method: payMethod, amount });
      setOrder(data);
      if (data.status === 'paid') {
        window.open(`/receipt/${data._id}`, '_blank', 'noopener,noreferrer');
        toast.success('Payment complete');
        setPayModal(false);
        setOrder(null);
        setSelectedTable(null);
        setTakeawayMode(false);
        loadFloor();
      } else {
        toast.success('Partial payment recorded');
        setPayAmount('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    }
  };

  const closeOrder = () => {
    setOrder(null);
    setSelectedTable(null);
    setTakeawayMode(false);
  };

  const filteredItems = menuItems.filter((i) => i.category?._id === activeCategory || i.category === activeCategory);
  const remaining = order ? Math.max(0, order.total - order.amountPaid) : 0;

  return (
    <div className="h-screen flex flex-col">
      <header className="px-6 py-4 border-b border-violet-100 bg-gradient-to-r from-white via-orange-50 to-violet-50 flex items-center justify-between">
        <div>
          <h1 className="page-title text-xl md:text-2xl">Floor & Orders</h1>
          <p className="text-sm text-slate-600 font-medium">Select a table or start takeaway</p>
        </div>
        <button onClick={startTakeaway} className="btn-primary">
          <ShoppingBag className="w-4 h-4" />
          Takeaway
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Tables */}
        <div className="w-72 border-r border-violet-100 bg-gradient-to-b from-violet-50 to-orange-50 p-4 overflow-y-auto">
          <h2 className="text-xs font-bold text-violet-700 uppercase tracking-wider mb-3">Tables</h2>
          <div className="grid grid-cols-2 gap-2">
            {tables.map((table) => (
              <button
                key={table._id}
                onClick={() => openOrder(table)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  selectedTable?._id === table._id
                    ? 'border-brand-500 bg-gradient-to-br from-orange-100 to-rose-100 ring-2 ring-brand-400 shadow-md scale-[1.02]'
                    : 'border-violet-100 bg-white hover:border-violet-300 hover:shadow-card'
                }`}
              >
                <p className="font-bold text-ink-900">T{table.number}</p>
                <p className="text-xs text-violet-600 font-medium">{table.zone}</p>
                <Badge status={table.status} />
                {table.activeReservation && table.status === 'reserved' && (
                  <p className="text-[11px] text-amber-700 mt-1 truncate">
                    {table.activeReservation.customerName} · {table.activeReservation.partySize}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Menu */}
        <div className="flex-1 flex flex-col bg-white/90 overflow-hidden">
          {!order ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-400 to-grape-500 flex items-center justify-center text-4xl mb-4 shadow-glow">
                🍽️
              </div>
              <p className="font-semibold text-ink-800">Pick a table to start ordering</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-violet-100 flex gap-2 overflow-x-auto bg-gradient-to-r from-violet-50 to-cyan-50">
                {categories.map((cat, idx) => {
                  const grad = categoryGradients[idx % categoryGradients.length];
                  const active = activeCategory === cat._id;
                  return (
                  <button
                    key={cat._id}
                    onClick={() => setActiveCategory(cat._id)}
                    className={`px-4 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
                      active
                        ? `bg-gradient-to-r ${grad} text-white scale-105 shadow-md`
                        : 'bg-white text-ink-800 border-2 border-violet-100 hover:border-violet-300'
                    }`}
                  >
                    {cat.name}
                  </button>
                );})}
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredItems.map((item) => (
                    <button
                      key={item._id}
                      onClick={() => addItem(item)}
                      className="card p-0 text-left overflow-hidden border-2 border-transparent hover:border-brand-400 hover:shadow-glow transition-all group"
                    >
                      {item.image ? (
                        <img
                          src={resolveImageUrl(item.image)}
                          alt={item.name}
                          className="w-full h-28 object-cover rounded-xl"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = FALLBACK_IMAGE;
                          }}
                        />
                      ) : (
                        <div className="w-full h-28 rounded-xl bg-gradient-to-br from-violet-200 via-pink-200 to-orange-200 flex items-center justify-center text-violet-700 text-2xl font-bold">
                          {item.name?.charAt(0)?.toUpperCase() || 'F'}
                        </div>
                      )}
                      <div className="p-3 bg-gradient-to-br from-white to-violet-50">
                        <p className="font-bold text-ink-900 group-hover:text-brand-600 transition">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.description}</p>
                        )}
                        <p className="inline-block mt-2 px-2.5 py-1 rounded-lg bg-gradient-to-r from-brand-500 to-rose-500 text-white text-sm font-bold shadow">
                          {formatMoney(item.price, sym)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Order panel */}
        {order && (
          <div className="w-96 border-l border-violet-100 bg-gradient-to-b from-orange-50 to-violet-50 flex flex-col shadow-xl">
            <div className="p-4 border-b border-violet-100 bg-gradient-to-r from-violet-600 to-brand-500 text-white flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">
                  {takeawayMode ? 'Takeaway' : selectedTable ? `Table ${selectedTable.number}` : 'Order'}
                </p>
                <p className="text-xs text-white/80">{order.orderNumber}</p>
              </div>
              <button onClick={closeOrder} className="p-1.5 rounded-lg hover:bg-white/20 text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {order.items.length === 0 ? (
                <p className="text-sm text-sage-500 text-center py-8">Add items from the menu</p>
              ) : (
                order.items.map((item) => (
                  <div key={item._id} className="card p-3">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm">{item.name}</p>
                      <button onClick={() => removeItem(item._id)} className="text-sage-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQty(item._id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center hover:bg-violet-200"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item._id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center hover:bg-violet-200"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold">
                        {formatMoney(item.price * item.quantity, sym)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-violet-100 bg-white space-y-3">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-sage-600">
                  <span>Subtotal</span>
                  <span>{formatMoney(order.subtotal, sym)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatMoney(order.discount, sym)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sage-600">
                  <span>Tax</span>
                  <span>{formatMoney(order.tax, sym)}</span>
                </div>
                {order.serviceCharge > 0 && (
                  <div className="flex justify-between text-sage-600">
                    <span>Service</span>
                    <span>{formatMoney(order.serviceCharge, sym)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 px-2 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-rose-500 text-white">
                  <span>Total</span>
                  <span>{formatMoney(order.total, sym)}</span>
                </div>
                {order.amountPaid > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Due</span>
                    <span>{formatMoney(remaining, sym)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={sendToKitchen} className="btn-secondary flex-1" disabled={!order.items.length}>
                  <Send className="w-4 h-4" />
                  Kitchen
                </button>
                <button
                  onClick={() => window.open(`/receipt/${order._id}`, '_blank', 'noopener,noreferrer')}
                  className="btn-secondary"
                  title="Print receipt"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setPayAmount(String(remaining.toFixed(2)));
                    setPayModal(true);
                  }}
                  className="btn-primary flex-1"
                  disabled={!order.items.length}
                >
                  <CreditCard className="w-4 h-4" />
                  Pay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal open={payModal} onClose={() => setPayModal(false)} title="Process Payment">
        <div className="space-y-4">
          <p className="text-2xl font-bold text-center text-warm-900">
            {formatMoney(remaining, sym)}
          </p>
          <div>
            <label className="label">Payment method</label>
            <select className="input" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="mobile">Mobile Pay</option>
            </select>
          </div>
          <div>
            <label className="label">Amount</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />
          </div>
          <button onClick={handlePay} className="btn-primary w-full">
            Confirm Payment
          </button>
        </div>
      </Modal>
    </div>
  );
}
