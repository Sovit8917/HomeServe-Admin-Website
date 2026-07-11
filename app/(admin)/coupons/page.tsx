'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Ticket, Tag, Calendar, Users } from 'lucide-react';
import { couponsApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; item?: any }>({ open: false });
  const [form, setForm] = useState({ code: '', description: '', discountType: 'percentage', discountValue: 0, minOrderValue: 0, maxDiscount: '', usageLimit: '', expiresAt: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await couponsApi.list();
      setCoupons(res.data?.data?.coupons || []);
    } catch {
      setError(true);
      toast.error('Failed to load coupons');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ code: '', description: '', discountType: 'percentage', discountValue: 0, minOrderValue: 0, maxDiscount: '', usageLimit: '', expiresAt: '' });
    setModal({ open: true });
  };
  const openEdit = (item: any) => {
    setForm({ code: item.code, description: item.description || '', discountType: item.discountType, discountValue: item.discountValue, minOrderValue: item.minOrderValue, maxDiscount: item.maxDiscount || '', usageLimit: item.usageLimit || '', expiresAt: item.expiresAt ? item.expiresAt.split('T')[0] : '' });
    setModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!form.code.trim()) return toast.error('Coupon code required');
    setSaving(true);
    const payload = { ...form, maxDiscount: form.maxDiscount ? +form.maxDiscount : null, usageLimit: form.usageLimit ? +form.usageLimit : null, expiresAt: form.expiresAt || null };
    try {
      modal.item ? await couponsApi.update(modal.item.id, payload) : await couponsApi.create(payload);
      toast.success(`Coupon ${modal.item ? 'updated' : 'created'}`);
      setModal({ open: false }); load();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try { await couponsApi.remove(id); toast.success('Coupon deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <Spinner />;

  if (error) {
    return (
      <EmptyState icon={<Ticket className="w-8 h-8" />} title="Couldn't load coupons"
        description="Check that the backend API is reachable, then try again."
        action={<Button onClick={load}>Retry</Button>} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>Create Coupon</Button>
      </div>

      {coupons.length === 0 ? (
        <EmptyState icon={<Ticket className="w-8 h-8" />} title="No coupons yet" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {coupons.map(c => (
            <Card key={c.id} className="p-5 group hover:border-blue-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-lg text-slate-800 tracking-wider">{c.code}</span>
                    <Badge label={c.isActive ? 'ACTIVE' : 'INACTIVE'}
                      className={c.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'} />
                  </div>
                  <p className="text-xs text-slate-500">{c.description}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-3 mb-4 text-white text-center">
                <p className="text-2xl font-bold">
                  {c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`} OFF
                </p>
                {c.maxDiscount && <p className="text-xs text-blue-100 mt-0.5">Max discount ₹{c.maxDiscount}</p>}
              </div>

              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><Tag className="w-3 h-3" />Min order</span>
                  <span className="font-medium text-slate-700">₹{c.minOrderValue}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />Usage</span>
                  <span className="font-medium text-slate-700">{c.usedCount}/{c.usageLimit ?? '∞'}</span>
                </div>
                {c.expiresAt && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Expires</span>
                    <span className="font-medium text-slate-700">{formatDate(c.expiresAt)}</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.item ? 'Edit Coupon' : 'Create Coupon'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Coupon Code" placeholder="SAVE50" value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
            <Select label="Discount Type" value={form.discountType}
              onChange={(e: any) => setForm(f => ({ ...f, discountType: e.target.value }))}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (₹)</option>
            </Select>
          </div>
          <Input label="Description" placeholder="Limited time offer" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label={`Discount ${form.discountType === 'percentage' ? '(%)' : '(₹)'}`} type="number"
              value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: +e.target.value }))} />
            <Input label="Min Order (₹)" type="number" value={form.minOrderValue}
              onChange={e => setForm(f => ({ ...f, minOrderValue: +e.target.value }))} />
            <Input label="Max Discount (₹)" type="number" value={form.maxDiscount}
              onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))} placeholder="Optional" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Usage Limit" type="number" value={form.usageLimit}
              onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} placeholder="Unlimited" />
            <Input label="Expires At" type="date" value={form.expiresAt}
              onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setModal({ open: false })}>Cancel</Button>
            <Button loading={saving} onClick={handleSave}>{modal.item ? 'Update' : 'Create'} Coupon</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
