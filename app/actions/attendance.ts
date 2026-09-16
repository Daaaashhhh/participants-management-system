'use server';

import { revalidatePath } from 'next/cache';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { mockStore } from '@/lib/supabase/mock-store';
import { attendanceSchema } from '@/lib/validations/attendance';
import { AttendanceRecord } from '@/types/database';

function getTodayDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentTimeStr(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Fetch attendance records for a specific date (defaults to today)
 */
export async function getAttendanceRecords(date?: string): Promise<AttendanceRecord[]> {
  const targetDate = date || getTodayDateStr();

  if (!isSupabaseConfigured()) {
    return mockStore.getAttendance(targetDate);
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('event_date', targetDate)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching attendance records:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Get the set of participant IDs already marked present for a given date
 */
export async function getTodayPresentParticipantIds(date?: string): Promise<string[]> {
  const targetDate = date || getTodayDateStr();

  if (!isSupabaseConfigured()) {
    const records = mockStore.getAttendance(targetDate);
    return records
      .map((r) => r.participant_id)
      .filter((id): id is string => Boolean(id));
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('attendance_records')
    .select('participant_id')
    .eq('event_date', targetDate)
    .not('participant_id', 'is', null);

  if (error) {
    console.error('Error fetching today present participant IDs:', error.message);
    return [];
  }

  return (data || [])
    .map((r) => r.participant_id)
    .filter((id): id is string => Boolean(id));
}

/**
 * One-click "Mark Present" from the Participant Directory or Attendance Sheet
 */
export async function markParticipantPresent(
  participantId: string,
  eventDate?: string
): Promise<{ success: boolean; error?: string; record?: AttendanceRecord }> {
  const targetDate = eventDate || getTodayDateStr();
  const currentTime = getCurrentTimeStr();

  if (!isSupabaseConfigured()) {
    const res = mockStore.markParticipantPresent(participantId, targetDate, currentTime);
    if (!res.success) {
      return { success: false, error: res.message || 'Failed to mark participant present.' };
    }
    revalidatePath('/participants');
    revalidatePath('/attendance');
    revalidatePath('/dashboard');
    return { success: true, record: res.record };
  }

  const supabase = createClient();

  // 1. Fetch participant info with agency & cbo
  const { data: participant, error: partError } = await supabase
    .from('participants')
    .select(`
      id,
      name,
      partner_agency:partner_agencies(name),
      cbo:cbos!participants_cbo_id_fkey(name)
    `)
    .eq('id', participantId)
    .single();

  if (partError || !participant) {
    return { success: false, error: 'Participant not found.' };
  }

  const p = participant as unknown as {
    id: string;
    name: string;
    partner_agency?: { name: string } | null;
    cbo?: { name: string } | null;
  };

  const officeAgency =
    [p.partner_agency?.name, p.cbo?.name].filter(Boolean).join(' / ') ||
    'General Public';

  // 2. Check if already present on this date
  const { data: existing } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('event_date', targetDate)
    .eq('participant_id', participantId)
    .maybeSingle();

  if (existing) {
    return { success: true, record: existing as AttendanceRecord };
  }

  // 3. Insert attendance record with AM IN stamped
  const { data: inserted, error: insertError } = await supabase
    .from('attendance_records')
    .insert([
      {
        event_date: targetDate,
        participant_id: p.id,
        name: p.name,
        office_agency: officeAgency,
        am_in: currentTime,
      },
    ])
    .select()
    .single();

  if (insertError) {
    console.error('Error marking participant present:', insertError.message);
    return { success: false, error: insertError.message };
  }

  revalidatePath('/participants');
  revalidatePath('/attendance');
  revalidatePath('/dashboard');
  return { success: true, record: inserted as AttendanceRecord };
}

/**
 * Create a new attendee (e.g. walk-in or manual entry)
 */
export async function createAttendanceRecord(formData: FormData) {
  const rawData = {
    name: formData.get('name'),
    office_agency: formData.get('office_agency'),
    position: formData.get('position'),
    sex: formData.get('sex') || null,
    email: formData.get('email'),
    contact_no: formData.get('contact_no'),
    remarks: formData.get('remarks'),
    am_in: formData.get('am_in'),
    am_out: formData.get('am_out'),
    pm_in: formData.get('pm_in'),
    pm_out: formData.get('pm_out'),
    event_date: formData.get('event_date') || getTodayDateStr(),
  };

  const validation = attendanceSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Invalid attendance data.',
    };
  }

  const recordData = validation.data;
  const eventDate = (rawData.event_date as string) || getTodayDateStr();

  if (!isSupabaseConfigured()) {
    const created = mockStore.addAttendance({
      event_date: eventDate,
      participant_id: null,
      name: recordData.name,
      office_agency: recordData.office_agency,
      position: recordData.position ?? null,
      sex: (recordData.sex as 'M' | 'F') ?? null,
      email: recordData.email ?? null,
      contact_no: recordData.contact_no ?? null,
      remarks: recordData.remarks ?? null,
      am_in: recordData.am_in ?? null,
      am_out: recordData.am_out ?? null,
      pm_in: recordData.pm_in ?? null,
      pm_out: recordData.pm_out ?? null,
    });
    revalidatePath('/attendance');
    revalidatePath('/dashboard');
    return { success: true, data: created };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('attendance_records')
    .insert([
      {
        event_date: eventDate,
        name: recordData.name,
        office_agency: recordData.office_agency,
        position: recordData.position,
        sex: recordData.sex as 'M' | 'F' | null,
        email: recordData.email,
        contact_no: recordData.contact_no,
        remarks: recordData.remarks,
        am_in: recordData.am_in,
        am_out: recordData.am_out,
        pm_in: recordData.pm_in,
        pm_out: recordData.pm_out,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating attendance record:', error.message);
    return { success: false, error: error.message };
  }

  revalidatePath('/attendance');
  revalidatePath('/dashboard');
  return { success: true, data };
}

/**
 * Update existing attendance record
 */
export async function updateAttendanceRecord(id: string, formData: FormData) {
  const rawData = {
    name: formData.get('name'),
    office_agency: formData.get('office_agency'),
    position: formData.get('position'),
    sex: formData.get('sex') || null,
    email: formData.get('email'),
    contact_no: formData.get('contact_no'),
    remarks: formData.get('remarks'),
    am_in: formData.get('am_in'),
    am_out: formData.get('am_out'),
    pm_in: formData.get('pm_in'),
    pm_out: formData.get('pm_out'),
  };

  const validation = attendanceSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.issues[0]?.message || 'Invalid attendance data.',
    };
  }

  const recordData = validation.data;

  if (!isSupabaseConfigured()) {
    const updated = mockStore.updateAttendance(id, {
      name: recordData.name,
      office_agency: recordData.office_agency,
      position: recordData.position ?? null,
      sex: (recordData.sex as 'M' | 'F') ?? null,
      email: recordData.email ?? null,
      contact_no: recordData.contact_no ?? null,
      remarks: recordData.remarks ?? null,
      am_in: recordData.am_in ?? null,
      am_out: recordData.am_out ?? null,
      pm_in: recordData.pm_in ?? null,
      pm_out: recordData.pm_out ?? null,
    });

    if (!updated) return { success: false, error: 'Record not found.' };
    revalidatePath('/attendance');
    return { success: true, data: updated };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('attendance_records')
    .update({
      name: recordData.name,
      office_agency: recordData.office_agency,
      position: recordData.position,
      sex: recordData.sex as 'M' | 'F' | null,
      email: recordData.email,
      contact_no: recordData.contact_no,
      remarks: recordData.remarks,
      am_in: recordData.am_in,
      am_out: recordData.am_out,
      pm_in: recordData.pm_in,
      pm_out: recordData.pm_out,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/attendance');
  return { success: true, data };
}

/**
 * Quick inline field update for an attendance record (position, sex, email, contact_no, remarks, etc.)
 */
export async function updateAttendanceField(
  id: string,
  field:
    | 'position'
    | 'sex'
    | 'email'
    | 'contact_no'
    | 'remarks'
    | 'name'
    | 'office_agency'
    | 'am_in'
    | 'am_out'
    | 'pm_in'
    | 'pm_out',
  value: string | null
): Promise<{ success: boolean; error?: string; data?: AttendanceRecord }> {
  if (!id) return { success: false, error: 'ID is required.' };

  const sanitizedValue = value !== null ? value.trim() : null;

  if (field === 'sex' && sanitizedValue && sanitizedValue !== 'M' && sanitizedValue !== 'F') {
    return { success: false, error: 'Sex must be either M or F.' };
  }

  if (!isSupabaseConfigured()) {
    const updated = mockStore.updateAttendance(id, {
      [field]: sanitizedValue === '' ? null : sanitizedValue,
    });
    if (!updated) return { success: false, error: 'Record not found.' };
    revalidatePath('/attendance');
    return { success: true, data: updated };
  }

  const supabase = createClient();
  const updatePayload = {
    ...(field === 'position' && { position: sanitizedValue === '' ? null : sanitizedValue }),
    ...(field === 'sex' && {
      sex: (sanitizedValue === 'M' || sanitizedValue === 'F' ? sanitizedValue : null) as
        | 'M'
        | 'F'
        | null,
    }),
    ...(field === 'email' && { email: sanitizedValue === '' ? null : sanitizedValue }),
    ...(field === 'contact_no' && { contact_no: sanitizedValue === '' ? null : sanitizedValue }),
    ...(field === 'remarks' && { remarks: sanitizedValue === '' ? null : sanitizedValue }),
    ...(field === 'name' && { name: sanitizedValue || '' }),
    ...(field === 'office_agency' && { office_agency: sanitizedValue || '' }),
    ...(field === 'am_in' && { am_in: sanitizedValue === '' ? null : sanitizedValue }),
    ...(field === 'am_out' && { am_out: sanitizedValue === '' ? null : sanitizedValue }),
    ...(field === 'pm_in' && { pm_in: sanitizedValue === '' ? null : sanitizedValue }),
    ...(field === 'pm_out' && { pm_out: sanitizedValue === '' ? null : sanitizedValue }),
  };

  const { data, error } = await supabase
    .from('attendance_records')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/attendance');
  return { success: true, data: data as AttendanceRecord };
}

/**
 * Quick single-click time stamp for AM IN, AM OUT, PM IN, PM OUT
 */
export async function quickLogAttendanceTime(
  id: string,
  field: 'am_in' | 'am_out' | 'pm_in' | 'pm_out',
  customTime?: string
) {
  const timeToLog = customTime || getCurrentTimeStr();

  if (!isSupabaseConfigured()) {
    const updated = mockStore.quickLogTime(id, field, timeToLog);
    if (!updated) return { success: false, error: 'Record not found.' };
    revalidatePath('/attendance');
    return { success: true, data: updated };
  }

  const supabase = createClient();
  const updatePayload = {
    ...(field === 'am_in' && { am_in: timeToLog }),
    ...(field === 'am_out' && { am_out: timeToLog }),
    ...(field === 'pm_in' && { pm_in: timeToLog }),
    ...(field === 'pm_out' && { pm_out: timeToLog }),
  };

  const { data, error } = await supabase
    .from('attendance_records')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/attendance');
  return { success: true, data };
}

/**
 * Clear a time stamp
 */
export async function clearAttendanceTime(
  id: string,
  field: 'am_in' | 'am_out' | 'pm_in' | 'pm_out'
) {
  if (!isSupabaseConfigured()) {
    const updated = mockStore.quickLogTime(id, field, '');
    if (!updated) return { success: false, error: 'Record not found.' };
    revalidatePath('/attendance');
    return { success: true, data: updated };
  }

  const supabase = createClient();
  const updatePayload = {
    ...(field === 'am_in' && { am_in: null }),
    ...(field === 'am_out' && { am_out: null }),
    ...(field === 'pm_in' && { pm_in: null }),
    ...(field === 'pm_out' && { pm_out: null }),
  };

  const { data, error } = await supabase
    .from('attendance_records')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/attendance');
  return { success: true, data };
}

/**
 * Delete an attendance record
 */
export async function deleteAttendanceRecord(id: string) {
  if (!id) return { success: false, error: 'ID is required.' };

  if (!isSupabaseConfigured()) {
    const deleted = mockStore.deleteAttendance(id);
    if (!deleted) return { success: false, error: 'Record not found.' };
    revalidatePath('/attendance');
    revalidatePath('/participants');
    revalidatePath('/dashboard');
    return { success: true };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from('attendance_records')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/attendance');
  revalidatePath('/participants');
  revalidatePath('/dashboard');
  return { success: true };
}

