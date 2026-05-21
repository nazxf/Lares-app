import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type MetricTone = 'primary' | 'water' | 'gas' | 'success' | 'warning' | 'danger' | 'neutral';

const toneClasses: Record<MetricTone, { icon: string; badge: string; value: string }> = {
  primary: {
    icon: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
    badge: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
    value: 'text-slate-950',
  },
  water: {
    icon: 'bg-sky-50 text-sky-700 ring-sky-100',
    badge: 'bg-sky-50 text-sky-700 ring-sky-100',
    value: 'text-slate-950',
  },
  gas: {
    icon: 'bg-amber-50 text-amber-700 ring-amber-100',
    badge: 'bg-amber-50 text-amber-700 ring-amber-100',
    value: 'text-slate-950',
  },
  success: {
    icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    value: 'text-emerald-700',
  },
  warning: {
    icon: 'bg-amber-50 text-amber-700 ring-amber-100',
    badge: 'bg-amber-50 text-amber-700 ring-amber-100',
    value: 'text-amber-700',
  },
  danger: {
    icon: 'bg-red-50 text-red-700 ring-red-100',
    badge: 'bg-red-50 text-red-700 ring-red-100',
    value: 'text-red-700',
  },
  neutral: {
    icon: 'bg-slate-100 text-slate-700 ring-slate-200',
    badge: 'bg-slate-100 text-slate-700 ring-slate-200',
    value: 'text-slate-950',
  },
};

interface MetricTileProps {
  title: string;
  value: ReactNode;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  tone?: MetricTone;
  className?: string;
  valueClassName?: string;
}

export function MetricTile({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  tone = 'primary',
  className,
  valueClassName,
}: MetricTileProps) {
  const styles = toneClasses[tone];

  return (
    <article
      className={cn(
        'group rounded-lg border border-slate-200/80 bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_10px_26px_-22px_rgba(15,23,42,0.45)]',
        className
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className={cn('flex size-9 items-center justify-center rounded-lg ring-1', styles.icon)}>
          <Icon className="size-[18px]" aria-hidden="true" />
        </div>
        {badge && (
          <span className={cn('rounded-md px-2 py-1 text-[10px] font-semibold ring-1', styles.badge)}>
            {badge}
          </span>
        )}
      </div>
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <div className={cn('mt-1 min-w-0 break-words font-mono text-2xl font-semibold tracking-tight tabular-nums', styles.value, valueClassName)}>
        {value}
      </div>
      {subtitle && <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>}
    </article>
  );
}
