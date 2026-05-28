import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function SettingsPage() {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then((res) => setForm(res.data));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/settings', {
        ...form,
        taxRate: Number(form.taxRate),
        serviceChargeRate: Number(form.serviceChargeRate),
      });
      setForm(data);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <header className="mb-8">
        <h1 className="page-title">Settings</h1>
        <p className="text-slate-600 mt-1 font-medium">Restaurant and billing configuration</p>
      </header>

      <form onSubmit={handleSave} className="card p-6 space-y-5">
        <div>
          <label className="label">Restaurant name</label>
          <input className="input" value={form.restaurantName || ''} onChange={(e) => setForm({ ...form, restaurantName: e.target.value })} />
        </div>
        <div>
          <label className="label">Address</label>
          <input className="input" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Tax rate (e.g. 0.08 = 8%)</label>
            <input type="number" step="0.01" className="input" value={form.taxRate ?? ''} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />
          </div>
          <div>
            <label className="label">Service charge rate</label>
            <input type="number" step="0.01" className="input" value={form.serviceChargeRate ?? ''} onChange={(e) => setForm({ ...form, serviceChargeRate: e.target.value })} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.serviceChargeEnabled !== false} onChange={(e) => setForm({ ...form, serviceChargeEnabled: e.target.checked })} />
          Enable service charge
        </label>
        <div>
          <label className="label">Receipt footer</label>
          <textarea className="input min-h-[80px]" value={form.receiptFooter || ''} onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })} />
        </div>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save settings'}
        </button>
      </form>
    </div>
  );
}
