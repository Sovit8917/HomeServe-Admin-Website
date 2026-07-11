'use client';
import { useEffect, useState, useCallback } from 'react';
import { Search, XCircle, Eye, MapPin, Calendar } from 'lucide-react';
import { bookingsApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

const MOCK_BOOKINGS = Array.from({ length: 15 }, (_, i) => ({
  id: `b${i}`, bookingNumber: `HS${(1000 + i).toString()}`,
  status: ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'][i % 5],
  scheduledDate: new Date(Date.now() + (i - 7) * 86400000).toISOString(),
  scheduledTime: `${9 + (i % 8)}:00`,
  finalAmount: (500 + i * 150),
  totalAmount: (500 + i * 150),
  discountAmount: i % 3 === 0 ? 50 : 0,
  taxAmount: (500 + i * 150) * 0.05,
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  user: { name: ['Arjun', 'Priya', 'Rahul'][i % 3], phone: `98765432${i % 10}` },
  worker: i % 4 !== 0 ? { name: ['Suresh', 'Ramesh', 'Bikash'][i % 3], phone: `77654321${i % 10}` } : null,
  items: [{ service: { name: ['Plumbing', 'Electrical', 'Cleaning'][i % 3] }, quantity: 1, price: 500 + i * 150 }],
  address: { fullAddress: 'Bhubaneswar, Odisha', city: 'Bhubaneswar' },
  payment: { method: ['UPI', 'CASH', 'CARD'][i % 3], status: ['SUCCESS', 'PENDING'][i % 2] },
  cancelReason: i % 5 === 4 ? 'Customer request' : null,
}));

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [cancelModal, setCancelModal] = useState<{ open: boolean; id: string } | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingsApi.list(status || undefined, page);
      setBookings(res.data?.data?.bookings || []);
      setTotal(res.data?.data?.total || 0);
    } catch {
      setBookings(MOCK_BOOKINGS.filter(b => !status || b.status === status));
      setTotal(3492);
    } finally { setLoading(false); }
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async () => {
    if (!cancelModal) return;
    try {
      await bookingsApi.cancel(cancelModal.id, cancelReason);
      toast.success('Booking cancelled');
      setCancelModal(null);
      setCancelReason('');
      load();
    } catch { toast.error('Failed to cancel'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-52">
          <Select value={status} onChange={(e: any) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </div>
        <p className="text-sm text-slate-500 ml-auto">{total} bookings</p>
      </div>

      <Card>
        {loading ? <Spinner /> : bookings.length === 0 ? (
          <EmptyState icon={<Calendar className="w-8 h-8" />} title="No bookings found" />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>Booking #</Th>
                  <Th>Customer</Th>
                  <Th>Worker</Th>
                  <Th>Service</Th>
                  <Th>Scheduled</Th>
                  <Th>Amount</Th>
                  <Th>Payment</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </Thead>
              <Tbody>
                {bookings.map(b => (
                  <Tr key={b.id}>
                    <Td><span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">#{b.bookingNumber}</span></Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Avatar name={b.user?.name} size="sm" />
                        <span className="font-medium text-slate-700">{b.user?.name}</span>
                      </div>
                    </Td>
                    <Td>
                      {b.worker
                        ? <div className="flex items-center gap-2"><Avatar name={b.worker.name} size="sm" /><span className="text-slate-600">{b.worker.name}</span></div>
                        : <span className="text-xs text-slate-400 italic">Unassigned</span>
                      }
                    </Td>
                    <Td>
                      {b.items?.slice(0, 1).map((item: any) => (
                        <span key={item.service?.name} className="text-sm text-slate-600">{item.service?.name}</span>
                      ))}
                    </Td>
                    <Td>
                      <div className="text-xs">
                        <p className="font-medium text-slate-700">{formatDate(b.scheduledDate)}</p>
                        <p className="text-slate-400">{b.scheduledTime}</p>
                      </div>
                    </Td>
                    <Td><span className="font-semibold text-slate-800">{formatCurrency(b.finalAmount)}</span></Td>
                    <Td>
                      <div className="text-xs">
                        <p className="font-medium text-slate-600">{b.payment?.method || '—'}</p>
                        {b.payment && <Badge label={b.payment.status} className="mt-0.5" />}
                      </div>
                    </Td>
                    <Td><Badge label={b.status} /></Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <Button size="sm" variant="ghost" icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => setSelected(b)}>View</Button>
                        {!['COMPLETED', 'CANCELLED'].includes(b.status) && (
                          <Button size="sm" variant="danger" icon={<XCircle className="w-3.5 h-3.5" />}
                            onClick={() => setCancelModal({ open: true, id: b.id })}>Cancel</Button>
                        )}
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
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Booking #${selected?.bookingNumber}`} size="xl">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Badge label={selected.status} />
              <span className="text-sm text-slate-500">{formatDateTime(selected.createdAt)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</p>
                <div className="flex items-center gap-2">
                  <Avatar name={selected.user?.name} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{selected.user?.name}</p>
                    <p className="text-xs text-slate-500">{selected.user?.phone}</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Worker</p>
                {selected.worker ? (
                  <div className="flex items-center gap-2">
                    <Avatar name={selected.worker.name} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{selected.worker.name}</p>
                      <p className="text-xs text-slate-500">{selected.worker.phone}</p>
                    </div>
                  </div>
                ) : <p className="text-sm text-slate-400 italic">Not assigned</p>}
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Services</p>
              {selected.items?.map((item: any) => (
                <div key={item.service?.name} className="flex justify-between text-sm">
                  <span className="text-slate-700">{item.service?.name} × {item.quantity}</span>
                  <span className="font-medium">{formatCurrency(item.price)}</span>
                </div>
              ))}
              <div className="border-t border-slate-200 mt-3 pt-3 space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal</span><span>{formatCurrency(selected.totalAmount)}</span>
                </div>
                {selected.discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600">
                    <span>Discount</span><span>-{formatCurrency(selected.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Tax</span><span>{formatCurrency(selected.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-800 pt-1 border-t border-slate-200">
                  <span>Total</span><span>{formatCurrency(selected.finalAmount)}</span>
                </div>
              </div>
            </div>

            {selected.address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="text-slate-600">{selected.address.fullAddress}</span>
              </div>
            )}

            {selected.cancelReason && (
              <div className="bg-red-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-red-600 mb-1">Cancellation Reason</p>
                <p className="text-sm text-red-700">{selected.cancelReason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Cancel Modal */}
      <Modal open={!!cancelModal?.open} onClose={() => setCancelModal(null)} title="Cancel Booking" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Provide a reason for cancellation:</p>
          <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
            placeholder="Reason for cancellation…"
            className="w-full border border-slate-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setCancelModal(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleCancel}>Confirm Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
