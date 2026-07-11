'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, HardHat, CalendarCheck, CreditCard,
  Tag, Wrench, Ticket, Bell, Settings, Image, FileBarChart2,
  LogOut, Zap, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Avatar } from './ui/Avatar';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

const NAV = [
  {
    group: 'Overview',
    links: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/reports', label: 'Reports', icon: FileBarChart2 },
    ]
  },
  {
    group: 'Management',
    links: [
      { href: '/customers', label: 'Customers', icon: Users },
      { href: '/workers', label: 'Workers', icon: HardHat },
      { href: '/bookings', label: 'Bookings', icon: CalendarCheck },
      { href: '/payments', label: 'Payments', icon: CreditCard },
    ]
  },
  {
    group: 'Catalog',
    links: [
      { href: '/categories', label: 'Categories', icon: Tag },
      { href: '/services', label: 'Services', icon: Wrench },
      { href: '/coupons', label: 'Coupons', icon: Ticket },
    ]
  },
  {
    group: 'Engagement',
    links: [
      { href: '/notifications', label: 'Notifications', icon: Bell },
      { href: '/banners', label: 'Banners', icon: Image },
      { href: '/support', label: 'Support', icon: Zap },
    ]
  },
  {
    group: 'System',
    links: [
      { href: '/settings', label: 'Settings', icon: Settings },
    ]
  }
];

export function Sidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 w-[260px] bg-white border-r border-slate-100 flex flex-col z-40',
          'transition-transform duration-200 ease-out',
          'lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-sm">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm leading-tight">HomeService</p>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 lg:hidden">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {NAV.map(({ group, links }) => (
            <div key={group} className="mb-6">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-2">{group}</p>
              {links.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={cn(
                      'sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 group',
                      active
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )}
                  >
                    <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600')} />
                    <span className="flex-1">{label}</span>
                    {active && <ChevronRight className="w-3.5 h-3.5 text-blue-400" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-50">
            <Avatar name={user?.name || 'Admin'} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 truncate">{user?.name || 'Admin'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || 'admin'}</p>
            </div>
            <button onClick={logout} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-red-500 transition-colors" title="Logout">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
