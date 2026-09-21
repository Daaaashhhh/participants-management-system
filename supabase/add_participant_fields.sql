-- ==============================================================================
-- MIGRATION: ADD PROFILE / ATTENDANCE-RELATED FIELDS TO PARTICIPANTS TABLE
-- ==============================================================================
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/rdclxlrjtznpkkgkcgoy/sql/new

ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS sex TEXT CHECK (sex IS NULL OR sex IN ('M', 'F')),
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS contact_no TEXT,
ADD COLUMN IF NOT EXISTS remarks TEXT;

-- Create indexes for frequent search & filter operations
CREATE INDEX IF NOT EXISTS idx_participants_position ON participants (position);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants (email);
-- Force PostgREST to reload its schema cache immediately
NOTIFY pgrst, 'reload schema';
