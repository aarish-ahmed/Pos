import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlus, Pencil, XCircle, CheckCircle2, Users, UtensilsCrossed } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import DateTimePicker from '../components/DateTimePicker';
import { formatDate, formatTime } from '../utils/format';
import { useAuth } from '../context/AuthContext';

const toLocalInputValue = (d) => {
  const date = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

export default function Reservations() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [days, setDays] = useState(7);
  const [status, setStatus] = useState('booked');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    partySize: 2,
    startAt: toLocalInputValue(new Date(Date.now() + 30 * 60 * 1000)),
    durationMinutes: 90,
    table: '',
    notes: '',
  });

  const load = async () => {
    const [r, t] = await Promise.all([
      api.get(`/reservations?days=${days}&status=${status}`),
      api.get('/tables'),
    ]);
    setReservations(r.data);
    setTables(t.data);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, status]);

  const grouped = useMemo(() => {
    const map = new Map();
    reservations.forEach((r) => {
      const key = new Date(r.startAt).toISOString().slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    });
    return Array.from(map.entries());
  }, [reservations]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      customerName: '',
      customerPhone: '',
      partySize: 2,
      startAt: toLocalInputValue(new Date(Date.now() + 30 * 60 * 1000)),
      durationMinutes: 90,
      table: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    const durationMinutes = Math.max(
      15,
      Math.round((new Date(r.endAt).getTime() - new Date(r.startAt).getTime()) / 60000)
    );
    setForm({
      customerName: r.customerName || '',
      customerPhone: r.customerPhone || '',
      partySize: r.partySize || 2,
      startAt: toLocalInputValue(r.startAt),
      durationMinutes,
      table: r.table?._id || '',
      notes: r.notes || '',
    });
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const start = new Date(form.startAt);
    const end = new Date(start.getTime() + Math.max(15, Number(form.durationMinutes) || 90) * 60000);
    const payload = {
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      partySize: Number(form.partySize) || 2,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      table: form.table || null,
      notes: form.notes || '',
    };
    try {
      if (editing?._id) await api.patch(`/reservations/${editing._id}`, payload);
      else await api.post('/reservations', payload);
      toast.success('Reservation saved');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  const cancel = async (r) => {
    try {
      await api.post(`/reservations/${r._id}/cancel`);
      toast.success('Reservation cancelled');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const seat = async (r) => {
    try {
      await api.post(`/reservations/${r._id}/seat`);
      toast.success('Marked seated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const seatAndStartOrder = async (r) => {
    try {
      const { data } = await api.post(`/reservations/${r._id}/seat-and-order`);
      toast.success(data.message || 'Order started');
      navigate('/pos');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const statusBadge = (s) => {
    if (s === 'booked') return <Badge status="sent">booked</Badge>;
    if (s === 'seated') return <Badge status="ready">seated</Badge>;
    if (s === 'cancelled') return <Badge status="cancelled">cancelled</Badge>;
    if (s === 'no-show') return <Badge status="cancelled">no-show</Badge>;
    return <Badge status="open">{s}</Badge>;
  };

  return (
    <div className="p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="page-title">Reservations</h1>
          <p className="text-slate-600 mt-1 font-medium">Schedule and manage table bookings</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <CalendarPlus className="w-4 h-4" />
          New reservation
        </button>
      </header>

      <div className="card p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div>
          <label className="label !mb-0">Range</label>
          <select className="input !py-2" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={1}>Today</option>
            <option value={7}>Next 7 days</option>
            <option value={14}>Next 14 days</option>
            <option value={30}>Next 30 days</option>
          </select>
        </div>
        <div>
          <label className="label !mb-0">Status</label>
          <select className="input !py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="booked">Booked</option>
            <option value="seated">Seated</option>
            <option value="cancelled">Cancelled</option>
            <option value="no-show">No-show</option>
          </select>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="card p-14 text-center text-sage-600">No reservations in this range.</div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([dateKey, list]) => (
            <div key={dateKey} className="card overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-violet-500 to-cyan-500 text-white border-b border-violet-200">
                <h2 className="font-bold">{formatDate(dateKey)}</h2>
              </div>
              <div className="divide-y divide-sage-100">
                {list.map((r) => (
                  <div key={r._id} className="px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-[260px]">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-warm-900">{r.customerName}</p>
                        {statusBadge(r.status)}
                      </div>
                      <p className="text-sm text-sage-600 mt-0.5">
                        {formatTime(r.startAt)} – {formatTime(r.endAt)} · <Users className="inline w-4 h-4 -mt-0.5" />{' '}
                        {r.partySize}
                        {r.table?.number ? ` · Table ${r.table.number} (${r.table.zone})` : ' · Unassigned'}
                      </p>
                      {r.customerPhone ? (
                        <p className="text-xs text-sage-500 mt-1">{r.customerPhone}</p>
                      ) : null}
                      {r.notes ? <p className="text-xs text-amber-700 mt-1">{r.notes}</p> : null}
                    </div>

                    <div className="flex gap-2">
                      {r.status === 'booked' ? (
                        <button onClick={() => seatAndStartOrder(r)} className="btn-primary">
                          <UtensilsCrossed className="w-4 h-4" />
                          Seat & Order
                        </button>
                      ) : null}
                      {r.status === 'booked' ? (
                        <button onClick={() => seat(r)} className="btn-secondary">
                          <CheckCircle2 className="w-4 h-4" />
                          Seat
                        </button>
                      ) : null}
                      <button onClick={() => openEdit(r)} className="btn-ghost">
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>
                      {r.status !== 'cancelled' && can('reservations.cancel') ? (
                        <button onClick={() => cancel(r)} className="btn-danger">
                          <XCircle className="w-4 h-4" />
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Reservation' : 'New Reservation'}
        wide
      >
        <form onSubmit={save} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Customer name</label>
              <input
                className="input"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                className="input"
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="label">Party size</label>
              <input
                type="number"
                min={1}
                className="input"
                value={form.partySize}
                onChange={(e) => setForm({ ...form, partySize: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-2">
              <DateTimePicker
                label="Start date & time"
                value={form.startAt}
                onChange={(startAt) => setForm({ ...form, startAt })}
                required
              />
            </div>
            <div>
              <label className="label">Duration (min)</label>
              <input
                type="number"
                min={15}
                step={15}
                className="input"
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Table (optional)</label>
              <select
                className="input"
                value={form.table}
                onChange={(e) => setForm({ ...form, table: e.target.value })}
              >
                <option value="">Unassigned</option>
                {tables.map((t) => (
                  <option key={t._id} value={t._id}>
                    Table {t.number} · {t.zone} · cap {t.capacity}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Notes</label>
              <input
                className="input"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full">
            Save reservation
          </button>
        </form>
      </Modal>
    </div>
  );
}

