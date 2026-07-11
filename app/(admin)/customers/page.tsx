'use client';
import { useEffect, useState, useCallback } from 'react';
import { Search, UserX, UserCheck, Eye } from 'lucide-react';
import { customersApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { formatDate, formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await customersApi.list(search || undefined, page);
      setCustomers(res.data?.data?.users || []);
      setTotal(res.data?.data?.total || 0);
    } catch {
      setError(true);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await customersApi.get(id);
      setSelected(res.data?.data);
    } catch {
      toast.error('Failed to load customer details');
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleBlock = async (id: string, isBlocked: boolean) => {
    try {
      await customersApi.block(id, !isBlocked);
      toast.success(`Customer ${!isBlocked ? 'blocked' : 'unblocked'}`);
      load();
      if (selected?.id === id) setSelected((s: any) => ({ ...s, isBlocked: !isBlocked }));
    } catch { toast.error('Action failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 max-w-sm">
          <Input placeholder="Search by name, phone, email…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            icon={<Search className="w-4 h-4" />} />
        </div>
        <p className="text-sm text-slate-500">{total} total customers</p>
      </div>

      <Card>
        {loading ? <Spinner /> : error ? (
          <EmptyState icon={<Search className="w-8 h-8" />} title="Couldn't load customers"
            description="Check that the backend API is reachable, then try again."
            action={<Button onClick={load}>Retry</Button>} />
        ) : customers.length === 0 ? (
          <EmptyState icon={<Search className="w-8 h-8" />} title="No customers found" />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>Customer</Th>
                  <Th>Phone</Th>
                  <Th>Email</Th>
                  <Th>Bookings</Th>
                  <Th>Joined</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </Thead>
              <Tbody>
                {customers.map(c => (
                  <Tr key={c.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} />
                        <span className="font-medium text-slate-800">{c.name || 'Unknown'}</span>
                      </div>
                    </Td>
                    <Td className="text-slate-500">{c.phone}</Td>
                    <Td className="text-slate-500">{c.email || '—'}</Td>
                    <Td><span className="font-medium text-slate-700">{c._count?.bookings ?? 0}</span></Td>
                    <Td className="text-slate-500">{formatDate(c.createdAt)}</Td>
                    <Td>
                      <Badge label={c.isBlocked ? 'BLOCKED' : 'ACTIVE'}
                        className={c.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} />
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => openDetail(c.id)}>View</Button>
                        <Button size="sm" variant={c.isBlocked ? 'success' : 'danger'}
                          icon={c.isBlocked ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                          onClick={() => toggleBlock(c.id, c.isBlocked)}>
                          {c.isBlocked ? 'Unblock' : 'Block'}
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Pagination page={page} total={total} limit={20} onChange={setPage} />
          </>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Customer Details" size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar name={selected.name} size="lg" />
              <div>
                <h3 className="font-semibold text-slate-800 text-base">{selected.name || 'Unknown'}</h3>
                <p className="text-sm text-slate-500">{selected.phone} · {selected.email || 'No email'}</p>
                <p className="text-xs text-slate-400 mt-1">Joined {formatDate(selected.createdAt)}</p>
              </div>
              <div className="ml-auto">
                <Badge label={selected.isBlocked ? 'BLOCKED' : 'ACTIVE'}
                  className={selected.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Total Bookings', value: selected._count?.bookings ?? 0 },
                { label: 'Reviews', value: selected._count?.reviews ?? 0 },
                { label: 'Wallet Balance', value: formatCurrency(selected.wallet?.balance ?? 0) },
              ].map(s => (
                <div key={s.label} className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-xl font-bold text-slate-800">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {selected.bookings?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Recent Bookings</p>
                <div className="space-y-2">
                  {selected.bookings.slice(0, 5).map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-700">#{b.bookingNumber}</p>
                        <p className="text-xs text-slate-500">{formatDate(b.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge label={b.status} />
                        <span className="text-sm font-semibold text-slate-700">{formatCurrency(b.finalAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant={selected.isBlocked ? 'success' : 'danger'}
                onClick={() => toggleBlock(selected.id, selected.isBlocked)}>
                {selected.isBlocked ? 'Unblock Customer' : 'Block Customer'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
