import { cn, STATUS_COLORS } from '@/lib/utils';

interface BadgeProps {
  label: string;
  className?: string;
  variant?: 'status' | 'default';
}

export function Badge({ label, className, variant = 'status' }: BadgeProps) {
  const colorClass = variant === 'status'
    ? (STATUS_COLORS[label] || 'bg-slate-100 text-slate-600')
    : 'bg-slate-100 text-slate-600';
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      colorClass, className
    )}>
      {label}
    </span>
  );
}
