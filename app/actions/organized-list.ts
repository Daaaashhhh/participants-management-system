'use server';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { mockStore } from '@/lib/supabase/mock-store';
import { OrganizedAgency, ParticipantStatus } from '@/types/database';

export async function getOrganizedHierarchy(): Promise<OrganizedAgency[]> {
  let agencies: { id: string; name: string }[] = [];
  let cbos: { id: string; partner_agency_id: string; name: string }[] = [];
  let participants: {
    id: string;
    partner_agency_id: string;
    cbo_id: string;
    name: string;
    status: ParticipantStatus;
    date_confirmed: string | null;
  }[] = [];

  if (!isSupabaseConfigured()) {
    agencies = mockStore.getAgencies();
    cbos = mockStore.getCbos();
    participants = mockStore.getParticipants();
  } else {
    const supabase = createClient();
    const [agenciesRes, cbosRes, participantsRes] = await Promise.all([
      supabase.from('partner_agencies').select('id, name').order('name', { ascending: true }),
      supabase.from('cbos').select('id, partner_agency_id, name').order('name', { ascending: true }),
      supabase.from('participants').select('id, partner_agency_id, cbo_id, name, status, date_confirmed').order('name', { ascending: true }),
    ]);

    agencies = agenciesRes.data || [];
    cbos = cbosRes.data || [];
    participants = participantsRes.data || [];
  }

  // 1. Sort agencies alphabetically
  const sortedAgencies = [...agencies].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );

  // 2. Build hierarchical structure
  const organizedData: OrganizedAgency[] = sortedAgencies.map((agency) => {
    // Filter & sort CBOs under this agency alphabetically
    const agencyCbos = cbos
      .filter((cbo) => cbo.partner_agency_id === agency.id)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
      .map((cbo) => {
        // Filter & sort participants under this CBO alphabetically by name
        const cboParticipants = participants
          .filter(
            (p) =>
              p.cbo_id === cbo.id && p.partner_agency_id === agency.id
          )
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
          .map((p) => ({
            id: p.id,
            name: p.name,
            status: p.status,
            date_confirmed: p.date_confirmed,
          }));

        return {
          id: cbo.id,
          name: cbo.name,
          participants: cboParticipants,
        };
      });

    return {
      id: agency.id,
      name: agency.name,
      cbos: agencyCbos,
    };
  });

  return organizedData;
}

