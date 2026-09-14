'use server';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { mockStore } from '@/lib/supabase/mock-store';
import { DashboardStats, ParticipantWithRelations } from '@/types/database';

export async function getDashboardData(): Promise<{
  stats: DashboardStats;
  recentParticipants: ParticipantWithRelations[];
}> {
  if (!isSupabaseConfigured()) {
    const agencies = mockStore.getAgencies();
    const cbos = mockStore.getCbos();
    const participants = mockStore.getParticipants();

    const stats: DashboardStats = {
      totalAgencies: agencies.length,
      totalCbos: cbos.length,
      totalParticipants: participants.length,
      confirmedParticipants: participants.filter((p) => p.status === 'Confirmed').length,
      pendingParticipants: participants.filter((p) => p.status === 'Pending').length,
      cancelledParticipants: participants.filter((p) => p.status === 'Cancelled').length,
    };

    const recent = [...participants]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((p) => ({
        ...p,
        partner_agency: agencies.find((a) => a.id === p.partner_agency_id) || null,
        cbo: cbos.find((c) => c.id === p.cbo_id) || null,
      }));

    return { stats, recentParticipants: recent };
  }

  const supabase = createClient();

  const [
    { count: agenciesCount },
    { count: cbosCount },
    { data: participants },
  ] = await Promise.all([
    supabase.from('partner_agencies').select('*', { count: 'exact', head: true }),
    supabase.from('cbos').select('*', { count: 'exact', head: true }),
    supabase
      .from('participants')
      .select(`
        *,
        partner_agency:partner_agencies(id, name),
        cbo:cbos!participants_cbo_id_fkey(id, name)
      `)
      .order('created_at', { ascending: false }),
  ]);

  const allParticipants = (participants || []) as unknown as ParticipantWithRelations[];

  const stats: DashboardStats = {
    totalAgencies: agenciesCount || 0,
    totalCbos: cbosCount || 0,
    totalParticipants: allParticipants.length,
    confirmedParticipants: allParticipants.filter((p) => p.status === 'Confirmed').length,
    pendingParticipants: allParticipants.filter((p) => p.status === 'Pending').length,
    cancelledParticipants: allParticipants.filter((p) => p.status === 'Cancelled').length,
  };

  const recent = allParticipants.slice(0, 5).map((p) => ({
    ...p,
    partner_agency: p.partner_agency,
    cbo: p.cbo,
  }));

  return { stats, recentParticipants: recent };
}

