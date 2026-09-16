-- ==============================================================================
-- ATTENDANCE RECORDS SCHEMA FOR PARTICIPANT MANAGEMENT SYSTEM
-- ==============================================================================

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

    -- Ensures a participant is not added more than once on the same event date
    CONSTRAINT uq_attendance_participant_date UNIQUE (event_date, participant_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_event_date ON attendance_records (event_date);
CREATE INDEX IF NOT EXISTS idx_attendance_participant_id ON attendance_records (participant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_name ON attendance_records (name);

-- Updated at trigger
DROP TRIGGER IF EXISTS trg_attendance_updated_at ON attendance_records;
CREATE TRIGGER trg_attendance_updated_at
BEFORE UPDATE ON attendance_records
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Policies for internal operational access
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

