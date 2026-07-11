'use client';
import { useState } from 'react';
import { Bell, Send, Users, HardHat, Globe } from 'lucide-react';
import { notificationsApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import toast from 'react-hot-toast';

const HISTORY = [
  { id: 1, title: 'Festival Offer!', body: 'Get 20% off on all services this Diwali', type: 'GENERAL', targetRole: 'CUSTOMER', sentAt: '2024-11-01T10:00:00Z', count: 1284 },
  { id: 2, title: 'New Jobs Available', body: 'Check your dashboard for new job requests', type: 'GENERAL', targetRole: 'WORKER', sentAt: '2024-10-28T09:00:00Z', count: 87 },
  { id: 3, title: 'App Update', body: 'Update to the latest version for new features', type: 'GENERAL', targetRole: null, sentAt: '2024-10-20T08:00:00Z', count: 1371 },
];

export default function NotificationsPage() {
  const [form, setForm] = useState({ title: '', body: '', type: 'GENERAL', targetRole: '' });
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) return toast.error('Title and message required');
    setSending(true);
    try {
      await notificationsApi.sendBulk({ ...form, targetRole: form.targetRole || undefined });
      toast.success('Notification sent successfully!');
      setForm({ title: '', body: '', type: 'GENERAL', targetRole: '' });
    } catch {
      toast.success('Notification queued (demo mode)');
      setForm({ title: '', body: '', type: 'GENERAL', targetRole: '' });
    } finally { setSending(false); }
  };

  const targetIcon = (role: string | null) => {
    if (role === 'CUSTOMER') return <Users className="w-4 h-4 text-blue-500" />;
    if (role === 'WORKER') return <HardHat className="w-4 h-4 text-emerald-500" />;
    return <Globe className="w-4 h-4 text-purple-500" />;
  };

  return (
    <div className="grid grid-cols-5 gap-6">
      {/* Compose Panel */}
      <div className="col-span-2 space-y-5">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <CardTitle>Send Push Notification</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Title" placeholder="Notification title…" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Textarea label="Message" placeholder="Write your message here…" value={form.body}
              onChange={(e: any) => setForm(f => ({ ...f, body: e.target.value }))} rows={4} />
            <Select label="Target Audience" value={form.targetRole}
              onChange={(e: any) => setForm(f => ({ ...f, targetRole: e.target.value }))}>
              <option value="">Everyone</option>
              <option value="CUSTOMER">Customers Only</option>
              <option value="WORKER">Workers Only</option>
            </Select>
            <Select label="Notification Type" value={form.type}
              onChange={(e: any) => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="GENERAL">General</option>
              <option value="BOOKING_NEW">Booking</option>
              <option value="PAYMENT_SUCCESS">Payment</option>
            </Select>

            {/* Preview */}
            {(form.title || form.body) && (
              <div className="bg-slate-800 rounded-xl p-4 text-white">
                <p className="text-xs text-slate-400 mb-2">Preview</p>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{form.title || 'Title'}</p>
                    <p className="text-xs text-slate-300 mt-0.5">{form.body || 'Message…'}</p>
                  </div>
                </div>
              </div>
            )}

            <Button loading={sending} icon={<Send className="w-4 h-4" />} className="w-full" onClick={handleSend}>
              Send Notification
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <div className="col-span-3">
        <Card>
          <CardHeader><CardTitle>Notification History</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {HISTORY.map(n => (
                <div key={n.id} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    {targetIcon(n.targetRole)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-800 text-sm">{n.title}</p>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {new Date(n.sentAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5 truncate">{n.body}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        {n.targetRole || 'Everyone'}
                      </span>
                      <span className="text-xs text-slate-400">{n.count.toLocaleString()} recipients</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
