'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users2,
  UserCheck,
  ListTree,
  Database,
  Menu,
  X,
  Sparkles,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Partner Agencies', href: '/agencies', icon: Building2 },
  { name: 'CBOs', href: '/cbos', icon: Users2 },
  { name: 'Participants', href: '/participants', icon: UserCheck },
  { name: 'Organized List', href: '/organized-list', icon: ListTree },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-3 left-4 z-40 p-2 rounded-lg bg-white border border-slate-200 shadow-sm md:hidden text-slate-600 hover:text-slate-900"
        aria-label="Toggle navigation"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* App Branding */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight leading-none">
              PMS Portal
            </h1>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Participant Management
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Main Menu
          </div>
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* Connected Applications Section */}
          <div className="pt-5 mt-4 border-t border-slate-100">
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Connected Apps
            </div>

            <a
              href="https://database-collection-six.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-2.5 rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-emerald-100/40 hover:from-emerald-100/70 hover:to-emerald-200/50 hover:border-emerald-300 transition-all group shadow-2xs"
            >
              <div className="h-8 w-8 rounded-lg bg-[#0d6b38] text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
                <Globe className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-950 truncate">
                    EPAHP CBO System
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-emerald-700 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[11px] text-emerald-900/80 line-clamp-2 mt-0.5 leading-tight">
                  DSWD FO-III CBO Database &amp; Forms
                </p>
              </div>
            </a>
          </div>
        </div>

        {/* Hierarchy Information Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="rounded-lg bg-white p-3 border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1">
              <Database className="h-3.5 w-3.5 text-indigo-600" />
              <span>Relational Flow</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-mono">
              Agency &rarr; CBO &rarr; Participant
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

