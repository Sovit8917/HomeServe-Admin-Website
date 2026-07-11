'use client';
import { useEffect, useState, useCallback } from 'react';
import { CreditCard, Wallet } from 'lucide-react';
import { paymentsApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatCurrency } from '@/lib/utils';

const MOCK_PAY = Array.from({ length: 15 }, (_, i) => ({
  id: `p${i}`, amount: 500 + i * 200,
  method: ['UPI', 'CASH', 'CARD', 'WALLET'][i % 4],
  status: ['SUCCESS', 'PENDING', 'FAILED', 'REFUNDED'][i % 4],
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  booking: {
    bookingNumber: `HS${1000 + i}`,
    user: { name: ['Arjun', 'Priya', 'Rahul'][i % 3], phone: `98765432${i}` },
    worker: { name: ['Suresh', 'Ramesh'][i % 2], phone: `77654321${i}` },
  }
}));

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'payments' | 'wallets'>('payments');
  const [wallets, setWallets] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'payments') {
        const res = await paymentsApi.list(status || undefined, page);
        setPayments(res.data?.data?.payments || []);
        setTotal(res.data?.data?.total || 0);
      } else {
        const res = await paymentsApi.workerWallets(page);
        setWallets(res.data?.data?.wallets || []);
        setTotal(res.data?.data?.total || 0);
      }
    } catch {
      setPayments(MOCK_PAY.filter(p => !status || p.status === status));
      setWallets(Array.from({ length: 8 }, (_, i) => ({
        id: `ww${i}`, balance: 1000 + i * 500,
        worker: { name: ['Suresh', 'Ramesh', 'Bikash'][i % 3], phone: `77654321${i}` }
      })));
      setTotal(150);
    } finally { setLoading(false); }
  }, [status, page, tab]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
        {(['payments', 'wallets'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            {t === 'payments' ? 'Transactions' : 'Worker Wallets'}
          </button>
        ))}
      </div>

      {tab === 'payments' && (
        <div className="flex items-center gap-4">
          <div className="w-48">
            <Select value={status} onChange={(e: any) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </Select>
          </div>
        </div>
      )}

      <Card>
        {loading ? <Spinner /> : (
          tab === 'payments' ? (
            payments.length === 0
              ? <EmptyState icon={<CreditCard className="w-8 h-8" />} title="No payments found" />
              : <>
                  <Table>
                    <Thead>
                      <tr>
                        <Th>Booking</Th>
                        <Th>Customer</Th>
                        <Th>Worker</Th>
                        <Th>Amount</Th>
                        <Th>Method</Th>
                        <Th>Status</Th>
                        <Th>Date</Th>
                      </tr>
                    </Thead>
                    <Tbody>
                      {payments.map(p => (
                        <Tr key={p.id}>
                          <Td><span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">#{p.booking?.bookingNumber}</span></Td>
                          <Td>
                            <div className="flex items-center gap-2">
                              <Avatar name={p.booking?.user?.name} size="sm" />
                              <span className="text-sm font-medium text-slate-700">{p.booking?.user?.name}</span>
                            </div>
                          </Td>
                          <Td>
                            {p.booking?.worker
                              ? <div className="flex items-center gap-2"><Avatar name={p.booking.worker.name} size="sm" /><span className="text-sm">{p.booking.worker.name}</span></div>
                              : <span className="text-slate-400 text-xs">—</span>
                            }
                          </Td>
                          <Td><span className="font-bold text-slate-800">{formatCurrency(p.amount)}</span></Td>
                          <Td><span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">{p.method}</span></Td>
                          <Td><Badge label={p.status} /></Td>
                          <Td className="text-slate-500 text-xs">{formatDate(p.createdAt)}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                  <Pagination page={page} total={total} limit={20} onChange={setPage} />
                </>
          ) : (
            wallets.length === 0
              ? <EmptyState icon={<Wallet className="w-8 h-8" />} title="No wallets found" />
              : <>
                  <Table>
                    <Thead>
                      <tr>
                        <Th>Worker</Th>
                        <Th>Phone</Th>
                        <Th>Balance</Th>
                      </tr>
                    </Thead>
                    <Tbody>
                      {wallets.map(w => (
                        <Tr key={w.id}>
                          <Td>
                            <div className="flex items-center gap-2">
                              <Avatar name={w.worker?.name} size="sm" />
                              <span className="font-medium text-slate-800">{w.worker?.name}</span>
                            </div>
                          </Td>
                          <Td className="text-slate-500">{w.worker?.phone}</Td>
                          <Td><span className="font-bold text-emerald-600 text-base">{formatCurrency(w.balance)}</span></Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                  <Pagination page={page} total={total} limit={20} onChange={setPage} />
                </>
          )
        )}
      </Card>
    </div>
  );
}
