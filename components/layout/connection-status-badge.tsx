'use client';

import * as React from 'react';
import { checkSupabaseConnection, ConnectionStatus } from '@/app/actions/connection';
import { Badge } from '@/components/ui/badge';
import { Database, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export function ConnectionStatusBadge() {
  const [status, setStatus] = React.useState<ConnectionStatus | null>(null);
  const [isChecking, setIsChecking] = React.useState(false);

  const runCheck = React.useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await checkSupabaseConnection();
      setStatus(res);
    } catch {
      setStatus({
        isConfigured: false,
        isConnected: false,
        tablesExist: false,
        supabaseUrl: '',
        message: 'Could not run connection check.',
      });
    } finally {
      setIsChecking(false);
    }
  }, []);

  React.useEffect(() => {
    runCheck();
  }, [runCheck]);

  if (!status) {
    return (
      <Badge variant="outline" className="gap-1.5 py-1 px-2.5 text-xs text-slate-500">
        <RefreshCw className="h-3 w-3 animate-spin text-slate-400" />
        <span>Checking connection...</span>
      </Badge>
    );
  }

  if (status.isConfigured && status.tablesExist) {
    return (
      <button
        onClick={runCheck}
        title={`Connected to ${status.supabaseUrl}. Click to re-check.`}
        className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 hover:bg-emerald-100 transition-colors"
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        <span>Supabase Live</span>
        {isChecking && <RefreshCw className="h-2.5 w-2.5 animate-spin ml-1" />}
      </button>
    );
  }

  if (status.isConfigured && !status.tablesExist) {
    return (
      <button
        onClick={runCheck}
        title={status.message}
        className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20 hover:bg-amber-100 transition-colors"
      >
        <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
        <span>Tables Needed</span>
        {isChecking && <RefreshCw className="h-2.5 w-2.5 animate-spin ml-1" />}
      </button>
    );
  }

  return (
    <button
      onClick={runCheck}
      title={status.message}
      className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/20 hover:bg-slate-200 transition-colors"
    >
      <Database className="h-3.5 w-3.5 text-indigo-600" />
      <span>Mock Mode (URL Needed)</span>
      {isChecking && <RefreshCw className="h-2.5 w-2.5 animate-spin ml-1" />}
    </button>
  );
}

