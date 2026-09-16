import { PartnerAgency, CBO, Participant, ParticipantStatus, AttendanceRecord } from '@/types/database';

// Global singleton for mock persistence across server actions during development / offline mode
interface MockDatabaseState {
  agencies: PartnerAgency[];
  cbos: CBO[];
  participants: Participant[];
  attendance: AttendanceRecord[];
}

const initialAgencies: PartnerAgency[] = [
  {
    id: '11111111-1111-4111-a111-111111111111',
    name: 'Agency A',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: '22222222-2222-4222-a222-222222222222',
    name: 'Agency B',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: '33333333-3333-4333-a333-333333333333',
    name: 'Agency C',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

const initialCbos: CBO[] = [
  {
    id: 'c1111111-1111-4111-a111-111111111111',
    partner_agency_id: '11111111-1111-4111-a111-111111111111',
    name: 'CBO1',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'c2222222-2222-4222-a222-222222222222',
    partner_agency_id: '11111111-1111-4111-a111-111111111111',
    name: 'CBO2',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'c3333333-3333-4333-a333-333333333333',
    partner_agency_id: '22222222-2222-4222-a222-222222222222',
    name: 'CBO3',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'c4444444-4444-4444-a444-444444444444',
    partner_agency_id: '33333333-3333-4333-a333-333333333333',
    name: 'CBO4',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

const initialParticipants: Participant[] = [
  {
    id: 'p1111111-1111-4111-a111-111111111111',
    partner_agency_id: '11111111-1111-4111-a111-111111111111',
    cbo_id: 'c1111111-1111-4111-a111-111111111111',
    name: 'Juan Dela Cruz',
    status: 'Confirmed',
    date_confirmed: new Date(Date.now() - 2 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'p2222222-2222-4222-a222-222222222222',
    partner_agency_id: '11111111-1111-4111-a111-111111111111',
    cbo_id: 'c1111111-1111-4111-a111-111111111111',
    name: 'Maria Santos',
    status: 'Confirmed',
    date_confirmed: new Date(Date.now() - 1 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'p3333333-3333-4333-a333-333333333333',
    partner_agency_id: '11111111-1111-4111-a111-111111111111',
    cbo_id: 'c2222222-2222-4222-a222-222222222222',
    name: 'Pedro Reyes',
    status: 'Pending',
    date_confirmed: null,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'p4444444-4444-4444-a444-444444444444',
    partner_agency_id: '22222222-2222-4222-a222-222222222222',
    cbo_id: 'c3333333-3333-4333-a333-333333333333',
    name: 'Ana Cruz',
    status: 'Confirmed',
    date_confirmed: new Date(Date.now() - 3600000 * 3).toISOString(),
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'p5555555-5555-4555-a555-555555555555',
    partner_agency_id: '22222222-2222-4222-a222-222222222222',
    cbo_id: 'c3333333-3333-4333-a333-333333333333',
    name: 'Carlos Tan',
    status: 'Cancelled',
    date_confirmed: null,
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: 'p6666666-6666-4666-a666-666666666666',
    partner_agency_id: '33333333-3333-4333-a333-333333333333',
    cbo_id: 'c4444444-4444-4444-a444-444444444444',
    name: 'Elena Gomez',
    status: 'Pending',
    date_confirmed: null,
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
];

// In-memory store cached on globalThis in development
declare global {
  // eslint-disable-next-line no-var
  var __mockDb: MockDatabaseState | undefined;
}

if (!globalThis.__mockDb) {
  globalThis.__mockDb = {
    agencies: [...initialAgencies],
    cbos: [...initialCbos],
    participants: [...initialParticipants],
    attendance: [],
  };
}

export const mockDb = globalThis.__mockDb;
if (!mockDb.attendance) {
  mockDb.attendance = [];
}

// Helper CRUD actions for mock data
export const mockStore = {
  getAgencies: () => [...mockDb.agencies],
  addAgency: (name: string): PartnerAgency => {
    const newAgency: PartnerAgency = {
      id: crypto.randomUUID(),
      name: name.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockDb.agencies.push(newAgency);
    return newAgency;
  },
  updateAgency: (id: string, name: string): PartnerAgency | null => {
    const idx = mockDb.agencies.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    mockDb.agencies[idx].name = name.trim();
    mockDb.agencies[idx].updated_at = new Date().toISOString();
    return mockDb.agencies[idx];
  },
  deleteAgency: (id: string): boolean => {
    const idx = mockDb.agencies.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    mockDb.agencies.splice(idx, 1);
    // Cascade delete CBOs and Participants
    const cboIdsToDelete = mockDb.cbos.filter((c) => c.partner_agency_id === id).map((c) => c.id);
    mockDb.cbos = mockDb.cbos.filter((c) => c.partner_agency_id !== id);
    mockDb.participants = mockDb.participants.filter(
      (p) => p.partner_agency_id !== id && !cboIdsToDelete.includes(p.cbo_id)
    );
    return true;
  },

  getCbos: () => [...mockDb.cbos],
  addCbo: (partner_agency_id: string, name: string): CBO => {
    const newCbo: CBO = {
      id: crypto.randomUUID(),
      partner_agency_id,
      name: name.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockDb.cbos.push(newCbo);
    return newCbo;
  },
  updateCbo: (id: string, partner_agency_id: string, name: string): CBO | null => {
    const idx = mockDb.cbos.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    mockDb.cbos[idx].partner_agency_id = partner_agency_id;
    mockDb.cbos[idx].name = name.trim();
    mockDb.cbos[idx].updated_at = new Date().toISOString();
    return mockDb.cbos[idx];
  },
  deleteCbo: (id: string): boolean => {
    const idx = mockDb.cbos.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    mockDb.cbos.splice(idx, 1);
    // Cascade delete participants
    mockDb.participants = mockDb.participants.filter((p) => p.cbo_id !== id);
    return true;
  },

  getParticipants: () => [...mockDb.participants],
  addParticipant: (
    partner_agency_id: string,
    cbo_id: string,
    name: string,
    status: ParticipantStatus
  ): Participant => {
    const now = new Date().toISOString();
    const newParticipant: Participant = {
      id: crypto.randomUUID(),
      partner_agency_id,
      cbo_id,
      name: name.trim(),
      status,
      date_confirmed: status === 'Confirmed' ? now : null,
      created_at: now,
      updated_at: now,
    };
    mockDb.participants.push(newParticipant);
    return newParticipant;
  },
  addParticipantsBatch: (
    partner_agency_id: string,
    cbo_id: string,
    items: { name: string; status: ParticipantStatus }[]
  ): Participant[] => {
    const now = new Date().toISOString();
    const newParticipants: Participant[] = items.map((item) => ({
      id: crypto.randomUUID(),
      partner_agency_id,
      cbo_id,
      name: item.name.trim(),
      status: item.status,
      date_confirmed: item.status === 'Confirmed' ? now : null,
      created_at: now,
      updated_at: now,
    }));
    mockDb.participants.push(...newParticipants);
    return newParticipants;
  },
  updateParticipant: (
    id: string,
    partner_agency_id: string,
    cbo_id: string,
    name: string,
    status: ParticipantStatus
  ): Participant | null => {
    const idx = mockDb.participants.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const prev = mockDb.participants[idx];
    const now = new Date().toISOString();
    let dateConfirmed = prev.date_confirmed;

    if (status === 'Confirmed') {
      if (!dateConfirmed) dateConfirmed = now;
    } else {
      dateConfirmed = null;
    }

    mockDb.participants[idx] = {
      ...prev,
      partner_agency_id,
      cbo_id,
      name: name.trim(),
      status,
      date_confirmed: dateConfirmed,
      updated_at: now,
    };
    return mockDb.participants[idx];
  },
  updateParticipantStatus: (id: string, status: ParticipantStatus): Participant | null => {
    const idx = mockDb.participants.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const prev = mockDb.participants[idx];
    const now = new Date().toISOString();
    let dateConfirmed = prev.date_confirmed;

    if (status === 'Confirmed') {
      if (!dateConfirmed) dateConfirmed = now;
    } else {
      dateConfirmed = null;
    }

    mockDb.participants[idx] = {
      ...prev,
      status,
      date_confirmed: dateConfirmed,
      updated_at: now,
    };
    return mockDb.participants[idx];
  },
  deleteParticipant: (id: string): boolean => {
    const idx = mockDb.participants.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    mockDb.participants.splice(idx, 1);
    return true;
  },

  // Attendance Actions
  getAttendance: (date?: string): AttendanceRecord[] => {
    if (!date) {
      return [...mockDb.attendance].sort((a, b) => a.name.localeCompare(b.name));
    }
    return mockDb.attendance
      .filter((r) => r.event_date === date)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  addAttendance: (
    record: Omit<AttendanceRecord, 'id' | 'created_at' | 'updated_at'>
  ): AttendanceRecord => {
    const now = new Date().toISOString();
    const newRecord: AttendanceRecord = {
      ...record,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };
    mockDb.attendance.push(newRecord);
    return newRecord;
  },

  updateAttendance: (
    id: string,
    updates: Partial<Omit<AttendanceRecord, 'id' | 'created_at'>>
  ): AttendanceRecord | null => {
    const idx = mockDb.attendance.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    mockDb.attendance[idx] = {
      ...mockDb.attendance[idx],
      ...updates,
      updated_at: now,
    };
    return mockDb.attendance[idx];
  },

  quickLogTime: (
    id: string,
    field: 'am_in' | 'am_out' | 'pm_in' | 'pm_out',
    timeStr: string
  ): AttendanceRecord | null => {
    const idx = mockDb.attendance.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    mockDb.attendance[idx] = {
      ...mockDb.attendance[idx],
      [field]: timeStr,
      updated_at: now,
    };
    return mockDb.attendance[idx];
  },

  deleteAttendance: (id: string): boolean => {
    const idx = mockDb.attendance.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    mockDb.attendance.splice(idx, 1);
    return true;
  },

  markParticipantPresent: (
    participantId: string,
    eventDate: string,
    timeStr: string
  ): { success: boolean; record?: AttendanceRecord; message?: string } => {
    // Check if participant exists
    const participant = mockDb.participants.find((p) => p.id === participantId);
    if (!participant) {
      return { success: false, message: 'Participant not found.' };
    }

    // Check if already checked in on this date
    const existing = mockDb.attendance.find(
      (a) => a.participant_id === participantId && a.event_date === eventDate
    );
    if (existing) {
      return { success: true, record: existing, message: 'Participant is already marked present.' };
    }

    // Lookup agency & CBO name for office_agency
    const agency = mockDb.agencies.find((a) => a.id === participant.partner_agency_id);
    const cbo = mockDb.cbos.find((c) => c.id === participant.cbo_id);
    const officeAgency = [agency?.name, cbo?.name].filter(Boolean).join(' / ') || 'General';

    const now = new Date().toISOString();
    const newRecord: AttendanceRecord = {
      id: crypto.randomUUID(),
      event_date: eventDate,
      participant_id: participant.id,
      name: participant.name,
      office_agency: officeAgency,
      position: null,
      sex: null,
      email: null,
      contact_no: null,
      remarks: null,
      am_in: timeStr,
      am_out: null,
      pm_in: null,
      pm_out: null,
      created_at: now,
      updated_at: now,
    };

    mockDb.attendance.push(newRecord);
    return { success: true, record: newRecord };
  },
};

