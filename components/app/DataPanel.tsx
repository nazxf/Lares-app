import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface DataPanelProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function DataPanel({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: DataPanelProps) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-lg border border-slate-200/80 bg-card text-card-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
        className
      )}
    >
      {(title || description || action) && (
        <div className="flex flex-col gap-3 border-b border-slate-200/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title && <h2 className="truncate text-sm font-semibold text-slate-900">{title}</h2>}
            {description && <p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={cn('p-4', contentClassName)}>{children}</div>
    </section>
  );
}
