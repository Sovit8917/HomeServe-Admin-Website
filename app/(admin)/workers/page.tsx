'use client';
import { useEffect, useState, useCallback } from 'react';
import { Search, CheckCircle, XCircle, AlertTriangle, Eye, Star, FileText } from 'lucide-react';
import { workersApi } from '@/lib/api';
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
import { formatDate, formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function WorkersPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await workersApi.list(status || undefined, search || undefined, page);
      setWorkers(res.data?.data?.workers || []);
      setTotal(res.data?.data?.total || 0);
    } catch {
      setError(true);
      toast.error('Failed to load workers');
    } finally { setLoading(false); }
  }, [search, status, page]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id: string) => {
    try {
      const res = await workersApi.get(id);
      setSelected(res.data?.data);
    } catch { toast.error('Failed to load worker details'); }
  };

  const updateStatus = async (id: string, s: string) => {
    try {
      await workersApi.updateStatus(id, s);
      toast.success(`Worker ${s.toLowerCase()}`);
      load();
      if (selected?.id === id) setSelected((prev: any) => ({ ...prev, status: s }));
    } catch { toast.error('Failed to update status'); }
  };

  const verifyDoc = async (docId: string, verified: boolean) => {
    try {
      await workersApi.verifyDoc(docId, verified);
      toast.success(`Document ${verified ? 'verified' : 'rejected'}`);
      if (selected) {
        setSelected((prev: any) => ({
          ...prev,
          documents: prev.documents.map((d: any) => d.id === docId ? { ...d, isVerified: verified } : d)
        }));
      }
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex-1 max-w-sm">
          <Input placeholder="Search workers…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            icon={<Search className="w-4 h-4" />} />
        </div>
        <div className="w-full sm:w-44">
          <Select value={status} onChange={(e: any) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="SUSPENDED">Suspended</option>
          </Select>
        </div>
        <p className="text-sm text-slate-500 sm:ml-auto">{total} workers</p>
      </div>

      <Card>
        {loading ? <Spinner /> : error ? (
          <EmptyState icon={<Search className="w-8 h-8" />} title="Couldn't load workers"
            description="Check that the backend API is reachable, then try again."
            action={<Button onClick={load}>Retry</Button>} />
        ) : workers.length === 0 ? (
          <EmptyState icon={<Search className="w-8 h-8" />} title="No workers found" />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>Worker</Th>
                  <Th>Phone</Th>
                  <Th>Services</Th>
                  <Th>Rating</Th>
                  <Th>Jobs</Th>
                  <Th>Status</Th>
                  <Th>Online</Th>
                  <Th>Actions</Th>
                </tr>
              </Thead>
              <Tbody>
                {workers.map(w => (
                  <Tr key={w.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar name={w.name} />
                          {w.isOnline && (
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white" />
                          )}
                        </div>
                        <span className="font-medium text-slate-800">{w.name || 'Unknown'}</span>
                      </div>
                    </Td>
                    <Td className="text-slate-500">{w.phone}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {(w.services || []).slice(0, 2).map((s: any) => (
                          <span key={s.service?.name} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{s.service?.name}</span>
                        ))}
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="text-sm font-medium text-slate-700">{w.rating}</span>
                      </div>
                    </Td>
                    <Td><span className="font-medium">{w.totalJobs ?? w._count?.bookings ?? 0}</span></Td>
                    <Td><Badge label={w.status} /></Td>
                    <Td>
                      {w.isOnline
                        ? <span className="text-xs font-medium text-emerald-600 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block"/>Online</span>
                        : <span className="text-xs text-slate-400">Offline</span>
                      }
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <Button size="sm" variant="ghost" icon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => openDetail(w.id)}>View</Button>
                        {w.status === 'PENDING' && (
                          <>
                            <Button size="sm" variant="success" icon={<CheckCircle className="w-3.5 h-3.5" />}
                              onClick={() => updateStatus(w.id, 'APPROVED')}>Approve</Button>
                            <Button size="sm" variant="danger" icon={<XCircle className="w-3.5 h-3.5" />}
                              onClick={() => updateStatus(w.id, 'REJECTED')}>Reject</Button>
                          </>
                        )}
                        {w.status === 'APPROVED' && (
                          <Button size="sm" variant="danger" icon={<AlertTriangle className="w-3.5 h-3.5" />}
                            onClick={() => updateStatus(w.id, 'SUSPENDED')}>Suspend</Button>
                        )}
                        {w.status === 'SUSPENDED' && (
                          <Button size="sm" variant="success" icon={<CheckCircle className="w-3.5 h-3.5" />}
                            onClick={() => updateStatus(w.id, 'APPROVED')}>Reinstate</Button>
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

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Worker Profile" size="xl">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <Avatar name={selected.name} size="lg" />
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-semibold text-slate-800 text-base">{selected.name || 'Unknown'}</h3>
                  <Badge label={selected.status} />
                  {selected.isOnline && <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Online</span>}
                </div>
                <p className="text-sm text-slate-500 mt-1">{selected.phone} · {selected.email || 'No email'}</p>
                <p className="text-xs text-slate-400 mt-0.5">{selected.experience}yr experience · Radius: {selected.serviceRadius}km</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Rating', value: `${selected.rating}★` },
                { label: 'Total Jobs', value: selected.totalJobs ?? selected._count?.bookings ?? 0 },
                { label: 'Reviews', value: selected._count?.reviews ?? 0 },
                { label: 'Wallet', value: formatCurrency(selected.wallet?.balance ?? 0) },
              ].map(s => (
                <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-slate-800">{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Services */}
            {selected.services?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Services Offered</p>
                <div className="flex flex-wrap gap-2">
                  {selected.services.map((s: any) => (
                    <span key={s.id} className="bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-full font-medium">
                      {s.service?.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {selected.documents?.length > 0 ? (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Documents</p>
                <div className="space-y-2">
                  {selected.documents.map((doc: any) => (
                    <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-sm font-medium text-slate-700">{doc.type}</span>
                        <Badge label={doc.isVerified ? 'VERIFIED' : 'PENDING'}
                          className={doc.isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'} />
                      </div>
                      <div className="flex gap-2">
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="ghost" icon={<Eye className="w-3.5 h-3.5" />}>View</Button>
                        </a>
                        {!doc.isVerified && (
                          <Button size="sm" variant="success" onClick={() => verifyDoc(doc.id, true)}>Verify</Button>
                        )}
                        {doc.isVerified && (
                          <Button size="sm" variant="danger" onClick={() => verifyDoc(doc.id, false)}>Revoke</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-xl text-sm text-amber-700 flex items-center gap-2">
                <FileText className="w-4 h-4 shrink-0" /> No documents uploaded yet by this worker.
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 flex-wrap">
              {selected.status === 'PENDING' && (
                <>
                  <Button variant="success" onClick={() => updateStatus(selected.id, 'APPROVED')}>Approve Worker</Button>
                  <Button variant="danger" onClick={() => updateStatus(selected.id, 'REJECTED')}>Reject Worker</Button>
                </>
              )}
              {selected.status === 'APPROVED' && (
                <Button variant="danger" onClick={() => updateStatus(selected.id, 'SUSPENDED')}>Suspend Worker</Button>
              )}
              {selected.status === 'SUSPENDED' && (
                <Button variant="success" onClick={() => updateStatus(selected.id, 'APPROVED')}>Reinstate Worker</Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
