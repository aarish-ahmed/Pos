import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { UserPlus, Trash2, UserX, UserCheck } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Badge';
import { ROLE_LABELS } from '../config/permissions';

export default function SettingsPage() {
  const { user: currentUser, can } = useAuth();
  const canManageStaff = can('settings.staff');
  const [tab, setTab] = useState('general');
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'waiter',
  });
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    api.get('/settings').then((res) => setForm(res.data));
  }, []);

  const loadUsers = () => api.get('/settings/users').then((res) => setUsers(res.data));

  useEffect(() => {
    if (canManageStaff && tab === 'staff') loadUsers();
  }, [canManageStaff, tab]);

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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      await api.post('/settings/users', userForm);
      toast.success('Staff member created');
      setUserForm({ name: '', email: '', password: '', role: 'waiter' });
      await loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create user');
    } finally {
      setCreatingUser(false);
    }
  };

  const toggleUserActive = async (u) => {
    const next = u.isActive === false;
    try {
      await api.patch(`/settings/users/${u._id}`, { isActive: next });
      toast.success(next ? 'Staff reactivated' : 'Staff deactivated');
      await loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const changeUserRole = async (u, role) => {
    try {
      await api.patch(`/settings/users/${u._id}`, { role });
      toast.success('Role updated');
      await loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Permanently remove ${u.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/settings/users/${u._id}`);
      toast.success('Staff member removed');
      await loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <header className="mb-8">
        <h1 className="page-title">Settings</h1>
        <p className="text-slate-600 mt-1 font-medium">Restaurant and billing configuration</p>
      </header>

      {canManageStaff && (
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 ${
              tab === 'general'
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-violet-100 text-slate-600'
            }`}
            onClick={() => setTab('general')}
          >
            General
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 ${
              tab === 'staff'
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-violet-100 text-slate-600'
            }`}
            onClick={() => setTab('staff')}
          >
            Staff
          </button>
        </div>
      )}

      {tab === 'general' && (
        <form onSubmit={handleSave} className="card p-6 space-y-5">
          <div>
            <label className="label">Restaurant name</label>
            <input
              className="input"
              value={form.restaurantName || ''}
              onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Address</label>
            <input
              className="input"
              value={form.address || ''}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              className="input"
              value={form.phone || ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tax rate (e.g. 0.08 = 8%)</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.taxRate ?? ''}
                onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Service charge rate</label>
              <input
                type="number"
                step="0.01"
                className="input"
                value={form.serviceChargeRate ?? ''}
                onChange={(e) => setForm({ ...form, serviceChargeRate: e.target.value })}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.serviceChargeEnabled !== false}
              onChange={(e) => setForm({ ...form, serviceChargeEnabled: e.target.checked })}
            />
            Enable service charge
          </label>
          <div>
            <label className="label">Receipt footer</label>
            <textarea
              className="input min-h-[80px]"
              value={form.receiptFooter || ''}
              onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save settings'}
          </button>
        </form>
      )}

      {tab === 'staff' && canManageStaff && (
        <div className="space-y-6">
          <p className="text-sm text-slate-600">
            Deactivate staff to block sign-in, or delete to remove the account permanently.
          </p>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-violet-50 text-violet-800">
                <tr>
                  <th className="text-left p-4 font-medium">Name</th>
                  <th className="text-left p-4 font-medium">Email</th>
                  <th className="text-left p-4 font-medium">Role</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = String(u._id) === String(currentUser?.id);
                  return (
                    <tr key={u._id} className="border-t border-violet-100">
                      <td className="p-4 font-medium">
                        {u.name}
                        {isSelf && (
                          <span className="ml-1 text-xs text-violet-500">(you)</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-600">{u.email}</td>
                      <td className="p-4">
                        <select
                          className="input py-1.5 text-sm capitalize"
                          value={u.role}
                          disabled={isSelf}
                          onChange={(e) => changeUserRole(u, e.target.value)}
                        >
                          <option value="waiter">waiter</option>
                          <option value="cashier">cashier</option>
                          <option value="manager">manager</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <Badge status={u.isActive !== false ? 'available' : 'cleaning'}>
                          {u.isActive !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-1">
                          {!isSelf && (
                            <>
                              <button
                                type="button"
                                className="p-2 rounded-lg hover:bg-violet-50 text-violet-700"
                                title={u.isActive !== false ? 'Deactivate' : 'Reactivate'}
                                onClick={() => toggleUserActive(u)}
                              >
                                {u.isActive !== false ? (
                                  <UserX className="w-4 h-4" />
                                ) : (
                                  <UserCheck className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                type="button"
                                className="p-2 rounded-lg hover:bg-rose-50 text-rose-600"
                                title="Delete permanently"
                                onClick={() => deleteUser(u)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!users.length && (
              <p className="p-6 text-center text-slate-500 text-sm">No staff accounts yet</p>
            )}
          </div>

          <form onSubmit={handleCreateUser} className="card p-6 space-y-4">
            <h2 className="font-bold text-ink-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-brand-600" />
              Add staff member
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Name</label>
                <input
                  className="input"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input"
                  required
                  minLength={6}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Role</label>
                <select
                  className="input"
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                >
                  <option value="waiter">Waiter</option>
                  <option value="cashier">Cashier</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">{ROLE_LABELS[userForm.role]}</p>
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={creatingUser}>
              {creatingUser ? 'Creating...' : 'Create account'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
