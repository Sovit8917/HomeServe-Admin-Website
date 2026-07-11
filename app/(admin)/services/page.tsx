'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Wrench, Clock, IndianRupee } from 'lucide-react';
import { servicesApi, categoriesApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [catFilter, setCatFilter] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ open: boolean; item?: any }>({ open: false });
  const [form, setForm] = useState({ name: '', description: '', categoryId: '', basePrice: 0, priceType: 'fixed', duration: 60, image: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [sRes, cRes] = await Promise.all([
        servicesApi.list(catFilter || undefined, search || undefined),
        categoriesApi.list()
      ]);
      setServices(sRes.data?.data || []);
      setCategories(cRes.data?.data || []);
    } catch {
      setError(true);
      toast.error('Failed to load services');
    } finally { setLoading(false); }
  }, [catFilter, search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm({ name: '', description: '', categoryId: categories[0]?.id || '', basePrice: 0, priceType: 'fixed', duration: 60, image: '' });
    setModal({ open: true });
  };
  const openEdit = (item: any) => {
    setForm({ name: item.name, description: item.description || '', categoryId: item.categoryId || item.category?.id, basePrice: item.basePrice, priceType: item.priceType, duration: item.duration, image: item.image || '' });
    setModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.categoryId) return toast.error('Name and category are required');
    setSaving(true);
    try {
      modal.item ? await servicesApi.update(modal.item.id, form) : await servicesApi.create(form);
      toast.success(`Service ${modal.item ? 'updated' : 'created'}`);
      setModal({ open: false });
      load();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    try { await servicesApi.remove(id); toast.success('Service deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  if (loading) return <Spinner />;

  if (error) {
    return (
      <EmptyState icon={<Wrench className="w-8 h-8" />} title="Couldn't load services"
        description="Check that the backend API is reachable, then try again."
        action={<Button onClick={load}>Retry</Button>} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-sm">
          <Input placeholder="Search services…" value={search}
            onChange={e => setSearch(e.target.value)} icon={<Search className="w-4 h-4" />} />
        </div>
        <div className="w-48">
          <Select value={catFilter} onChange={(e: any) => setCatFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate} className="ml-auto">Add Service</Button>
      </div>

      {services.length === 0 ? (
        <EmptyState icon={<Wrench className="w-8 h-8" />} title="No services found" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {services.map(s => (
            <Card key={s.id} className="p-0 overflow-hidden group hover:border-blue-200 transition-colors">
              {s.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.image} alt={s.name} className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                  <Wrench className="w-7 h-7 text-slate-300" />
                </div>
              )}
              <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">{s.category?.name}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">{s.name}</h3>
              <p className="text-xs text-slate-500 mb-4 line-clamp-2">{s.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-slate-700">
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span className="font-bold">{s.basePrice}</span>
                    <span className="text-xs text-slate-400">/{s.priceType}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs">{s.duration}m</span>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {s.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.item ? 'Edit Service' : 'Add Service'} size="md">
        <div className="space-y-4">
          <ImageUpload
            label="Service Image"
            value={form.image}
            onChange={(url) => setForm(f => ({ ...f, image: url }))}
            folder="services"
          />
          <Select label="Category" value={form.categoryId} onChange={(e: any) => setForm(f => ({ ...f, categoryId: e.target.value }))}>
            <option value="">Select category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input label="Service Name" placeholder="e.g. Pipe Leak Repair" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Textarea label="Description" placeholder="Describe the service…" value={form.description}
            onChange={(e: any) => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Base Price (₹)" type="number" value={form.basePrice}
              onChange={e => setForm(f => ({ ...f, basePrice: +e.target.value }))} />
            <Select label="Price Type" value={form.priceType}
              onChange={(e: any) => setForm(f => ({ ...f, priceType: e.target.value }))}>
              <option value="fixed">Fixed</option>
              <option value="hourly">Hourly</option>
            </Select>
            <Input label="Duration (min)" type="number" value={form.duration}
              onChange={e => setForm(f => ({ ...f, duration: +e.target.value }))} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setModal({ open: false })}>Cancel</Button>
            <Button loading={saving} onClick={handleSave}>{modal.item ? 'Update' : 'Create'} Service</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
