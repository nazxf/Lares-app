import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center',
        className
      )}
    >
      {Icon && (
        <div className="mb-3 flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      )}
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
