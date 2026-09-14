-- ==============================================================================
-- SAMPLE SEED DATA FOR PARTICIPANT MANAGEMENT SYSTEM
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
    -- 1. Insert Partner Agencies
    INSERT INTO partner_agencies (name)
    VALUES ('Agency A')
    RETURNING id INTO agency_a_id;

    INSERT INTO partner_agencies (name)
    VALUES ('Agency B')
    RETURNING id INTO agency_b_id;

    INSERT INTO partner_agencies (name)
    VALUES ('Agency C')
    RETURNING id INTO agency_c_id;

    -- 2. Insert CBOs
    INSERT INTO cbos (partner_agency_id, name)
    VALUES (agency_a_id, 'CBO1')
    RETURNING id INTO cbo_1_id;

    INSERT INTO cbos (partner_agency_id, name)
    VALUES (agency_a_id, 'CBO2')
    RETURNING id INTO cbo_2_id;

    INSERT INTO cbos (partner_agency_id, name)
    VALUES (agency_b_id, 'CBO3')
    RETURNING id INTO cbo_3_id;

    INSERT INTO cbos (partner_agency_id, name)
    VALUES (agency_c_id, 'CBO4')
    RETURNING id INTO cbo_4_id;

    -- 3. Insert Participants
    -- Agency A -> CBO1
    INSERT INTO participants (partner_agency_id, cbo_id, name, status, date_confirmed)
    VALUES (agency_a_id, cbo_1_id, 'Juan Dela Cruz', 'Confirmed', NOW() - INTERVAL '2 days');

    INSERT INTO participants (partner_agency_id, cbo_id, name, status, date_confirmed)
    VALUES (agency_a_id, cbo_1_id, 'Maria Santos', 'Confirmed', NOW() - INTERVAL '1 day');

    -- Agency A -> CBO2
    INSERT INTO participants (partner_agency_id, cbo_id, name, status)
    VALUES (agency_a_id, cbo_2_id, 'Pedro Reyes', 'Pending');

    -- Agency B -> CBO3
    INSERT INTO participants (partner_agency_id, cbo_id, name, status, date_confirmed)
    VALUES (agency_b_id, cbo_3_id, 'Ana Cruz', 'Confirmed', NOW() - INTERVAL '3 hours');

    -- Additional sample for status distribution (Cancelled)
    INSERT INTO participants (partner_agency_id, cbo_id, name, status)
    VALUES (agency_b_id, cbo_3_id, 'Carlos Tan', 'Cancelled');

    -- Agency C -> CBO4
    INSERT INTO participants (partner_agency_id, cbo_id, name, status)
    VALUES (agency_c_id, cbo_4_id, 'Elena Gomez', 'Pending');

END $$;

