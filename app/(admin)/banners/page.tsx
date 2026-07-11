'use client';
import { useEffect, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, Image as ImageIcon, ExternalLink, ToggleLeft, ToggleRight, UploadCloud, CalendarClock } from 'lucide-react';
import { bannersApi, uploadApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

const MOCK_BANNERS = [
  { id: 'b1', title: 'Diwali Special Offer', image: 'https://placehold.co/800x300/3b82f6/white?text=Diwali+Offer', link: '/offers/diwali', isActive: true, sortOrder: 0, startDate: null, endDate: null },
  { id: 'b2', title: 'New User Welcome', image: 'https://placehold.co/800x300/10b981/white?text=Welcome+Offer', link: '/register', isActive: true, sortOrder: 1, startDate: null, endDate: null },
  { id: 'b3', title: 'Worker Referral Program', image: 'https://placehold.co/800x300/8b5cf6/white?text=Refer+%26+Earn', link: '/referral', isActive: false, sortOrder: 2, startDate: null, endDate: null },
];

// datetime-local inputs need "YYYY-MM-DDTHH:mm"; ISO strings from the API need trimming.
const toLocalInput = (iso?: string | null) => (iso ? iso.slice(0, 16) : '');

function bannerStatus(b: any): { label: string; className: string } {
  const now = Date.now();
  if (!b.isActive) return { label: 'Inactive', className: 'bg-slate-100 text-slate-500' };
  if (b.startDate && new Date(b.startDate).getTime() > now) {
    return { label: 'Scheduled', className: 'bg-amber-100 text-amber-700' };
  }
  if (b.endDate && new Date(b.endDate).getTime() < now) {
    return { label: 'Expired', className: 'bg-red-100 text-red-600' };
  }
  return { label: 'Live', className: 'bg-emerald-100 text-emerald-700' };
}

const emptyForm = { title: '', image: '', link: '', sortOrder: 0, isActive: true, startDate: '', endDate: '' };

export default function BannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; item?: any }>({ open: false });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await bannersApi.list();
      setBanners(res.data?.data || []);
    } catch { setBanners(MOCK_BANNERS); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ ...emptyForm, sortOrder: banners.length });
    setModal({ open: true });
  };
  const openEdit = (item: any) => {
    setForm({
      title: item.title,
      image: item.image,
      link: item.link || '',
      sortOrder: item.sortOrder,
      isActive: item.isActive,
      startDate: toLocalInput(item.startDate),
      endDate: toLocalInput(item.endDate),
    });
    setModal({ open: true, item });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setUploading(true);
    try {
      const res = await uploadApi.single(file, 'banners');
      const url = res.data?.data?.url || res.data?.url;
      if (!url) throw new Error('No URL returned');
      setForm((f) => ({ ...f, image: url }));
      toast.success('Image uploaded');
    } catch {
      toast.error('Upload failed. You can paste an image URL instead.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.image.trim()) return toast.error('Title and image are required');
    if (form.startDate && form.endDate && new Date(form.startDate) >= new Date(form.endDate)) {
      return toast.error('End date must be after the start date');
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      };
      modal.item ? await bannersApi.update(modal.item.id, payload) : await bannersApi.create(payload);
      toast.success(`Banner ${modal.item ? 'updated' : 'created'}`);
      setModal({ open: false }); load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    try { await bannersApi.remove(id); toast.success('Banner deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  const toggleActive = async (item: any) => {
    try {
      await bannersApi.update(item.id, { isActive: !item.isActive });
      toast.success(`Banner ${!item.isActive ? 'activated' : 'deactivated'}`);
      load();
    } catch { toast.error('Failed'); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>Add Banner</Button>
      </div>

      {banners.length === 0 ? (
        <EmptyState icon={<ImageIcon className="w-8 h-8" />} title="No banners yet" description="Add banners to display in the customer app's auto-scrolling carousel" />
      ) : (
        <div className="space-y-4">
          {banners.map((b, idx) => {
            const status = bannerStatus(b);
            return (
              <Card key={b.id} className="overflow-hidden group">
                <div className="flex items-stretch">
                  <div className="w-64 relative flex-shrink-0">
                    <img src={b.image} alt={b.title}
                      className="w-full h-full object-cover"
                      onError={(e: any) => { e.target.src = `https://placehold.co/800x300/e2e8f0/94a3b8?text=${encodeURIComponent(b.title)}`; }} />
                    {status.label !== 'Live' && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.className}`}>{status.label}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-5 flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center text-xs font-bold text-slate-500">
                          {idx + 1}
                        </span>
                        <h3 className="font-semibold text-slate-800">{b.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.className}`}>
                          {status.label}
                        </span>
                      </div>
                      {b.link && (
                        <a href={b.link} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                          <ExternalLink className="w-3 h-3" /> {b.link}
                        </a>
                      )}
                      {(b.startDate || b.endDate) && (
                        <p className="flex items-center gap-1 text-xs text-slate-400">
                          <CalendarClock className="w-3 h-3" />
                          {b.startDate ? new Date(b.startDate).toLocaleString() : 'Now'}
                          {' → '}
                          {b.endDate ? new Date(b.endDate).toLocaleString() : 'No end date'}
                        </p>
                      )}
                      <p className="text-xs text-slate-400">Sort order: {b.sortOrder}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleActive(b)}
                        className={`p-2 rounded-lg transition-colors ${b.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}>
                        {b.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button onClick={() => openEdit(b)} className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(b.id)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.item ? 'Edit Banner' : 'Add Banner'} size="md">
        <div className="space-y-4">
          <Input label="Title" placeholder="e.g. Diwali Special" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Banner Image</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                icon={<UploadCloud className="w-4 h-4" />}
                loading={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload image
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
            <input
              type="text"
              placeholder="…or paste an image URL"
              value={form.image}
              onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">Recommended: 1200×450px, under 5MB. Shown full-width in the app's home carousel.</p>
          </div>

          {form.image && (
            <div className="rounded-xl overflow-hidden border border-slate-100">
              <img src={form.image} alt="preview" className="w-full h-32 object-cover"
                onError={(e: any) => { e.target.style.display = 'none'; }} />
            </div>
          )}

          <Input label="Link (optional)" placeholder="/offers/diwali" value={form.link}
            onChange={e => setForm(f => ({ ...f, link: e.target.value }))} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Starts (optional)</label>
              <input type="datetime-local" value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Ends (optional)</label>
              <input type="datetime-local" value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
            </div>
          </div>
          <p className="text-xs text-slate-400 -mt-2">Leave blank to show immediately with no expiry. Banner still needs "Active" on to ever appear.</p>

          <Input label="Sort Order" type="number" value={form.sortOrder}
            onChange={e => setForm(f => ({ ...f, sortOrder: +e.target.value }))} />
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isActive}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4 rounded accent-blue-600" />
            <span className="text-sm font-medium text-slate-700">Active (visible in app)</span>
          </label>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setModal({ open: false })}>Cancel</Button>
            <Button loading={saving} onClick={handleSave}>{modal.item ? 'Update' : 'Add'} Banner</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
