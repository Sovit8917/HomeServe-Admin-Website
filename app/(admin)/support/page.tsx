'use client';
import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, CheckCircle, X, ChevronDown, Send } from 'lucide-react';
import { supportApi } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { formatDateTime } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await supportApi.list(status || undefined, page);
      setTickets(res.data?.data?.tickets || []);
      setTotal(res.data?.data?.total || 0);
    } catch {
      setError(true);
      toast.error('Failed to load tickets');
    } finally { setLoading(false); }
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  const openTicket = async (t: any) => {
    setSelected(t);
    setDetailLoading(true);
    try {
      const res = await supportApi.get(t.id);
      setSelected(res.data?.data);
    } catch {
      toast.error('Failed to load conversation');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAction = async (action: 'resolve' | 'close', id: string) => {
    try {
      action === 'resolve' ? await supportApi.resolve(id) : await supportApi.close(id);
      toast.success(`Ticket ${action}d`);
      load();
      if (selected?.id === id) setSelected((s: any) => ({ ...s, status: action === 'resolve' ? 'RESOLVED' : 'CLOSED' }));
    } catch { toast.error('Failed'); }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selected) return;
    setSending(true);
    try {
      const res = await supportApi.reply(selected.id, replyText.trim());
      const newMsg = res.data?.data;
      setSelected((s: any) => ({ ...s, messages: [...(s.messages || []), newMsg] }));
      setReplyText('');
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const reporter = (t: any) => t.user || t.worker;
  const reporterType = (t: any) => t.user ? 'Customer' : 'Worker';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="w-full sm:w-44">
          <Select value={status} onChange={(e: any) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </Select>
        </div>
        <p className="text-sm text-slate-500 sm:ml-auto">{total} tickets</p>
      </div>

      <Card>
        {loading ? <Spinner /> : error ? (
          <EmptyState icon={<MessageSquare className="w-8 h-8" />} title="Couldn't load tickets"
            description="Check that the backend API is reachable, then try again."
            action={<Button onClick={load}>Retry</Button>} />
        ) : tickets.length === 0 ? (
          <EmptyState icon={<MessageSquare className="w-8 h-8" />} title="No tickets found" />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>Reporter</Th>
                  <Th>Type</Th>
                  <Th>Subject</Th>
                  <Th>Status</Th>
                  <Th>Created</Th>
                  <Th>Actions</Th>
                </tr>
              </Thead>
              <Tbody>
                {tickets.map(t => (
                  <Tr key={t.id} onClick={() => openTicket(t)}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Avatar name={reporter(t)?.name} size="sm" />
                        <span className="font-medium text-slate-700">{reporter(t)?.name || 'Unknown'}</span>
                      </div>
                    </Td>
                    <Td>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${t.user ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {reporterType(t)}
                      </span>
                    </Td>
                    <Td>
                      <p className="text-sm text-slate-700 max-w-xs truncate">{t.subject}</p>
                    </Td>
                    <Td><Badge label={t.status} /></Td>
                    <Td className="text-xs text-slate-500">{formatDateTime(t.createdAt)}</Td>
                    <Td onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        {t.status === 'OPEN' && (
                          <Button size="sm" variant="primary" icon={<CheckCircle className="w-3.5 h-3.5" />}
                            onClick={() => handleAction('resolve', t.id)}>Resolve</Button>
                        )}
                        {t.status === 'IN_PROGRESS' && (
                          <Button size="sm" variant="success" icon={<CheckCircle className="w-3.5 h-3.5" />}
                            onClick={() => handleAction('resolve', t.id)}>Resolve</Button>
                        )}
                        {['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(t.status) && (
                          <Button size="sm" variant="ghost" icon={<X className="w-3.5 h-3.5" />}
                            onClick={() => handleAction('close', t.id)}>Close</Button>
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

      <Modal open={!!selected} onClose={() => { setSelected(null); setReplyText(''); }} title="Ticket Details" size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-800">{selected.subject}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge label={selected.status} />
                  <span className="text-xs text-slate-400">{formatDateTime(selected.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Avatar name={reporter(selected)?.name} size="sm" />
                <div>
                  <p className="text-sm font-medium text-slate-700">{reporter(selected)?.name}</p>
                  <p className="text-xs text-slate-400">{reporterType(selected)} · {reporter(selected)?.phone}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm text-slate-700">{selected.description}</p>
            </div>

            {/* Messages */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-3">Conversation</p>
              {detailLoading ? (
                <div className="py-6"><Spinner /></div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {selected.messages?.length ? selected.messages.map((m: any) => (
                    <div key={m.id} className={`flex ${m.senderType === 'ADMIN' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] sm:max-w-xs rounded-2xl px-4 py-2.5 text-sm ${
                        m.senderType === 'ADMIN'
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-slate-100 text-slate-700 rounded-bl-sm'
                      }`}>
                        <p>{m.message}</p>
                        <p className={`text-xs mt-1 ${m.senderType === 'ADMIN' ? 'text-blue-200' : 'text-slate-400'}`}>
                          {new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-400 text-center py-2">No replies yet — start the conversation below.</p>
                  )}
                </div>
              )}
            </div>

            {/* Reply composer */}
            {selected.status !== 'CLOSED' && (
              <div className="flex items-end gap-2 pt-1">
                <div className="flex-1">
                  <Textarea
                    placeholder="Type a reply to the customer/worker…"
                    value={replyText}
                    onChange={(e: any) => setReplyText(e.target.value)}
                    rows={2}
                  />
                </div>
                <Button
                  icon={<Send className="w-4 h-4" />}
                  loading={sending}
                  disabled={!replyText.trim()}
                  onClick={sendReply}
                >
                  Send
                </Button>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2 flex-wrap">
              {['OPEN', 'IN_PROGRESS'].includes(selected.status) && (
                <Button variant="success" icon={<CheckCircle className="w-4 h-4" />}
                  onClick={() => handleAction('resolve', selected.id)}>Mark Resolved</Button>
              )}
              {['OPEN', 'IN_PROGRESS', 'RESOLVED'].includes(selected.status) && (
                <Button variant="secondary" icon={<X className="w-4 h-4" />}
                  onClick={() => handleAction('close', selected.id)}>Close Ticket</Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
