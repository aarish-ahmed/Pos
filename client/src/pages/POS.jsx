import { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  Minus,
  Send,
  CreditCard,
  Trash2,
  ShoppingBag,
  X,
  Printer,
  Play,
  CheckCircle,
  Sparkles,
  Percent,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { formatMoney, categoryGradients } from '../utils/format';
import { resolveImageUrl } from '../utils/imageUrl';
import { useAuth } from '../context/AuthContext';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

const hasOpenOrder = (table) => {
  const order = table?.currentOrder;
  if (!order) return false;
  const status = typeof order === 'object' ? order.status : null;
  return status ? !['paid', 'cancelled'].includes(status) : true;
};

export default function POS() {
  const { can } = useAuth();
  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [order, setOrder] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [payModal, setPayModal] = useState(false);
  const [discountModal, setDiscountModal] = useState(false);
  const [payMethod, setPayMethod] = useState('cash');
  const [payAmount, setPayAmount] = useState('');
  const [discountMode, setDiscountMode] = useState('fixed');
  const [discountValue, setDiscountValue] = useState('');
  const [takeawayMode, setTakeawayMode] = useState(false);
  const [sidePanelTab, setSidePanelTab] = useState('tables');
  const [takeawayView, setTakeawayView] = useState('active');
  const [takeawayOrders, setTakeawayOrders] = useState([]);
  const [takeawayActiveCount, setTakeawayActiveCount] = useState(0);
  const [selectedTakeawayId, setSelectedTakeawayId] = useState(null);
  const [tableBusy, setTableBusy] = useState(false);

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
    return tRes.data;
  }, [activeCategory]);

  const loadTakeawayActiveCount = useCallback(async () => {
    try {
      const { data } = await api.get('/orders/takeaway?view=active');
      setTakeawayActiveCount(data.length);
      return data.length;
    } catch {
      return 0;
    }
  }, []);

  const loadTakeawayOrders = useCallback(async () => {
    try {
      const { data } = await api.get(`/orders/takeaway?view=${takeawayView}`);
      setTakeawayOrders(data);
      if (takeawayView === 'active') setTakeawayActiveCount(data.length);
      return data;
    } catch {
      return [];
    }
  }, [takeawayView]);

  useEffect(() => {
    loadFloor();
    loadTakeawayActiveCount();
    const badgeInterval = setInterval(loadTakeawayActiveCount, 10000);
    return () => clearInterval(badgeInterval);
  }, [loadFloor, loadTakeawayActiveCount]);

  useEffect(() => {
    if (sidePanelTab === 'takeaway') loadTakeawayOrders();
  }, [sidePanelTab, takeawayView, loadTakeawayOrders]);

  useEffect(() => {
    if (sidePanelTab !== 'takeaway') return;
    const interval = setInterval(loadTakeawayOrders, 8000);
    return () => clearInterval(interval);
  }, [sidePanelTab, loadTakeawayOrders]);

  useEffect(() => {
    if (!order?._id) return;
    const refreshOrder = async () => {
      try {
        const { data } = await api.get(`/orders/${order._id}`);
        setOrder(data);
        if (takeawayMode) loadTakeawayOrders();
      } catch {
        /* ignore poll errors */
      }
    };
    const interval = setInterval(refreshOrder, 5000);
    return () => clearInterval(interval);
  }, [order?._id, takeawayMode, loadTakeawayOrders]);

  const syncSelectedTable = (allTables) => {
    if (!selectedTable) return;
    const fresh = allTables.find((t) => t._id === selectedTable._id);
    if (fresh) setSelectedTable(fresh);
  };

  const selectTable = (table) => {
    setSidePanelTab('tables');
    setSelectedTable(table);
    setTakeawayMode(false);
    setSelectedTakeawayId(null);
    setOrder(null);
  };

  const startTableOrder = async () => {
    if (!selectedTable) return;
    if (selectedTable.status === 'reserved' && selectedTable.activeReservation) {
      toast.error(
        `Reserved for ${selectedTable.activeReservation.customerName}. Seat from Reservations first.`
      );
      return;
    }
    if (hasOpenOrder(selectedTable)) {
      await openTableOrder(selectedTable);
      return;
    }
    setTableBusy(true);
    try {
      const { data } = await api.post('/orders', { type: 'dine-in', table: selectedTable._id });
      setOrder(data);
      const all = await loadFloor();
      syncSelectedTable(all);
      toast.success(`Order started — Table ${selectedTable.number}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start order');
    } finally {
      setTableBusy(false);
    }
  };

  const openTableOrder = async (table = selectedTable) => {
    if (!table?.currentOrder) return;
    const orderId = table.currentOrder._id || table.currentOrder;
    setTableBusy(true);
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      setOrder(data);
      setSelectedTable(table);
      setTakeawayMode(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load order');
    } finally {
      setTableBusy(false);
    }
  };

  const setTableStatus = async (status) => {
    if (!selectedTable) return;
    setTableBusy(true);
    try {
      const { data } = await api.patch(`/tables/${selectedTable._id}/status`, { status });
      toast.success(`Table ${selectedTable.number} → ${status}`);
      if (['available', 'cleaning'].includes(status)) {
        setOrder(null);
      }
      setSelectedTable(data);
      const all = await loadFloor();
      syncSelectedTable(all);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    } finally {
      setTableBusy(false);
    }
  };

  const cancelCurrentOrder = async () => {
    const orderId =
      order?._id ||
      (takeawayMode ? selectedTakeawayId : null) ||
      selectedTable?.currentOrder?._id ||
      selectedTable?.currentOrder;
    if (!orderId) return;
    if (!window.confirm('Cancel this order?')) return;
    setTableBusy(true);
    try {
      await api.post(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled');
      setOrder(null);
      setSelectedTakeawayId(null);
      setTakeawayMode(false);
      const wasTakeaway = takeawayMode || sidePanelTab === 'takeaway';
      if (wasTakeaway) {
        await loadTakeawayOrders();
      } else {
        const all = await loadFloor();
        syncSelectedTable(all);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed');
    } finally {
      setTableBusy(false);
    }
  };

  const openTakeawayOrder = async (entry) => {
    const orderId = entry?._id || entry;
    if (!orderId) return;
    setTableBusy(true);
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      setOrder(data);
      setSelectedTable(null);
      setTakeawayMode(true);
      setSelectedTakeawayId(data._id);
      setSidePanelTab('takeaway');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load order');
    } finally {
      setTableBusy(false);
    }
  };

  const startTakeaway = async () => {
    setSidePanelTab('takeaway');
    setTakeawayView('active');
    setSelectedTable(null);
    setTableBusy(true);
    try {
      const { data } = await api.post('/orders', { type: 'takeaway' });
      setOrder(data);
      setTakeawayMode(true);
      setSelectedTakeawayId(data._id);
      await loadTakeawayOrders();
      toast.success('Takeaway order started');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start takeaway');
    } finally {
      setTableBusy(false);
    }
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
      if (takeawayMode) loadTakeawayOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const applyDiscount = async () => {
    if (!order) return;
    try {
      const payload =
        discountMode === 'percent'
          ? { percent: Number(discountValue) }
          : { discount: Number(discountValue) };
      const { data } = await api.post(`/orders/${order._id}/discount`, payload);
      setOrder(data);
      setDiscountModal(false);
      toast.success('Discount applied');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Discount failed');
    }
  };

  const clearDiscount = async () => {
    if (!order) return;
    try {
      const { data } = await api.post(`/orders/${order._id}/discount`, { discount: 0 });
      setOrder(data);
      toast.success('Discount removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const openPayModal = () => {
    setPayAmount(String(remaining.toFixed(2)));
    setPayMethod('cash');
    setPayModal(true);
  };

  const setSplitPayment = (parts) => {
    if (!order || parts < 1) return;
    const each = Math.ceil((remaining / parts) * 100) / 100;
    setPayAmount(each.toFixed(2));
    toast(`Split ${parts} ways — ${formatMoney(each, sym)} each`, { icon: '💳' });
  };

  const handlePay = async () => {
    const wasTakeaway = takeawayMode;
    try {
      const amount = payAmount ? Number(payAmount) : order.total - order.amountPaid;
      const { data } = await api.post(`/orders/${order._id}/pay`, { method: payMethod, amount });
      setOrder(data);
      if (data.status === 'paid') {
        window.open(`/receipt/${data._id}`, '_blank', 'noopener,noreferrer');
        toast.success(wasTakeaway ? 'Takeaway paid — order complete' : 'Payment complete');
        setPayModal(false);
        setOrder(null);
        setSelectedTakeawayId(null);
        setTakeawayMode(false);
        if (wasTakeaway || sidePanelTab === 'takeaway') {
          setTakeawayView('completed');
          await loadTakeawayOrders();
        } else {
          const all = await loadFloor();
          if (selectedTable) syncSelectedTable(all);
        }
      } else {
        toast.success('Partial payment recorded');
        setPayAmount('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    }
  };

  const closeOrderPanel = () => {
    setOrder(null);
  };

  const filteredItems = menuItems.filter(
    (i) => i.category?._id === activeCategory || i.category === activeCategory
  );
  const remaining = order ? Math.max(0, order.total - order.amountPaid) : 0;
  const tableHasOpenOrder = selectedTable && hasOpenOrder(selectedTable);
  const kitchenAlreadySent =
    order && ['sent', 'preparing', 'ready'].includes(order.status);
  const orderIsReady = order?.status === 'ready';
  const orderItemsLocked =
    order &&
    ['sent', 'preparing', 'ready'].includes(order.status) &&
    !can('orders.edit_after_sent');

  return (
    <div className="h-screen flex flex-col">
      <header className="px-6 py-4 border-b border-sage-100 bg-white/80 backdrop-blur flex items-center justify-between">
        <div>
          <h1 className="page-title text-xl md:text-2xl page-title-accent">Floor & Orders</h1>
          <p className="text-sm text-slate-600 font-medium">
            Dine-in tables or takeaway queue — pick an order to pay or manage
          </p>
        </div>
        <button
          type="button"
          onClick={startTakeaway}
          className="btn-primary"
          disabled={tableBusy}
        >
          <ShoppingBag className="w-4 h-4" />
          New takeaway
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Side panel: tables or takeaway list */}
        <div className="w-80 border-r border-sage-100 bg-gradient-to-b from-brand-50/50 to-cream-50 flex flex-col overflow-hidden">
          <div className="flex border-b border-sage-100 bg-white/80">
            <button
              type="button"
              className={`flex-1 py-3 text-sm font-semibold ${
                sidePanelTab === 'tables'
                  ? 'text-brand-700 border-b-2 border-brand-600 bg-brand-50/50'
                  : 'text-slate-500 hover:bg-sage-50'
              }`}
              onClick={() => setSidePanelTab('tables')}
            >
              Tables
            </button>
            <button
              type="button"
              className={`flex-1 py-3 text-sm font-semibold relative ${
                sidePanelTab === 'takeaway'
                  ? 'text-brand-700 border-b-2 border-brand-600 bg-brand-50/50'
                  : 'text-slate-500 hover:bg-sage-50'
              }`}
              onClick={() => {
                setSidePanelTab('takeaway');
                loadTakeawayOrders();
              }}
            >
              Takeaway
              {takeawayActiveCount > 0 && sidePanelTab !== 'takeaway' && (
                <span className="absolute top-2 right-3 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center">
                  {takeawayActiveCount}
                </span>
              )}
            </button>
          </div>

          {sidePanelTab === 'tables' ? (
          <div className="p-4 overflow-y-auto flex-1">
            <h2 className="text-xs font-bold text-brand-800 uppercase tracking-wider mb-3">Floor</h2>
            <div className="grid grid-cols-2 gap-2">
              {tables.map((table) => (
                <button
                  key={table._id}
                  type="button"
                  onClick={() => selectTable(table)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    selectedTable?._id === table._id
                      ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-300 shadow-md'
                      : 'border-sage-100 bg-white hover:border-brand-200'
                  }`}
                >
                  <p className="font-bold text-ink-900">T{table.number}</p>
                  <p className="text-xs text-slate-500 font-medium">{table.zone}</p>
                  <Badge status={table.status} />
                  {typeof table.currentOrder === 'object' && table.currentOrder?.status && (
                    <p className="text-[10px] font-bold mt-1 text-brand-700 capitalize">
                      Bill: {table.currentOrder.status}
                    </p>
                  )}
                  {table.activeReservation && table.status === 'reserved' && (
                    <p className="text-[11px] text-amber-700 mt-1 truncate">
                      {table.activeReservation.customerName}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
          ) : (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="p-3 flex gap-2 border-b border-sage-100 bg-white/60">
              <button
                type="button"
                className={takeawayView === 'active' ? 'filter-chip-active flex-1' : 'filter-chip-inactive flex-1'}
                onClick={() => setTakeawayView('active')}
              >
                Active
              </button>
              <button
                type="button"
                className={takeawayView === 'completed' ? 'filter-chip-active flex-1' : 'filter-chip-inactive flex-1'}
                onClick={() => setTakeawayView('completed')}
              >
                Paid today
              </button>
            </div>
            <div className="p-3 overflow-y-auto flex-1 space-y-2">
              {takeawayOrders.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">
                  {takeawayView === 'active'
                    ? 'No active takeaway orders. Tap New takeaway above.'
                    : 'No completed takeaway orders today.'}
                </p>
              ) : (
                takeawayOrders.map((tOrder) => {
                  const isSelected = selectedTakeawayId === tOrder._id;
                  const due = Math.max(0, (tOrder.total || 0) - (tOrder.amountPaid || 0));
                  return (
                    <button
                      key={tOrder._id}
                      type="button"
                      disabled={tableBusy}
                      onClick={() => openTakeawayOrder(tOrder)}
                      className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200'
                          : 'border-sage-100 bg-white hover:border-brand-200'
                      } ${tOrder.status === 'ready' ? 'ring-1 ring-emerald-300' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-ink-900">{tOrder.orderNumber}</p>
                          {tOrder.customerName && (
                            <p className="text-xs text-slate-600 truncate">{tOrder.customerName}</p>
                          )}
                        </div>
                        <Badge status={tOrder.status} />
                      </div>
                      <div className="flex justify-between mt-2 text-xs">
                        <span className="text-slate-500">
                          {tOrder.items?.length || 0} items
                        </span>
                        <span className="font-semibold text-brand-700">
                          {tOrder.status === 'paid'
                            ? formatMoney(tOrder.total, sym)
                            : `${formatMoney(due, sym)} due`}
                        </span>
                      </div>
                      {tOrder.status === 'ready' && takeawayView === 'active' && (
                        <p className="text-[11px] font-semibold text-emerald-700 mt-1.5">
                          Ready for pickup — tap to pay
                        </p>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
          )}

          {sidePanelTab === 'tables' && selectedTable && (
            <div className="border-t border-sage-200 bg-white p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-ink-900">Table {selectedTable.number}</p>
                  <p className="text-xs text-slate-500">{selectedTable.zone}</p>
                </div>
                <Badge status={selectedTable.status} />
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Click a table to manage it. Starting an order only happens when you press{' '}
                <strong>Start order</strong> or <strong>Open order</strong>.
              </p>

              <div className="grid grid-cols-1 gap-2">
                {tableHasOpenOrder ? (
                  <button
                    type="button"
                    className="btn-primary w-full text-sm"
                    disabled={tableBusy}
                    onClick={() => openTableOrder()}
                  >
                    <Play className="w-4 h-4" />
                    Open order
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-primary w-full text-sm"
                    disabled={tableBusy || selectedTable.status === 'reserved'}
                    onClick={startTableOrder}
                  >
                    <Play className="w-4 h-4" />
                    Start order
                  </button>
                )}

                {can('tables.status') && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="btn-secondary text-xs py-2"
                      disabled={tableBusy || tableHasOpenOrder}
                      onClick={() => setTableStatus('available')}
                      title={tableHasOpenOrder ? 'Close order first' : 'Mark available'}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Available
                    </button>
                    <button
                      type="button"
                      className="btn-secondary text-xs py-2"
                      disabled={tableBusy || tableHasOpenOrder}
                      onClick={() => setTableStatus('cleaning')}
                      title={tableHasOpenOrder ? 'Close order first' : 'Needs cleaning'}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Cleaning
                    </button>
                  </div>
                )}

                {tableHasOpenOrder && can('orders.cancel') && (
                  <button
                    type="button"
                    className="btn-danger w-full text-xs py-2"
                    disabled={tableBusy}
                    onClick={cancelCurrentOrder}
                  >
                    Void / cancel order
                  </button>
                )}
              </div>
            </div>
          )}

          {sidePanelTab === 'takeaway' && selectedTakeawayId && !order && (
            <div className="border-t border-sage-200 bg-white p-4">
              <button
                type="button"
                className="btn-primary w-full text-sm"
                disabled={tableBusy}
                onClick={() => {
                  const entry = takeawayOrders.find((o) => o._id === selectedTakeawayId);
                  if (entry) openTakeawayOrder(entry);
                }}
              >
                <Play className="w-4 h-4" />
                Open order
              </button>
            </div>
          )}

          {sidePanelTab === 'takeaway' && order && takeawayMode && can('orders.cancel') && (
            <div className="border-t border-sage-200 bg-white p-4">
              <button
                type="button"
                className="btn-danger w-full text-xs py-2"
                disabled={tableBusy || order.status === 'paid'}
                onClick={cancelCurrentOrder}
              >
                Void / cancel takeaway
              </button>
            </div>
          )}
        </div>

        {/* Menu */}
        <div className="flex-1 flex flex-col bg-white/90 overflow-hidden">
          {!order ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-4xl mb-4 shadow-glow">
                {sidePanelTab === 'takeaway' ? '🥡' : selectedTable ? '🪑' : '🍽️'}
              </div>
              {sidePanelTab === 'takeaway' ? (
                <>
                  <p className="font-semibold text-ink-800">Takeaway orders</p>
                  <p className="text-sm mt-2 max-w-xs">
                    Select an order from the <strong>Takeaway</strong> list to pay, print, or
                    cancel. Orders marked <strong>ready</strong> are waiting for pickup.
                  </p>
                </>
              ) : selectedTable ? (
                <>
                  <p className="font-semibold text-ink-800">
                    Table {selectedTable.number} selected
                  </p>
                  <p className="text-sm mt-2 max-w-xs">
                    Use <strong>Start order</strong> on the left, or set status to Available / Cleaning
                    without opening a bill.
                  </p>
                </>
              ) : (
                <p className="font-semibold text-ink-800">Select a table or open a takeaway order</p>
              )}
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
                  );
                })}
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredItems.map((item) => (
                    <button
                      key={item._id}
                      onClick={() => {
                        if (orderItemsLocked) {
                          toast.error('Cannot add items — order is already in the kitchen');
                          return;
                        }
                        addItem(item);
                      }}
                      disabled={orderItemsLocked}
                      className="card p-0 text-left overflow-hidden border-2 border-transparent hover:border-brand-400 hover:shadow-glow transition-all group disabled:opacity-50"
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
                        <p className="font-bold text-ink-900 group-hover:text-brand-600 transition">
                          {item.name}
                        </p>
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
                <div className="mt-1">
                  <Badge status={order.status} />
                </div>
              </div>
              <button
                onClick={closeOrderPanel}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white"
                title="Close panel (table stays as-is)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {orderItemsLocked && (
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-2">
                  Order is in the kitchen — only a manager can change items now.
                </p>
              )}
              {order.items.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">Add items from the menu</p>
              ) : (
                order.items.map((item) => (
                  <div key={item._id} className="card p-3">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm">{item.name}</p>
                      {!orderItemsLocked && (
                        <button
                          onClick={() => removeItem(item._id)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQty(item._id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center hover:bg-violet-200"
                          disabled={item.quantity <= 1 || orderItemsLocked}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item._id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center hover:bg-violet-200"
                          disabled={orderItemsLocked}
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
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatMoney(order.subtotal, sym)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatMoney(order.discount, sym)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Tax</span>
                  <span>{formatMoney(order.tax, sym)}</span>
                </div>
                {order.serviceCharge > 0 && (
                  <div className="flex justify-between text-slate-600">
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

              {orderIsReady && (
                <p className="text-sm font-semibold text-center text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl py-2">
                  Food is ready — serve this table
                </p>
              )}
              {kitchenAlreadySent && !orderIsReady && (
                <p className="text-xs text-center text-amber-700 bg-amber-50 rounded-lg py-2 border border-amber-200">
                  Sent to kitchen — waiting for prep
                </p>
              )}

              <div className="flex gap-2 flex-wrap">
                {can('orders.send_kitchen') && (
                  <button
                    onClick={sendToKitchen}
                    className="btn-secondary flex-1 min-w-[100px]"
                    disabled={!order.items.length || kitchenAlreadySent}
                    title={
                      kitchenAlreadySent
                        ? 'Already sent to kitchen (or already ready)'
                        : 'Send order to kitchen'
                    }
                  >
                    <Send className="w-4 h-4" />
                    {kitchenAlreadySent ? 'In kitchen' : 'Kitchen'}
                  </button>
                )}
                {can('orders.discount') && (
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountMode('fixed');
                      setDiscountValue(order.discount > 0 ? String(order.discount) : '');
                      setDiscountModal(true);
                    }}
                    className="btn-secondary"
                    disabled={!order.items.length || order.status === 'paid'}
                    title="Apply discount"
                  >
                    <Percent className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => window.open(`/receipt/${order._id}`, '_blank', 'noopener,noreferrer')}
                  className="btn-secondary"
                  title="Print receipt"
                >
                  <Printer className="w-4 h-4" />
                </button>
                {can('orders.pay') && (
                  <button
                    onClick={openPayModal}
                    className="btn-primary flex-1 min-w-[100px]"
                    disabled={!order.items.length}
                  >
                    <CreditCard className="w-4 h-4" />
                    Pay
                  </button>
                )}
              </div>
              {!can('orders.pay') && (
                <p className="text-xs text-center text-slate-500">Payments are handled at the cashier station.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal open={discountModal} onClose={() => setDiscountModal(false)} title="Apply discount">
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 ${
                discountMode === 'fixed'
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-violet-100'
              }`}
              onClick={() => setDiscountMode('fixed')}
            >
              Fixed amount
            </button>
            <button
              type="button"
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 ${
                discountMode === 'percent'
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-violet-100'
              }`}
              onClick={() => setDiscountMode('percent')}
            >
              Percent %
            </button>
          </div>
          <div>
            <label className="label">
              {discountMode === 'percent' ? 'Discount percent' : 'Discount amount'}
            </label>
            <input
              type="number"
              step={discountMode === 'percent' ? '1' : '0.01'}
              min="0"
              max={discountMode === 'percent' ? '100' : undefined}
              className="input"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
            />
          </div>
          <p className="text-xs text-slate-500">
            Subtotal: {formatMoney(order?.subtotal, sym)}
            {order?.discount > 0 && ` · Current discount: ${formatMoney(order.discount, sym)}`}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={clearDiscount} className="btn-secondary flex-1">
              Remove
            </button>
            <button type="button" onClick={applyDiscount} className="btn-primary flex-1">
              Apply
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={payModal} onClose={() => setPayModal(false)} title="Payment & split bill" wide>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-xl bg-violet-50 p-3 border border-violet-100">
              <p className="text-slate-500 text-xs">Total</p>
              <p className="font-bold">{formatMoney(order?.total, sym)}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-100">
              <p className="text-slate-500 text-xs">Paid</p>
              <p className="font-bold text-emerald-700">{formatMoney(order?.amountPaid, sym)}</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 border border-amber-100">
              <p className="text-slate-500 text-xs">Due now</p>
              <p className="font-bold text-amber-800">{formatMoney(remaining, sym)}</p>
            </div>
          </div>

          {order?.payments?.length > 0 && (
            <div className="rounded-xl border border-violet-100 p-3">
              <p className="text-xs font-bold text-violet-700 uppercase mb-2">Payments so far</p>
              <ul className="space-y-1 text-sm">
                {order.payments.map((p, i) => (
                  <li key={i} className="flex justify-between capitalize">
                    <span>{p.method}</span>
                    <span className="font-medium">{formatMoney(p.amount, sym)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="label flex items-center gap-1">
              <Users className="w-4 h-4" /> Split bill (equal parts)
            </p>
            <div className="flex gap-2 flex-wrap">
              {[2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  className="btn-secondary flex-1 min-w-[70px] text-sm py-2"
                  onClick={() => setSplitPayment(n)}
                  disabled={remaining <= 0}
                >
                  ÷ {n}
                </button>
              ))}
              <button
                type="button"
                className="btn-secondary flex-1 text-sm py-2"
                onClick={() => setPayAmount(remaining.toFixed(2))}
                disabled={remaining <= 0}
              >
                Full due
              </button>
            </div>
          </div>

          <div>
            <label className="label">Payment method</label>
            <select className="input" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="mobile">Mobile Pay</option>
            </select>
          </div>
          <div>
            <label className="label">Amount to pay now</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />
          </div>
          <button onClick={handlePay} className="btn-primary w-full">
            Record payment
          </button>
          <p className="text-xs text-center text-slate-500">
            Pay in multiple steps to split the bill. Change is calculated when fully paid.
          </p>
        </div>
      </Modal>
    </div>
  );
}
