'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Database, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Dashboard Overview',
    subtitle: 'System-wide summary metrics and quick enrollment insights',
  },
  '/agencies': {
    title: 'Partner Agencies',
    subtitle: 'Manage partner agencies at the top of the organization hierarchy',
  },
  '/cbos': {
    title: 'Community-Based Organizations',
    subtitle: 'Manage CBO branches mapped to partner agencies',
  },
  '/participants': {
    title: 'Participant Directory',
    subtitle: 'Manage participants, track confirmation dates, and update statuses',
  },
  '/organized-list': {
    title: 'Organized Hierarchical View',
    subtitle: 'Visual tree of Agencies, CBOs, and enrolled participants sorted alphabetically',
  },
};

import { ConnectionStatusBadge } from './connection-status-badge';

export function Header() {
  const pathname = usePathname();
  const current = pageTitles[pathname] || {
    title: 'Participant Management System',
    subtitle: 'Internal operational management portal',
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-20 px-6 md:px-8 flex items-center justify-between">
      <div className="pl-10 md:pl-0">
        <h2 className="text-base md:text-lg font-bold text-slate-900 leading-tight">
          {current.title}
        </h2>
        <p className="text-xs text-slate-500 hidden sm:block">
          {current.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <ConnectionStatusBadge />
      </div>
    </header>
  );
}

