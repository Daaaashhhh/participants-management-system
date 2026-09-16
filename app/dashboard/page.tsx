import Link from 'next/link';
import { getDashboardData } from '@/app/actions/dashboard';
import { checkSupabaseConnection } from '@/app/actions/connection';
import { StatusBadge } from '@/components/participants/status-badge';
import { formatDate } from '@/lib/utils';
import {
  Building2,
  Users2,
  UserCheck,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  ListTree,
  ShieldAlert,
  Database,
  ExternalLink,
  Globe,
  ClipboardCheck,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [dashboardData, connection] = await Promise.all([
    getDashboardData(),
    checkSupabaseConnection(),
  ]);
  const { stats, recentParticipants } = dashboardData;

  const confirmationRate =
    stats.totalParticipants > 0
      ? Math.round((stats.confirmedParticipants / stats.totalParticipants) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-indigo-100 border border-white/20 mb-3 backdrop-blur-xs">
            <Database className="h-3 w-3" />
            Supabase PostgreSQL Architecture
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Participant Management System
          </h1>
          <p className="text-indigo-100 text-sm sm:text-base mt-2 leading-relaxed">
            Monitor and maintain the three-tier organizational hierarchy:{' '}
            <strong className="text-white">Partner Agency &rarr; CBO &rarr; Participant</strong>.
          </p>
        </div>
      </div>

      {/* Database Connection Status Callout */}
      {connection.isConfigured && connection.tablesExist ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900">Connected to Live Supabase</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Database queries and mutations are live on <span className="font-mono">{connection.supabaseUrl}</span>.
              </p>
            </div>
          </div>
        </div>
      ) : connection.isConfigured && !connection.tablesExist ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">Supabase Connected, but Tables are Missing</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Run the SQL script in <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono">supabase/schema.sql</code> in your Supabase SQL Editor to create tables.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center flex-shrink-0">
              <Database className="h-3 w-3" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Running in Local Mock Mode</p>
              <p className="text-xs text-slate-600 mt-0.5">
                {connection.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Total Agencies */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Partner Agencies
            </span>
            <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats.totalAgencies}
            </span>
            <span className="text-xs text-slate-500 font-medium">registered</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link
              href="/agencies"
              className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
            >
              <span>Manage agencies</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Total CBOs */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              CBO Branches
            </span>
            <div className="h-9 w-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <Users2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats.totalCbos}
            </span>
            <span className="text-xs text-slate-500 font-medium">active branches</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link
              href="/cbos"
              className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
            >
              <span>Manage CBOs</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Total Participants */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Participants
            </span>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats.totalParticipants}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">
              {confirmationRate}% confirmed
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <Link
              href="/participants"
              className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
            >
              <span>View all participants</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Participant Status Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Confirmed */}
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Confirmed
            </span>
            <p className="text-2xl font-bold text-emerald-950 mt-1">
              {stats.confirmedParticipants}
            </p>
            <p className="text-[11px] text-emerald-700 mt-0.5 font-medium">
              Confirmation dates logged
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        {/* Pending */}
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Pending
            </span>
            <p className="text-2xl font-bold text-amber-950 mt-1">
              {stats.pendingParticipants}
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5 font-medium">
              Awaiting confirmation
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* Cancelled */}
        <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider">
              Cancelled
            </span>
            <p className="text-2xl font-bold text-rose-950 mt-1">
              {stats.cancelledParticipants}
            </p>
            <p className="text-[11px] text-rose-700 mt-0.5 font-medium">
              Inactive enrollments
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
            <XCircle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Grid: Quick Links & Recent Participants */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Participants (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Recent Participants
              </h2>
            </div>
            <Link
              href="/participants"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View directory &rarr;
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentParticipants.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No participants registered yet
              </div>
            ) : (
              recentParticipants.map((p) => (
                <div
                  key={p.id}
                  className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                      {p.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{p.name}</p>
                      <p className="text-xs text-slate-500">
                        {p.partner_agency?.name} &bull; {p.cbo?.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={p.status} />
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      {formatDate(p.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions & Navigation (1 col) */}
        <div className="space-y-4">
          {/* Connected Application: EPAHP CBO Database */}
          <div className="bg-gradient-to-br from-[#0d6b38] to-[#074724] text-white rounded-xl shadow-xs p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#f5c518] text-[#0a3d1f]">
                Connected System
              </span>
              <span className="text-[11px] text-[#f5e6a8] font-medium">DSWD Field Office III</span>
            </div>

            <div className="flex items-start gap-3 mt-2">
              <div className="h-10 w-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 text-[#f5c518]">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">
                  EPAHP CBO Database
                </h3>
                <p className="text-[11px] text-emerald-100/90 mt-1 leading-relaxed">
                  Community-Based Organization Information System &amp; digital records.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-700/50 flex items-center justify-between">
              <a
                href="https://database-collection-six.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#0d6b38] hover:bg-emerald-50 text-xs font-bold transition-all shadow-xs"
              >
                <span>Visit Portal</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <a
                href="https://database-collection-six.vercel.app/forms/cbo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#f5e6a8] hover:text-white underline underline-offset-2 transition-colors"
              >
                New CBO Form &rarr;
              </a>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ListTree className="h-4 w-4 text-indigo-600" />
              Quick Actions
            </h2>
            <div className="space-y-2">
              <Link
                href="/organized-list"
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left group"
              >
                <div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-900">
                    Organized Tree View
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    View Agency &rarr; CBO &rarr; Participant hierarchy
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/participants"
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left group"
              >
                <div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-900">
                    Participant Directory
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Enroll, search, and update statuses
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/attendance"
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left group"
              >
                <div>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 flex items-center gap-1.5">
                    <ClipboardCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Event Attendance Sheet
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Live check-in, AM/PM time logs, and 12-column export
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>

          {/* Supabase Schema & Security note */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <ShieldAlert className="h-4 w-4 text-indigo-600" />
              <span>Supabase Schema &amp; RLS</span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Database schema, relational constraints, auto-confirmation triggers, and RLS policies are available in <code className="bg-slate-200/60 px-1 py-0.5 rounded text-[11px] font-mono">supabase/schema.sql</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

