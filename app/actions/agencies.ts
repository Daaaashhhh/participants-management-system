'use server';

import { revalidatePath } from 'next/cache';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { mockStore } from '@/lib/supabase/mock-store';
import { agencySchema } from '@/lib/validations/agency';
import { PartnerAgency } from '@/types/database';

export async function getAgencies(): Promise<PartnerAgency[]> {
  if (!isSupabaseConfigured()) {
    const list = mockStore.getAgencies();
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('partner_agencies')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching agencies:', error.message);
    return [];
  }

  return data || [];
}

export async function createAgency(formData: FormData) {
  const rawData = {
    name: formData.get('name'),
  };

  const validation = agencySchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Invalid agency data.',
    };
  }

  const { name } = validation.data;

  if (!isSupabaseConfigured()) {
    const existing = mockStore.getAgencies().find(
      (a) => a.name.toLowerCase() === name.toLowerCase()
    );
    if (existing) {
      return { success: false, error: 'An agency with this name already exists.' };
    }
    const created = mockStore.addAgency(name);
    revalidatePath('/agencies');
    revalidatePath('/cbos');
    revalidatePath('/participants');
    revalidatePath('/organized-list');
    revalidatePath('/dashboard');
    return { success: true, data: created };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('partner_agencies')
    .insert([{ name }])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'An agency with this name already exists.' };
    }
    return { success: false, error: error.message };
  }

  revalidatePath('/agencies');
  revalidatePath('/cbos');
  revalidatePath('/participants');
  revalidatePath('/organized-list');
  revalidatePath('/dashboard');
  return { success: true, data };
}

export async function updateAgency(id: string, formData: FormData) {
  const rawData = {
    name: formData.get('name'),
  };

  const validation = agencySchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Invalid agency data.',
    };
  }

  const { name } = validation.data;

  if (!isSupabaseConfigured()) {
    const existing = mockStore
      .getAgencies()
      .find((a) => a.id !== id && a.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      return { success: false, error: 'An agency with this name already exists.' };
    }
    const updated = mockStore.updateAgency(id, name);
    if (!updated) {
      return { success: false, error: 'Agency not found.' };
    }
    revalidatePath('/agencies');
    revalidatePath('/cbos');
    revalidatePath('/participants');
    revalidatePath('/organized-list');
    revalidatePath('/dashboard');
    return { success: true, data: updated };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('partner_agencies')
    .update({ name })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'An agency with this name already exists.' };
    }
    return { success: false, error: error.message };
  }

  revalidatePath('/agencies');
  revalidatePath('/cbos');
  revalidatePath('/participants');
  revalidatePath('/organized-list');
  revalidatePath('/dashboard');
  return { success: true, data };
}

export async function deleteAgency(id: string) {
  if (!id) return { success: false, error: 'Agency ID is required.' };

  if (!isSupabaseConfigured()) {
    const deleted = mockStore.deleteAgency(id);
    if (!deleted) return { success: false, error: 'Agency not found.' };
    revalidatePath('/agencies');
    revalidatePath('/cbos');
    revalidatePath('/participants');
    revalidatePath('/organized-list');
    revalidatePath('/dashboard');
    return { success: true };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('partner_agencies')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/agencies');
  revalidatePath('/cbos');
  revalidatePath('/participants');
  revalidatePath('/organized-list');
  revalidatePath('/dashboard');
  return { success: true };
}

