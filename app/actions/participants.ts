'use server';

import { revalidatePath } from 'next/cache';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { mockStore } from '@/lib/supabase/mock-store';
import { participantSchema, batchParticipantSchema } from '@/lib/validations/participant';
import { ParticipantStatus, ParticipantWithRelations } from '@/types/database';

export interface ParticipantFilters {
  agencyId?: string;
  cboId?: string;
  status?: ParticipantStatus | 'all';
  search?: string;
}

function isSchemaCacheOrColumnError(
  err: { code?: string; message?: string } | null | undefined
): boolean {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  return (
    err.code === 'PGRST204' ||
    err.code === '42703' ||
    msg.includes('schema cache') ||
    msg.includes('could not find the') ||
    msg.includes('column')
  );
}

export async function getParticipants(filters?: ParticipantFilters): Promise<ParticipantWithRelations[]> {
  if (!isSupabaseConfigured()) {
    let participants = mockStore.getParticipants();
    const agencies = mockStore.getAgencies();
    const cbos = mockStore.getCbos();

    if (filters?.agencyId && filters.agencyId !== 'all') {
      participants = participants.filter((p) => p.partner_agency_id === filters.agencyId);
    }

    if (filters?.cboId && filters.cboId !== 'all') {
      participants = participants.filter((p) => p.cbo_id === filters.cboId);
    }

    if (filters?.status && filters.status !== 'all') {
      participants = participants.filter((p) => p.status === filters.status);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      participants = participants.filter((p) => p.name.toLowerCase().includes(q));
    }

    return participants
      .map((p) => {
        const agency = agencies.find((a) => a.id === p.partner_agency_id);
        const cbo = cbos.find((c) => c.id === p.cbo_id);
        return {
          ...p,
          partner_agency: agency ? { id: agency.id, name: agency.name } : null,
          cbo: cbo ? { id: cbo.id, name: cbo.name } : null,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  const supabase = createClient();
  let query = supabase
    .from('participants')
    .select(`
      *,
      partner_agency:partner_agencies(id, name),
      cbo:cbos!participants_cbo_id_fkey(id, name)
    `)
    .order('name', { ascending: true });

  if (filters?.agencyId && filters.agencyId !== 'all') {
    query = query.eq('partner_agency_id', filters.agencyId);
  }

  if (filters?.cboId && filters.cboId !== 'all') {
    query = query.eq('cbo_id', filters.cboId);
  }

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters?.search) {
    query = query.ilike('name', `%${filters.search.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching participants:', error.message);
    return [];
  }

  return ((data || []) as unknown as ParticipantWithRelations[]).map((item) => ({
    ...item,
    partner_agency: item.partner_agency,
    cbo: item.cbo,
  }));
}

export async function createParticipant(formData: FormData) {
  const rawData = {
    partner_agency_id: formData.get('partner_agency_id'),
    cbo_id: formData.get('cbo_id'),
    name: formData.get('name'),
    status: formData.get('status') || 'Pending',
  };

  const validation = participantSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Invalid participant data.',
    };
  }

  const { partner_agency_id, cbo_id, name, status } = validation.data;

  // Validate relational constraint: CBO must belong to selected Partner Agency
  const position = formData.get('position')?.toString().trim() || null;
  const sex = (formData.get('sex')?.toString().trim() || null) as 'M' | 'F' | null;
  const email = formData.get('email')?.toString().trim() || null;
  const contact_no = formData.get('contact_no')?.toString().trim() || null;
  const remarks = formData.get('remarks')?.toString().trim() || null;

  if (!isSupabaseConfigured()) {
    const cbos = mockStore.getCbos();
    const cbo = cbos.find((c) => c.id === cbo_id);
    if (!cbo) {
      return { success: false, error: 'Selected CBO does not exist.' };
    }
    if (cbo.partner_agency_id !== partner_agency_id) {
      return {
        success: false,
        error: 'The selected CBO does not belong to the selected Partner Agency.',
      };
    }

    const created = mockStore.addParticipant(
      partner_agency_id,
      cbo_id,
      name,
      status as ParticipantStatus,
      { position, sex, email, contact_no, remarks }
    );
    revalidatePath('/participants');
    revalidatePath('/organized-list');
    revalidatePath('/dashboard');
    return { success: true, data: created };
  }

  const supabase = createClient();

  // Verify relationship in Supabase
  const { data: cbo, error: cboError } = await supabase
    .from('cbos')
    .select('id, partner_agency_id')
    .eq('id', cbo_id)
    .single();

  if (cboError || !cbo) {
    return { success: false, error: 'Selected CBO does not exist.' };
  }

  if (cbo.partner_agency_id !== partner_agency_id) {
    return {
      success: false,
      error: 'The selected CBO does not belong to the selected Partner Agency.',
    };
  }

  const now = new Date().toISOString();
  const date_confirmed = status === 'Confirmed' ? now : null;

  const recordPayload = {
    partner_agency_id,
    cbo_id,
    name,
    status: status as ParticipantStatus,
    date_confirmed,
    position,
    sex,
    email,
    contact_no,
    remarks,
  };

  let { data, error } = await supabase
    .from('participants')
    .insert([recordPayload])
    .select()
    .single();

  // If column doesn't exist yet in Supabase (migration not yet applied), fallback to base columns
  if (isSchemaCacheOrColumnError(error)) {
    const fallback = await supabase
      .from('participants')
      .insert([
        {
          partner_agency_id,
          cbo_id,
          name,
          status: status as ParticipantStatus,
          date_confirmed,
        },
      ])
      .select()
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/participants');
  revalidatePath('/organized-list');
  revalidatePath('/dashboard');
  return { success: true, data };
}

/**
 * Bulk / Batch enroll multiple participants under a specific CBO in a single transaction.
 * If a participant has attendance fields filled in, an attendance_records row is also created
 * for today's date.
 */
export async function createBatchParticipants(payload: {
  partner_agency_id: string;
  cbo_id: string;
  participants: {
    name: string;
    status?: ParticipantStatus;
    position?: string;
    sex?: 'M' | 'F' | null;
    email?: string;
    contact_no?: string;
    remarks?: string;
    am_in?: string;
    am_out?: string;
    pm_in?: string;
    pm_out?: string;
  }[];
}) {
  const validation = batchParticipantSchema.safeParse(payload);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Invalid participant batch data.',
    };
  }

  const { partner_agency_id, cbo_id, participants } = validation.data;

  // Filter out any entries that might be blank
  const validParticipants = participants.filter((p) => p.name.trim().length >= 2);
  if (validParticipants.length === 0) {
    return {
      success: false,
      error: 'Please provide at least one participant name with at least 2 characters.',
    };
  }

  // Validate relational constraint: CBO must belong to selected Partner Agency
  if (!isSupabaseConfigured()) {
    const cbos = mockStore.getCbos();
    const cbo = cbos.find((c) => c.id === cbo_id);
    if (!cbo) {
      return { success: false, error: 'Selected CBO does not exist.' };
    }
    if (cbo.partner_agency_id !== partner_agency_id) {
      return {
        success: false,
        error: 'The selected CBO does not belong to the selected Partner Agency.',
      };
    }

    const created = mockStore.addParticipantsBatch(
      partner_agency_id,
      cbo_id,
      validParticipants.map((p) => ({
        name: p.name.trim(),
        status: (p.status || 'Pending') as ParticipantStatus,
        position: p.position?.trim() || null,
        sex: (p.sex as 'M' | 'F' | null) || null,
        email: p.email?.trim() || null,
        contact_no: p.contact_no?.trim() || null,
        remarks: p.remarks?.trim() || null,
      }))
    );

    revalidatePath('/participants');
    revalidatePath('/organized-list');
    revalidatePath('/dashboard');
    revalidatePath('/cbos');
    return { success: true, count: created.length, data: created };
  }

  const supabase = createClient();

  // Verify relationship in Supabase
  const { data: cbo, error: cboError } = await supabase
    .from('cbos')
    .select('id, partner_agency_id')
    .eq('id', cbo_id)
    .single();

  if (cboError || !cbo) {
    return { success: false, error: 'Selected CBO does not exist.' };
  }

  if (cbo.partner_agency_id !== partner_agency_id) {
    return {
      success: false,
      error: 'The selected CBO does not belong to the selected Partner Agency.',
    };
  }

  const now = new Date().toISOString();
  const recordsToInsert = validParticipants.map((p) => ({
    partner_agency_id,
    cbo_id,
    name: p.name.trim(),
    status: (p.status || 'Pending') as ParticipantStatus,
    date_confirmed: p.status === 'Confirmed' ? now : null,
    position: p.position?.trim() || null,
    sex: (p.sex as 'M' | 'F' | null) || null,
    email: p.email?.trim() || null,
    contact_no: p.contact_no?.trim() || null,
    remarks: p.remarks?.trim() || null,
  }));

  let { data, error } = await supabase
    .from('participants')
    .insert(recordsToInsert)
    .select();

  // If columns don't exist yet in Supabase (migration not yet applied), fallback to base columns
  if (isSchemaCacheOrColumnError(error)) {
    const baseRecords = recordsToInsert.map(
      ({ partner_agency_id, cbo_id, name, status, date_confirmed }) => ({
        partner_agency_id,
        cbo_id,
        name,
        status,
        date_confirmed,
      })
    );
    const fallback = await supabase
      .from('participants')
      .insert(baseRecords)
      .select();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/participants');
  revalidatePath('/organized-list');
  revalidatePath('/dashboard');
  revalidatePath('/cbos');
  return { success: true, count: (data || []).length, data };
}

export async function updateParticipant(id: string, formData: FormData) {
  const rawData = {
    partner_agency_id: formData.get('partner_agency_id'),
    cbo_id: formData.get('cbo_id'),
    name: formData.get('name'),
    status: formData.get('status') || 'Pending',
  };

  const validation = participantSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Invalid participant data.',
    };
  }

  const { partner_agency_id, cbo_id, name, status } = validation.data;
  const position = formData.get('position')?.toString().trim() || null;
  const sex = (formData.get('sex')?.toString().trim() || null) as 'M' | 'F' | null;
  const email = formData.get('email')?.toString().trim() || null;
  const contact_no = formData.get('contact_no')?.toString().trim() || null;
  const remarks = formData.get('remarks')?.toString().trim() || null;

  if (!isSupabaseConfigured()) {
    const cbos = mockStore.getCbos();
    const cbo = cbos.find((c) => c.id === cbo_id);
    if (!cbo) {
      return { success: false, error: 'Selected CBO does not exist.' };
    }
    if (cbo.partner_agency_id !== partner_agency_id) {
      return {
        success: false,
        error: 'The selected CBO does not belong to the selected Partner Agency.',
      };
    }

    const updated = mockStore.updateParticipant(
      id,
      partner_agency_id,
      cbo_id,
      name,
      status as ParticipantStatus,
      { position, sex, email, contact_no, remarks }
    );
    if (!updated) {
      return { success: false, error: 'Participant not found.' };
    }
    revalidatePath('/participants');
    revalidatePath('/organized-list');
    revalidatePath('/dashboard');
    return { success: true, data: updated };
  }

  const supabase = createClient();

  // Relational check
  const { data: cbo, error: cboError } = await supabase
    .from('cbos')
    .select('id, partner_agency_id')
    .eq('id', cbo_id)
    .single();

  if (cboError || !cbo || cbo.partner_agency_id !== partner_agency_id) {
    return {
      success: false,
      error: 'The selected CBO does not belong to the selected Partner Agency.',
    };
  }

  // Fetch current participant to determine confirmation timestamp
  const { data: current } = await supabase
    .from('participants')
    .select('status, date_confirmed')
    .eq('id', id)
    .single();

  let date_confirmed: string | null = current?.date_confirmed ?? null;
  if (status === 'Confirmed') {
    if (!date_confirmed) {
      date_confirmed = new Date().toISOString();
    }
  } else {
    date_confirmed = null;
  }

  let { data, error } = await supabase
    .from('participants')
    .update({
      partner_agency_id,
      cbo_id,
      name,
      status: status as ParticipantStatus,
      date_confirmed,
      position,
      sex,
      email,
      contact_no,
      remarks,
    })
    .eq('id', id)
    .select()
    .single();

  // Fallback if migration not yet applied in Supabase
  if (isSchemaCacheOrColumnError(error)) {
    const fallback = await supabase
      .from('participants')
      .update({
        partner_agency_id,
        cbo_id,
        name,
        status: status as ParticipantStatus,
        date_confirmed,
      })
      .eq('id', id)
      .select()
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/participants');
  revalidatePath('/organized-list');
  revalidatePath('/dashboard');
  return { success: true, data };
}

export async function updateParticipantStatus(id: string, status: ParticipantStatus) {
  if (!id) return { success: false, error: 'Participant ID is required.' };

  if (!isSupabaseConfigured()) {
    const updated = mockStore.updateParticipantStatus(id, status);
    if (!updated) return { success: false, error: 'Participant not found.' };
    revalidatePath('/participants');
    revalidatePath('/organized-list');
    revalidatePath('/dashboard');
    return { success: true, data: updated };
  }

  const supabase = createClient();

  const { data: current } = await supabase
    .from('participants')
    .select('status, date_confirmed')
    .eq('id', id)
    .single();

  let date_confirmed: string | null = current?.date_confirmed ?? null;
  if (status === 'Confirmed') {
    if (!date_confirmed) {
      date_confirmed = new Date().toISOString();
    }
  } else {
    date_confirmed = null;
  }

  const { data, error } = await supabase
    .from('participants')
    .update({
      status,
      date_confirmed,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/participants');
  revalidatePath('/organized-list');
  revalidatePath('/dashboard');
  return { success: true, data };
}

export async function deleteParticipant(id: string) {
  if (!id) return { success: false, error: 'Participant ID is required.' };

  if (!isSupabaseConfigured()) {
    const deleted = mockStore.deleteParticipant(id);
    if (!deleted) return { success: false, error: 'Participant not found.' };
    revalidatePath('/participants');
    revalidatePath('/organized-list');
    revalidatePath('/dashboard');
    return { success: true };
  }

  const supabase = createClient();
  const { error } = await supabase.from('participants').delete().eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/participants');
  revalidatePath('/organized-list');
  revalidatePath('/dashboard');
  return { success: true };
}

