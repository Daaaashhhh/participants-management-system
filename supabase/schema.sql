-- ==============================================================================
-- PARTICIPANT MANAGEMENT SYSTEM - SUPABASE DATABASE SCHEMA
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Table: partner_agencies
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS partner_agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on agency name
CREATE INDEX IF NOT EXISTS idx_partner_agencies_name ON partner_agencies (name);

-- ------------------------------------------------------------------------------
-- 2. Table: cbos (Community-Based Organizations)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cbos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_agency_id UUID NOT NULL REFERENCES partner_agencies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Ensures composite foreign key can reference both id and partner_agency_id
    CONSTRAINT uq_cbo_id_agency UNIQUE (id, partner_agency_id)
);

-- Indexes for cbos
CREATE INDEX IF NOT EXISTS idx_cbos_agency_id ON cbos (partner_agency_id);
CREATE INDEX IF NOT EXISTS idx_cbos_name ON cbos (name);

-- ------------------------------------------------------------------------------
-- 3. Table: participants
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_agency_id UUID NOT NULL REFERENCES partner_agencies(id) ON DELETE CASCADE,
    cbo_id UUID NOT NULL REFERENCES cbos(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Confirmed', 'Cancelled')) DEFAULT 'Pending',
    date_confirmed TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- RELATIONAL INTEGRITY ENFORCEMENT:
    -- Guarantees that the participant's cbo_id strictly belongs to the chosen partner_agency_id
    CONSTRAINT fk_participant_cbo_agency 
        FOREIGN KEY (cbo_id, partner_agency_id) 
        REFERENCES cbos(id, partner_agency_id) 
        ON DELETE CASCADE,

    -- CONSTRAINT CHECK: date_confirmed must only exist if status is Confirmed
    CONSTRAINT chk_participant_date_confirmed 
        CHECK (
            (status = 'Confirmed' AND date_confirmed IS NOT NULL) OR
            (status != 'Confirmed' AND date_confirmed IS NULL)
        )
);

-- Indexes for participants
CREATE INDEX IF NOT EXISTS idx_participants_agency_id ON participants (partner_agency_id);
CREATE INDEX IF NOT EXISTS idx_participants_cbo_id ON participants (cbo_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants (status);
CREATE INDEX IF NOT EXISTS idx_participants_name ON participants (name);

-- ------------------------------------------------------------------------------
-- 4. Triggers: Automatically manage timestamps and confirmation dates
-- ------------------------------------------------------------------------------

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_partner_agencies_updated_at ON partner_agencies;
CREATE TRIGGER trg_partner_agencies_updated_at
BEFORE UPDATE ON partner_agencies
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_cbos_updated_at ON cbos;
CREATE TRIGGER trg_cbos_updated_at
BEFORE UPDATE ON cbos
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Participant status & date_confirmed automation trigger
CREATE OR REPLACE FUNCTION handle_participant_confirmation()
RETURNS TRIGGER AS $$
BEGIN
    -- If Confirmed and date_confirmed not set, assign NOW()
    IF NEW.status = 'Confirmed' THEN
        IF NEW.date_confirmed IS NULL THEN
            NEW.date_confirmed := NOW();
        END IF;
    -- If changed away from Confirmed, clear date_confirmed
    ELSE
        NEW.date_confirmed := NULL;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_participant_confirmation ON participants;
CREATE TRIGGER trg_participant_confirmation
BEFORE INSERT OR UPDATE ON participants
FOR EACH ROW EXECUTE FUNCTION handle_participant_confirmation();

-- ------------------------------------------------------------------------------
-- 5. Row Level Security (RLS) Configuration
-- ------------------------------------------------------------------------------
-- Enable RLS on all tables
ALTER TABLE partner_agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbos ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- For an internal application without mandatory user authentication,
-- we create policies that allow full access (SELECT, INSERT, UPDATE, DELETE)
-- to public (or anon / authenticated) users.
-- Note: When authentication is added in the future, these can simply be restricted
-- to (auth.role() = 'authenticated').

-- Partner Agencies Policies
DROP POLICY IF EXISTS "Allow read access to partner_agencies" ON partner_agencies;
CREATE POLICY "Allow read access to partner_agencies" 
    ON partner_agencies FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Allow insert access to partner_agencies" ON partner_agencies;
CREATE POLICY "Allow insert access to partner_agencies" 
    ON partner_agencies FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update access to partner_agencies" ON partner_agencies;
CREATE POLICY "Allow update access to partner_agencies" 
    ON partner_agencies FOR UPDATE 
    USING (true);

DROP POLICY IF EXISTS "Allow delete access to partner_agencies" ON partner_agencies;
CREATE POLICY "Allow delete access to partner_agencies" 
    ON partner_agencies FOR DELETE 
    USING (true);

-- CBOs Policies
DROP POLICY IF EXISTS "Allow read access to cbos" ON cbos;
CREATE POLICY "Allow read access to cbos" 
    ON cbos FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Allow insert access to cbos" ON cbos;
CREATE POLICY "Allow insert access to cbos" 
    ON cbos FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update access to cbos" ON cbos;
CREATE POLICY "Allow update access to cbos" 
    ON cbos FOR UPDATE 
    USING (true);

DROP POLICY IF EXISTS "Allow delete access to cbos" ON cbos;
CREATE POLICY "Allow delete access to cbos" 
    ON cbos FOR DELETE 
    USING (true);

-- Participants Policies
DROP POLICY IF EXISTS "Allow read access to participants" ON participants;
CREATE POLICY "Allow read access to participants" 
    ON participants FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Allow insert access to participants" ON participants;
CREATE POLICY "Allow insert access to participants" 
    ON participants FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update access to participants" ON participants;
CREATE POLICY "Allow update access to participants" 
    ON participants FOR UPDATE 
    USING (true);

DROP POLICY IF EXISTS "Allow delete access to participants" ON participants;
CREATE POLICY "Allow delete access to participants" 
    ON participants FOR DELETE 
    USING (true);

-- ------------------------------------------------------------------------------
-- 6. Table: attendance_records
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_date DATE NOT NULL DEFAULT CURRENT_DATE,
    participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    office_agency TEXT NOT NULL,
    position TEXT,
    sex TEXT CHECK (sex IS NULL OR sex IN ('M', 'F')),
    email TEXT,
    contact_no TEXT,
    remarks TEXT,
    am_in TEXT,
    am_out TEXT,
    pm_in TEXT,
    pm_out TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_attendance_participant_date UNIQUE (event_date, participant_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_event_date ON attendance_records (event_date);
CREATE INDEX IF NOT EXISTS idx_attendance_participant_id ON attendance_records (participant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_name ON attendance_records (name);

DROP TRIGGER IF EXISTS trg_attendance_updated_at ON attendance_records;
CREATE TRIGGER trg_attendance_updated_at
BEFORE UPDATE ON attendance_records
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to attendance_records" ON attendance_records;
CREATE POLICY "Allow read access to attendance_records" 
    ON attendance_records FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Allow insert access to attendance_records" ON attendance_records;
CREATE POLICY "Allow insert access to attendance_records" 
    ON attendance_records FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update access to attendance_records" ON attendance_records;
CREATE POLICY "Allow update access to attendance_records" 
    ON attendance_records FOR UPDATE 
    USING (true);

DROP POLICY IF EXISTS "Allow delete access to attendance_records" ON attendance_records;
CREATE POLICY "Allow delete access to attendance_records" 
    ON attendance_records FOR DELETE 
    USING (true);

