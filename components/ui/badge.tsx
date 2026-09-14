import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'neutral' | 'outline';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variants = {
    default: 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20',
    success: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
    warning: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20',
    danger: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20',
    neutral: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/20',
    outline: 'border border-slate-300 text-slate-700 bg-white',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

