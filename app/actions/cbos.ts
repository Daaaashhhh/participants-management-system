'use server';

import { revalidatePath } from 'next/cache';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { mockStore } from '@/lib/supabase/mock-store';
import { cboSchema } from '@/lib/validations/cbo';
import { CBOWithAgency } from '@/types/database';

export async function getCbos(partnerAgencyId?: string): Promise<CBOWithAgency[]> {
  if (!isSupabaseConfigured()) {
    let cbos = mockStore.getCbos();
    const agencies = mockStore.getAgencies();
    const participants = mockStore.getParticipants();

    if (partnerAgencyId) {
      cbos = cbos.filter((c) => c.partner_agency_id === partnerAgencyId);
    }

    return cbos
      .map((c) => {
        const agency = agencies.find((a) => a.id === c.partner_agency_id);
        const count = participants.filter((p) => p.cbo_id === c.id).length;
        return {
          ...c,
          partner_agency: agency ? { id: agency.id, name: agency.name } : null,
          _count: { participants: count },
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  const supabase = createClient();
  let query = supabase
    .from('cbos')
    .select(`
      *,
      partner_agency:partner_agencies(id, name),
      participants!participants_cbo_id_fkey(count)
    `)
    .order('name', { ascending: true });

  if (partnerAgencyId) {
    query = query.eq('partner_agency_id', partnerAgencyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching CBOs:', error.code, error.message, error.details);
    return [];
  }

  type CboQueryResult = CBOWithAgency & {
    participants?: { count: number }[];
  };

  // Normalize count structure
  return ((data || []) as unknown as CboQueryResult[]).map((item) => ({
    ...item,
    partner_agency: item.partner_agency,
    _count: {
      participants: item.participants?.[0]?.count ?? 0,
    },
  }));
}

export async function createCbo(formData: FormData) {
  const rawData = {
    partner_agency_id: formData.get('partner_agency_id'),
    name: formData.get('name'),
  };

  const validation = cboSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Invalid CBO data.',
    };
  }

  const { partner_agency_id, name } = validation.data;

  if (!isSupabaseConfigured()) {
    const agencies = mockStore.getAgencies();
    const agencyExists = agencies.some((a) => a.id === partner_agency_id);
    if (!agencyExists) {
      return { success: false, error: 'Selected Partner Agency does not exist.' };
    }

    const created = mockStore.addCbo(partner_agency_id, name);
    revalidatePath('/cbos');
    revalidatePath('/participants');
    revalidatePath('/organized-list');
    revalidatePath('/dashboard');
    return { success: true, data: created };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('cbos')
    .insert([{ partner_agency_id, name }])
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/cbos');
  revalidatePath('/participants');
  revalidatePath('/organized-list');
  revalidatePath('/dashboard');
  return { success: true, data };
}

export async function updateCbo(id: string, formData: FormData) {
  const rawData = {
    partner_agency_id: formData.get('partner_agency_id'),
    name: formData.get('name'),
  };

  const validation = cboSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Invalid CBO data.',
    };
  }

  const { partner_agency_id, name } = validation.data;

  if (!isSupabaseConfigured()) {
    const updated = mockStore.updateCbo(id, partner_agency_id, name);
    if (!updated) {
      return { success: false, error: 'CBO not found.' };
    }
    revalidatePath('/cbos');
    revalidatePath('/participants');
    revalidatePath('/organized-list');
    revalidatePath('/dashboard');
    return { success: true, data: updated };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('cbos')
    .update({ partner_agency_id, name })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/cbos');
  revalidatePath('/participants');
  revalidatePath('/organized-list');
  revalidatePath('/dashboard');
  return { success: true, data };
}

export async function deleteCbo(id: string) {
  if (!id) return { success: false, error: 'CBO ID is required.' };

  if (!isSupabaseConfigured()) {
    const deleted = mockStore.deleteCbo(id);
    if (!deleted) return { success: false, error: 'CBO not found.' };
    revalidatePath('/cbos');
    revalidatePath('/participants');
    revalidatePath('/organized-list');
    revalidatePath('/dashboard');
    return { success: true };
  }

  const supabase = createClient();
  const { error } = await supabase.from('cbos').delete().eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/cbos');
  revalidatePath('/participants');
  revalidatePath('/organized-list');
  revalidatePath('/dashboard');
  return { success: true };
}

