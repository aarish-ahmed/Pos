import { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Upload, ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import Modal from '../components/Modal';
import { formatMoney } from '../utils/format';
import { resolveImageUrl } from '../utils/imageUrl';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';

export default function MenuManage() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const sym = settings?.currencySymbol || '$';

  const load = async () => {
    const [m, s] = await Promise.all([api.get('/menu/all'), api.get('/settings')]);
    setCategories(m.data.categories);
    setItems(m.data.items);
    setSettings(s.data);
  };

  useEffect(() => {
    load();
  }, []);

  const openItemModal = (item = null) => {
    setForm(
      item
        ? { ...item, category: item.category?._id || item.category }
        : { name: '', price: '', category: categories[0]?._id, description: '', image: '', isAvailable: true }
    );
    setModal('item');
  };

  const uploadImage = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    setUploading(true);
    try {
      const { data } = await api.post('/menu/upload-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((prev) => ({ ...prev, image: data.url }));
      toast.success('Photo uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveItem = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description || '',
      price: Number(form.price),
      category: form.category,
      image: form.image || '',
      isAvailable: form.isAvailable !== false,
    };
    try {
      if (form._id) await api.patch(`/menu/items/${form._id}`, payload);
      else await api.post('/menu/items', payload);
      toast.success('Menu item saved');
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  const openCatModal = (cat = null) => {
    setForm(cat || { name: '', sortOrder: categories.length, color: '#6b9080', isActive: true });
    setModal('category');
  };

  const saveCategory = async (e) => {
    e.preventDefault();
    try {
      if (form._id) await api.patch(`/menu/categories/${form._id}`, form);
      else await api.post('/menu/categories', form);
      toast.success('Category saved');
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  const previewSrc = form.image ? resolveImageUrl(form.image) : '';

  return (
    <div className="p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="page-title">Menu Management</h1>
          <p className="text-slate-600 mt-1 font-medium">Categories and menu items with photos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openCatModal()} className="btn-secondary">
            <Plus className="w-4 h-4" /> Category
          </button>
          <button onClick={() => openItemModal()} className="btn-primary">
            <Plus className="w-4 h-4" /> Item
          </button>
        </div>
      </header>

      {categories.map((cat) => (
        <div key={cat._id} className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
            <h2 className="font-semibold text-warm-900">{cat.name}</h2>
            <button onClick={() => openCatModal(cat)} className="text-sage-500 hover:text-sage-700">
              <Pencil className="w-4 h-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items
              .filter((i) => (i.category?._id || i.category) === cat._id)
              .map((item) => (
                <div key={item._id} className="card p-2 overflow-hidden">
                  {item.image ? (
                    <img
                      src={resolveImageUrl(item.image)}
                      alt={item.name}
                      className="w-full h-32 object-cover rounded-xl"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  ) : (
                    <div className="w-full h-32 rounded-xl bg-gradient-to-br from-sage-100 to-sage-200 flex items-center justify-center text-sage-700 text-2xl font-bold">
                      {item.name?.charAt(0)?.toUpperCase() || 'F'}
                    </div>
                  )}
                  <div className="px-2.5 py-3 flex justify-between items-start">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sage-600 text-sm mt-1">{formatMoney(item.price, sym)}</p>
                      {!item.isAvailable && <span className="text-xs text-red-600">Unavailable</span>}
                    </div>
                    <button onClick={() => openItemModal(item)} className="btn-ghost p-2">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      <Modal open={modal === 'item'} onClose={() => setModal(null)} title={form._id ? 'Edit Item' : 'New Item'} wide>
        <form onSubmit={saveItem} className="space-y-4">
          <div>
            <label className="label">Item photo</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => uploadImage(e.target.files?.[0])}
            />
            <div
              role="button"
              tabIndex={0}
              onClick={() => !uploading && fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              className="relative border-2 border-dashed border-sage-200 rounded-2xl overflow-hidden cursor-pointer hover:border-sage-400 hover:bg-sage-50/50 transition min-h-[160px] flex items-center justify-center"
            >
              {previewSrc ? (
                <img
                  src={previewSrc}
                  alt="Preview"
                  className="w-full h-44 object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
              ) : (
                <div className="text-center p-6">
                  <ImageIcon className="w-10 h-10 text-sage-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-sage-700">Click to upload photo</p>
                  <p className="text-xs text-sage-500 mt-1">JPG, PNG, WEBP, GIF · max 5MB</p>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <span className="text-sm text-sage-700 font-medium">Uploading...</span>
                </div>
              )}
            </div>
            <button
              type="button"
              className="btn-secondary mt-2 w-full"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4" />
              {form.image ? 'Change photo' : 'Upload from computer'}
            </button>
          </div>

          <div>
            <label className="label">Or paste image URL (optional)</label>
            <input
              className="input"
              placeholder="https://..."
              value={form.image || ''}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Price</label>
              <input type="number" step="0.01" className="input" value={form.price || ''} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isAvailable !== false} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} />
            Available
          </label>
          <button type="submit" className="btn-primary w-full" disabled={uploading}>
            Save
          </button>
        </form>
      </Modal>

      <Modal open={modal === 'category'} onClose={() => setModal(null)} title={form._id ? 'Edit Category' : 'New Category'}>
        <form onSubmit={saveCategory} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <button type="submit" className="btn-primary w-full">Save</button>
        </form>
      </Modal>
    </div>
  );
}
