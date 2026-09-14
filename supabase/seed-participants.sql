-- ==============================================================================
-- SEED PARTICIPANTS (uses existing agencies and CBOs by name)
-- Run this if seed.sql failed because agencies/CBOs already exist.
-- ==============================================================================

DO $$
DECLARE
    agency_a_id UUID;
    agency_b_id UUID;
    agency_c_id UUID;
    cbo_1_id UUID;
    cbo_2_id UUID;
    cbo_3_id UUID;
    cbo_4_id UUID;
BEGIN
    -- Look up existing agency IDs by name
    SELECT id INTO agency_a_id FROM partner_agencies WHERE name = 'Agency A';
    SELECT id INTO agency_b_id FROM partner_agencies WHERE name = 'Agency B';
    SELECT id INTO agency_c_id FROM partner_agencies WHERE name = 'Agency C';

    -- Look up existing CBO IDs by name
    SELECT id INTO cbo_1_id FROM cbos WHERE name = 'CBO1' AND partner_agency_id = agency_a_id;
    SELECT id INTO cbo_2_id FROM cbos WHERE name = 'CBO2' AND partner_agency_id = agency_a_id;
    SELECT id INTO cbo_3_id FROM cbos WHERE name = 'CBO3' AND partner_agency_id = agency_b_id;
    SELECT id INTO cbo_4_id FROM cbos WHERE name = 'CBO4' AND partner_agency_id = agency_c_id;

    -- Safety check
    IF agency_a_id IS NULL OR agency_b_id IS NULL OR agency_c_id IS NULL THEN
        RAISE EXCEPTION 'Agencies not found. Make sure seed.sql or schema created Agency A, B, C first.';
    END IF;

    IF cbo_1_id IS NULL OR cbo_2_id IS NULL OR cbo_3_id IS NULL OR cbo_4_id IS NULL THEN
        RAISE EXCEPTION 'CBOs not found. Make sure CBO1-CBO4 exist in the database.';
    END IF;

    -- Insert Participants (skip if already exist by name)
    INSERT INTO participants (partner_agency_id, cbo_id, name, status)
    VALUES (agency_a_id, cbo_1_id, 'Juan Dela Cruz', 'Confirmed')
    ON CONFLICT DO NOTHING;

    INSERT INTO participants (partner_agency_id, cbo_id, name, status)
    VALUES (agency_a_id, cbo_1_id, 'Maria Santos', 'Confirmed')
    ON CONFLICT DO NOTHING;

    INSERT INTO participants (partner_agency_id, cbo_id, name, status)
    VALUES (agency_a_id, cbo_2_id, 'Pedro Reyes', 'Pending')
    ON CONFLICT DO NOTHING;

    INSERT INTO participants (partner_agency_id, cbo_id, name, status)
    VALUES (agency_b_id, cbo_3_id, 'Ana Cruz', 'Confirmed')
    ON CONFLICT DO NOTHING;

    INSERT INTO participants (partner_agency_id, cbo_id, name, status)
    VALUES (agency_b_id, cbo_3_id, 'Carlos Tan', 'Cancelled')
    ON CONFLICT DO NOTHING;

    INSERT INTO participants (partner_agency_id, cbo_id, name, status)
    VALUES (agency_c_id, cbo_4_id, 'Elena Gomez', 'Pending')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Participants seeded successfully.';
END $$;

