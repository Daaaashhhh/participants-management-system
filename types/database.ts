export type ParticipantStatus = 'Pending' | 'Confirmed' | 'Cancelled';

export type PartnerAgency = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type CBO = {
  id: string;
  partner_agency_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type Participant = {
  id: string;
  partner_agency_id: string;
  cbo_id: string;
  name: string;
  status: ParticipantStatus;
  date_confirmed: string | null;
  position?: string | null;
  sex?: 'M' | 'F' | null;
  email?: string | null;
  contact_no?: string | null;
  remarks?: string | null;
  created_at: string;
  updated_at: string;
};

export type AttendanceRecord = {
  id: string;
  event_date: string;
  participant_id: string | null;
  name: string;
  office_agency: string;
  position: string | null;
  sex: 'M' | 'F' | null;
  email: string | null;
  contact_no: string | null;
  remarks: string | null;
  am_in: string | null;
  am_out: string | null;
  pm_in: string | null;
  pm_out: string | null;
  created_at: string;
  updated_at: string;
};

// Joined views & relationships
export type CBOWithAgency = CBO & {
  partner_agency?: {
    id: string;
    name: string;
  } | null;
  _count?: {
    participants: number;
  };
};

export type ParticipantWithRelations = Participant & {
  partner_agency?: {
    id: string;
    name: string;
  } | null;
  cbo?: {
    id: string;
    name: string;
  } | null;
};

// Hierarchical types for Organized List
export type OrganizedParticipant = {
  id: string;
  name: string;
  status: ParticipantStatus;
  date_confirmed: string | null;
};

export type OrganizedCBO = {
  id: string;
  name: string;
  participants: OrganizedParticipant[];
};

export type OrganizedAgency = {
  id: string;
  name: string;
  cbos: OrganizedCBO[];
};

// Dashboard statistics
export type DashboardStats = {
  totalAgencies: number;
  totalCbos: number;
  totalParticipants: number;
  confirmedParticipants: number;
  pendingParticipants: number;
  cancelledParticipants: number;
};

// Supabase Database Type Definitions
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      partner_agencies: {
        Row: PartnerAgency;
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cbos: {
        Row: CBO;
        Insert: {
          id?: string;
          partner_agency_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          partner_agency_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cbos_partner_agency_id_fkey";
            columns: ["partner_agency_id"];
            isOneToOne: false;
            referencedRelation: "partner_agencies";
            referencedColumns: ["id"];
          }
        ];
      };
      participants: {
        Row: Participant;
        Insert: {
          id?: string;
          partner_agency_id: string;
          cbo_id: string;
          name: string;
          status?: ParticipantStatus;
          date_confirmed?: string | null;
          position?: string | null;
          sex?: 'M' | 'F' | null;
          email?: string | null;
          contact_no?: string | null;
          remarks?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          partner_agency_id?: string;
          cbo_id?: string;
          name?: string;
          status?: ParticipantStatus;
          date_confirmed?: string | null;
          position?: string | null;
          sex?: 'M' | 'F' | null;
          email?: string | null;
          contact_no?: string | null;
          remarks?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_participant_cbo_agency";
            columns: ["cbo_id", "partner_agency_id"];
            isOneToOne: false;
            referencedRelation: "cbos";
            referencedColumns: ["id", "partner_agency_id"];
          }
        ];
      };
      attendance_records: {
        Row: AttendanceRecord;
        Insert: {
          id?: string;
          event_date?: string;
          participant_id?: string | null;
          name: string;
          office_agency: string;
          position?: string | null;
          sex?: 'M' | 'F' | null;
          email?: string | null;
          contact_no?: string | null;
          remarks?: string | null;
          am_in?: string | null;
          am_out?: string | null;
          pm_in?: string | null;
          pm_out?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_date?: string;
          participant_id?: string | null;
          name?: string;
          office_agency?: string;
          position?: string | null;
          sex?: 'M' | 'F' | null;
          email?: string | null;
          contact_no?: string | null;
          remarks?: string | null;
          am_in?: string | null;
          am_out?: string | null;
          pm_in?: string | null;
          pm_out?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_records_participant_id_fkey";
            columns: ["participant_id"];
            isOneToOne: false;
            referencedRelation: "participants";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      participant_status: ParticipantStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

