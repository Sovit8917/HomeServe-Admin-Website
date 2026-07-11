'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { categoriesApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; item?: any }>({ open: false });
  const [form, setForm] = useState({ name: '', description: '', icon: '', sortOrder: 0, image: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await categoriesApi.list();
      setCats(res.data?.data || []);
    } catch {
      setError(true);
      toast.error('Failed to load categories');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm({ name: '', description: '', icon: '', sortOrder: cats.length, image: '' }); setModal({ open: true }); };
  const openEdit = (item: any) => { setForm({ name: item.name, description: item.description || '', icon: item.icon || '', sortOrder: item.sortOrder, image: item.image || '' }); setModal({ open: true, item }); };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name required');
    setSaving(true);
    try {
      if (modal.item) {
        await categoriesApi.update(modal.item.id, form);
        toast.success('Category updated');
      } else {
        await categoriesApi.create(form);
        toast.success('Category created');
      }
      setModal({ open: false });
      load();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? All associated services will be affected.')) return;
    try {
      await categoriesApi.remove(id);
      toast.success('Category deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <Spinner />;

  if (error) {
    return (
      <EmptyState icon={<Tag className="w-8 h-8" />} title="Couldn't load categories"
        description="Check that the backend API is reachable, then try again."
        action={<Button onClick={load}>Retry</Button>} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>Add Category</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cats.length === 0 ? (
          <div className="col-span-full">
            <EmptyState icon={<Tag className="w-8 h-8" />} title="No categories yet" description="Create your first service category" />
          </div>
        ) : cats.map(cat => (
          <Card key={cat.id} className="p-0 overflow-hidden group hover:border-blue-200 transition-colors">
            {cat.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cat.image} alt={cat.name} className="w-full h-28 object-cover" />
            ) : (
              <div className="w-full h-28 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-3xl">
                {cat.icon || '🔧'}
              </div>
            )}
            <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg bg-slate-50 border border-slate-100">
                {cat.icon || '🔧'}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <h3 className="font-semibold text-slate-800 mb-1">{cat.name}</h3>
            <p className="text-xs text-slate-500 mb-3 line-clamp-2">{cat.description || 'No description'}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">
                {cat._count?.services ?? 0} services
              </span>
              <span className={`w-2 h-2 rounded-full ${cat.isActive ? 'bg-emerald-400' : 'bg-slate-300'}`} />
            </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.item ? 'Edit Category' : 'Add Category'} size="sm">
        <div className="space-y-4">
          <ImageUpload
            label="Category Image"
            value={form.image}
            onChange={(url) => setForm(f => ({ ...f, image: url }))}
            folder="categories"
          />
          <Input label="Name" placeholder="e.g. Plumbing" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Textarea label="Description" placeholder="What services does this category include?" value={form.description}
            onChange={(e: any) => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
          <Input label="Icon (emoji)" placeholder="🔧" value={form.icon}
            onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} />
          <Input label="Sort Order" type="number" value={form.sortOrder}
            onChange={e => setForm(f => ({ ...f, sortOrder: +e.target.value }))} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setModal({ open: false })}>Cancel</Button>
            <Button loading={saving} onClick={handleSave}>{modal.item ? 'Update' : 'Create'} Category</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
