'use client';
import { useEffect, useState } from 'react';
import { Users, HardHat, CalendarCheck, TrendingUp, Clock, AlertCircle, Ticket, DollarSign } from 'lucide-react';
import { reportsApi } from '@/lib/api';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { formatCurrency } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const BOOKING_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  ACCEPTED: '#3b82f6',
  IN_PROGRESS: '#8b5cf6',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
  REJECTED: '#f87171',
};

export default function DashboardPage() {
   const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const [statsRes, revRes] = await Promise.all([
        reportsApi.getDashboard(),
        reportsApi.getRevenue(
          new Date(Date.now() - 29 * 86400000).toISOString().split('T')[0],
          new Date().toISOString().split('T')[0],
          'day'
        )
      ]);
      setStats(statsRes.data?.data);
      setRevenue(revRes.data?.data);
    } catch (e) {
      setError(true);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Spinner />;

  if (error) {
    return (
      <EmptyState
        icon={<TrendingUp className="w-8 h-8" />}
        title="Couldn't load dashboard"
        description="Check that the backend API is reachable, then try again."
        action={<Button onClick={load}>Retry</Button>}
      />
    );
  }

  const revenueChart = revenue?.chart
    ? Object.entries(revenue.chart).map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        amount,
      }))
    : [];

  const bookingPie = stats?.bookingsByStatus
    ? Object.entries(stats.bookingsByStatus).map(([status, count]) => ({ status, count }))
    : [];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div className="cursor-pointer" onClick= {()=>router.push('/customers')}>
        <StatCard title="Total Customers" value={stats?.totalUsers?.toLocaleString() ?? '—'}
          icon={<Users className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-50"
          subtitle="Registered users" />
          </div>
          <div className="cursor-pointer" onClick= {()=>router.push('/tickets')}>
        <StatCard title="Active Workers" value={stats?.totalWorkers?.toLocaleString() ?? '—'}
          icon={<HardHat className="w-5 h-5 text-emerald-600" />} iconBg="bg-emerald-50"
          subtitle={`${stats?.pendingWorkers ?? 0} pending approval`} />
        </div>
        <div className="cursor-pointer" onClick= {()=>router.push('/bookings')}>
        <StatCard title="Total Bookings" value={stats?.totalBookings?.toLocaleString() ?? '—'}
          icon={<CalendarCheck className="w-5 h-5 text-purple-600" />} iconBg="bg-purple-50"
          subtitle={`${stats?.todayBookings ?? 0} today`} />
        </div>
        <div className="cursor-pointer" onClick= {()=>router.push('/reports')}>
        <StatCard title="Total Revenue" value={formatCurrency(stats?.totalRevenue ?? 0)}
          icon={<TrendingUp className="w-5 h-5 text-amber-600" />} iconBg="bg-amber-50"
          subtitle={`${formatCurrency(stats?.todayRevenue ?? 0)} today`} />
        </div>
      </div>

      {/* Alerts row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Card className="p-5 border-l-4 border-l-amber-400">
          <div onClick={() => router.push('/workers')} className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-500" />
            <div>
              <p className="font-semibold text-slate-800">{stats?.pendingWorkers ?? 0} Workers Pending</p>
              <p className="text-sm text-slate-500">Awaiting document verification & approval</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 border-l-4 border-l-red-400">
          <div onClick={() => router.push('/support')} className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <p className="font-semibold text-slate-800">{stats?.openTickets ?? 0} Open Tickets</p>
              <p className="text-sm text-slate-500">Support tickets requiring attention</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Revenue — Last 30 Days</CardTitle>
              <span className="text-sm font-semibold text-blue-600">{formatCurrency(revenue?.total ?? 0)}</span>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueChart} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                  interval={4} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                  tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                  formatter={(v: any) => [formatCurrency(v), 'Revenue']}
                />
                <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2}
                  fill="url(#revGrad)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Bookings by Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={bookingPie} cx="50%" cy="45%" innerRadius={60} outerRadius={90}
                  dataKey="count" nameKey="status" paddingAngle={2}>
                  {bookingPie.map((entry) => (
                    <Cell key={entry.status} fill={BOOKING_COLORS[entry.status] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => (
                  <span style={{ fontSize: 11, color: '#64748b' }}>{v}</span>
                )} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
