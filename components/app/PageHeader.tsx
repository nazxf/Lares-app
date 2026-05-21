import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
  meta?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  action,
  meta,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0 space-y-1">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 text-pretty">
          {title}
        </h1>
        {description && (
          <p className="max-w-[65ch] text-sm leading-6 text-slate-500 text-pretty">
            {description}
          </p>
        )}
        {meta && <div className="pt-1">{meta}</div>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>
  );
}
