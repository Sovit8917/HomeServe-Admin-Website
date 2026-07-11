'use client';
import { useEffect, useState, useCallback } from 'react';
import { reportsApi } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar } from '@/components/ui/Avatar';
import { formatCurrency } from '@/lib/utils';
import { BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const SERVICE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

function toISODate(d: Date) {
  return d.toISOString().split('T')[0];
}

export default function ReportsPage() {
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [revenue, setRevenue] = useState<any>(null);
  const [bookings, setBookings] = useState<any>(null);
  const [workers, setWorkers] = useState<any>(null);
  const [customers, setCustomers] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const from = toISODate(new Date(Date.now() - (+period - 1) * 86400000));
      const to = toISODate(new Date());
      const [revRes, bookRes, workRes, custRes] = await Promise.all([
        reportsApi.getRevenue(from, to, 'day'),
        reportsApi.getBookings(from, to),
        reportsApi.getWorkers(from, to),
        reportsApi.getCustomers(from, to),
      ]);
      setRevenue(revRes.data?.data);
      setBookings(bookRes.data?.data);
      setWorkers(workRes.data?.data);
      setCustomers(custRes.data?.data);
    } catch {
      setError(true);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;

  if (error) {
    return (
      <EmptyState icon={<BarChart2 className="w-8 h-8" />} title="Couldn't load reports"
        description="Check that the backend API is reachable, then try again."
        action={<Button onClick={load}>Retry</Button>} />
    );
  }

  const chartData = revenue?.chart
    ? Object.entries(revenue.chart).map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        revenue: amount as number,
      }))
    : [];

  const totalRevenue = revenue?.total ?? 0;
  const totalBookings = bookings?.total ?? 0;

  const topServices = (bookings?.topServices || [])
    .filter((s: any) => s.service)
    .map((s: any) => ({ name: s.service.name, count: s._count }));

  const topWorkers = (workers?.topWorkers || []).filter((w: any) => w.worker);
  const topCustomers = (customers?.topCustomers || []).filter((c: any) => c.user);
  const maxWorkerJobs = topWorkers[0]?.completedJobs || 1;

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit">
          {[['7', '7 Days'], ['30', '30 Days'], ['90', '90 Days']].map(([v, l]) => (
            <button key={v} onClick={() => setPeriod(v)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === v ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-4 text-sm">
          <span className="text-slate-500">Total Revenue: <strong className="text-slate-800">{formatCurrency(totalRevenue)}</strong></span>
          <span className="text-slate-500">Total Bookings: <strong className="text-slate-800">{totalBookings}</strong></span>
        </div>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Revenue Trend</CardTitle>
            <span className="text-sm font-bold text-blue-600">{formatCurrency(totalRevenue)}</span>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <EmptyState icon={<BarChart2 className="w-8 h-8" />} title="No revenue in this period" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={+period === 7 ? 0 : 4} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                  formatter={(v: any) => [formatCurrency(v), 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Bookings by status & Top Services row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader><CardTitle>Bookings by Status</CardTitle></CardHeader>
          <CardContent>
            {!bookings?.byStatus || Object.keys(bookings.byStatus).length === 0 ? (
              <EmptyState icon={<BarChart2 className="w-8 h-8" />} title="No bookings in this period" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={Object.entries(bookings.byStatus).map(([status, count]) => ({ status, count }))}
                  margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="status" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Services</CardTitle></CardHeader>
          <CardContent>
            {topServices.length === 0 ? (
              <EmptyState icon={<BarChart2 className="w-8 h-8" />} title="No completed bookings yet" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={topServices} cx="50%" cy="45%" innerRadius={55} outerRadius={85}
                    dataKey="count" nameKey="name" paddingAngle={2}>
                    {topServices.map((s: any, i: number) => <Cell key={s.name} fill={SERVICE_COLORS[i % SERVICE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }} />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: '#64748b' }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Workers & Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader><CardTitle>Top Workers</CardTitle></CardHeader>
          <CardContent className="p-0">
            {topWorkers.length === 0 ? (
              <div className="px-6 py-8"><EmptyState icon={<BarChart2 className="w-8 h-8" />} title="No completed jobs yet" /></div>
            ) : (
              <div className="divide-y divide-slate-50">
                {topWorkers.map((w: any, i: number) => (
                  <div key={w.worker.id} className="flex items-center gap-3 px-6 py-3">
                    <span className="w-6 text-center text-xs font-bold text-slate-400">#{i + 1}</span>
                    <Avatar name={w.worker.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{w.worker.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{w.completedJobs} jobs · ⭐ {w.worker.rating?.toFixed(1) ?? '0.0'}</p>
                    </div>
                    <div className="text-right">
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(w.completedJobs / maxWorkerJobs) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Top Customers</CardTitle></CardHeader>
          <CardContent className="p-0">
            {topCustomers.length === 0 ? (
              <div className="px-6 py-8"><EmptyState icon={<BarChart2 className="w-8 h-8" />} title="No bookings yet" /></div>
            ) : (
              <div className="divide-y divide-slate-50">
                {topCustomers.map((c: any, i: number) => (
                  <div key={c.user.id} className="flex items-center gap-3 px-6 py-3">
                    <span className="w-6 text-center text-xs font-bold text-slate-400">#{i + 1}</span>
                    <Avatar name={c.user.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{c.user.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{c.bookings} bookings</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">{formatCurrency(c.totalSpend ?? 0)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
