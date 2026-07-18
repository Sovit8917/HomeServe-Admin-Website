'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Star, Percent, Calendar, Users } from 'lucide-react';
import { subscriptionsApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { formatDate, formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '',
  description: '',
  price: 0,
  durationDays: 30,
  discountPercent: 0,
  maxDiscountPerBooking: '',
  sortOrder: 0,
};

export default function SubscriptionsPage() {
  const [tab, setTab] = useState<'plans' | 'subscribers'>('plans');

  // Plans state
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; item?: any }>({ open: false });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Subscribers state
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [subPage, setSubPage] = useState(1);
  const [subLoading, setSubLoading] = useState(true);
  const [subError, setSubError] = useState(false);

  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    setPlansError(false);
    try {
      const res = await subscriptionsApi.listPlans();
      setPlans(res.data?.data || []);
    } catch {
      setPlansError(true);
      toast.error('Failed to load plans');
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const loadSubscribers = useCallback(async () => {
    setSubLoading(true);
    setSubError(false);
    try {
      const res = await subscriptionsApi.listSubscribers(subPage);
      setSubscribers(res.data?.data?.subscriptions || []);
      setSubTotal(res.data?.data?.total || 0);
    } catch {
      setSubError(true);
      toast.error('Failed to load subscribers');
    } finally {
      setSubLoading(false);
    }
  }, [subPage]);

  useEffect(() => { loadPlans(); }, [loadPlans]);
  useEffect(() => { if (tab === 'subscribers') loadSubscribers(); }, [tab, loadSubscribers]);

  const openCreate = () => { setForm(EMPTY_FORM); setModal({ open: true }); };
  const openEdit = (item: any) => {
    setForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      durationDays: item.durationDays,
      discountPercent: item.discountPercent,
      maxDiscountPerBooking: item.maxDiscountPerBooking ?? '',
      sortOrder: item.sortOrder ?? 0,
    });
    setModal({ open: true, item });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Plan name required');
    if (form.price <= 0) return toast.error('Price must be greater than 0');
    setSaving(true);
    const payload = {
      ...form,
      maxDiscountPerBooking: form.maxDiscountPerBooking ? +form.maxDiscountPerBooking : null,
    };
    try {
      modal.item
        ? await subscriptionsApi.updatePlan(modal.item.id, payload)
        : await subscriptionsApi.createPlan(payload);
      toast.success(`Plan ${modal.item ? 'updated' : 'created'}`);
      setModal({ open: false });
      loadPlans();
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this plan? Existing subscribers keep their plan until it expires, but new customers won\'t be able to subscribe.')) return;
    try {
      await subscriptionsApi.deactivatePlan(id);
      toast.success('Plan deactivated');
      loadPlans();
    } catch {
      toast.error('Failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {(['plans', 'subscribers'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === t ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {t === 'plans' ? 'Plans' : 'Active Subscribers'}
          </button>
        ))}
      </div>

      {tab === 'plans' ? (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>Create Plan</Button>
          </div>

          {plansLoading ? <Spinner /> : plansError ? (
            <EmptyState icon={<Star className="w-8 h-8" />} title="Couldn't load plans"
              description="Check that the backend API is reachable, then try again."
              action={<Button onClick={loadPlans}>Retry</Button>} />
          ) : plans.length === 0 ? (
            <EmptyState icon={<Star className="w-8 h-8" />} title="No subscription plans yet"
              description="Create a plan to let customers subscribe for a discount on every booking." />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {plans.map((p) => (
                <Card key={p.id} className="p-5 group hover:border-blue-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg text-slate-800">{p.name}</span>
                        <Badge label={p.isActive ? 'ACTIVE' : 'INACTIVE'}
                          className={p.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'} />
                      </div>
                      <p className="text-xs text-slate-500">{p.description}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {p.isActive && (
                        <button onClick={() => handleDeactivate(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-3 mb-4 text-white text-center">
                    <p className="text-2xl font-bold">{formatCurrency(p.price)}</p>
                    <p className="text-xs text-blue-100 mt-0.5">every {p.durationDays} days</p>
                  </div>

                  <div className="space-y-2 text-xs text-slate-500">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1"><Percent className="w-3 h-3" />Discount</span>
                      <span className="font-medium text-slate-700">{p.discountPercent}% off every booking</span>
                    </div>
                    {p.maxDiscountPerBooking && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Max discount</span>
                        <span className="font-medium text-slate-700">{formatCurrency(p.maxDiscountPerBooking)} / booking</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <Card>
          {subLoading ? <Spinner /> : subError ? (
            <EmptyState icon={<Users className="w-8 h-8" />} title="Couldn't load subscribers"
              description="Check that the backend API is reachable, then try again."
              action={<Button onClick={loadSubscribers}>Retry</Button>} />
          ) : subscribers.length === 0 ? (
            <EmptyState icon={<Users className="w-8 h-8" />} title="No active subscribers yet" />
          ) : (
            <>
              <Table>
                <Thead>
                  <tr>
                    <Th>Customer</Th>
                    <Th>Phone</Th>
                    <Th>Plan</Th>
                    <Th>Started</Th>
                    <Th>Expires</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {subscribers.map((s) => (
                    <Tr key={s.id}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <Avatar name={s.user?.name} />
                          <span className="font-medium text-slate-800">{s.user?.name || 'Unknown'}</span>
                        </div>
                      </Td>
                      <Td className="text-slate-500">{s.user?.phone}</Td>
                      <Td><Badge label={s.plan?.name} className="bg-blue-100 text-blue-700" /></Td>
                      <Td className="text-slate-500">{s.startDate ? formatDate(s.startDate) : '—'}</Td>
                      <Td className="text-slate-500">{s.endDate ? formatDate(s.endDate) : '—'}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              <Pagination page={subPage} total={subTotal} limit={20} onChange={setSubPage} />
            </>
          )}
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modal.open} onClose={() => setModal({ open: false })} title={modal.item ? 'Edit Plan' : 'Create Plan'} size="md">
        <div className="space-y-4">
          <Input label="Plan Name" placeholder="Gold Membership" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Description" placeholder="20% off every booking, all year round" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Price (₹)" type="number" value={form.price}
              onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} />
            <Input label="Duration (days)" type="number" value={form.durationDays}
              onChange={e => setForm(f => ({ ...f, durationDays: +e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Discount (%)" type="number" value={form.discountPercent}
              onChange={e => setForm(f => ({ ...f, discountPercent: +e.target.value }))} />
            <Input label="Max Discount / Booking (₹)" type="number" value={form.maxDiscountPerBooking}
              onChange={e => setForm(f => ({ ...f, maxDiscountPerBooking: e.target.value }))} placeholder="Optional, no cap if empty" />
          </div>
          <Input label="Sort Order" type="number" value={form.sortOrder}
            onChange={e => setForm(f => ({ ...f, sortOrder: +e.target.value }))} />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setModal({ open: false })}>Cancel</Button>
            <Button loading={saving} onClick={handleSave}>{modal.item ? 'Update' : 'Create'} Plan</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
