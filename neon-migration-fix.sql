-- ============================================
-- NEON DATABASE MIGRATION: Fix WHOOP v2 Schema
-- ============================================
-- Run these commands in your Neon SQL editor to fix the database schema

-- STEP 1: Check if tables exist
SELECT table_name, table_schema
FROM information_schema.tables
WHERE table_name LIKE 'whoop_%'
AND table_schema = 'public';

-- STEP 2: Fix the sleep table foreign key constraint
-- The main issue is that cycle_id should allow NULL values
-- because not all sleep records will have an associated cycle

-- First, drop the existing foreign key constraint
ALTER TABLE whoop_sleep
DROP CONSTRAINT IF EXISTS whoop_sleep_cycle_id_fkey;

-- Modify the cycle_id column to allow NULL values
ALTER TABLE whoop_sleep
ALTER COLUMN cycle_id DROP NOT NULL;

-- Re-add the foreign key constraint with SET NULL on delete
ALTER TABLE whoop_sleep
ADD CONSTRAINT whoop_sleep_cycle_id_fkey
FOREIGN KEY (cycle_id)
REFERENCES whoop_cycles(id)
ON DELETE SET NULL;

-- STEP 3: Fix the recovery table foreign key constraint
-- Make sleep_id optional since not all recovery records may have sleep data
ALTER TABLE whoop_recovery
DROP CONSTRAINT IF EXISTS whoop_recovery_sleep_id_fkey;

-- Allow NULL values for sleep_id
ALTER TABLE whoop_recovery
ALTER COLUMN sleep_id DROP NOT NULL;

-- Re-add the foreign key constraint with SET NULL on delete
ALTER TABLE whoop_recovery
ADD CONSTRAINT whoop_recovery_sleep_id_fkey
FOREIGN KEY (sleep_id)
REFERENCES whoop_sleep(id)
ON DELETE SET NULL;

-- STEP 4: Verify the changes
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name LIKE 'whoop_%'
ORDER BY tc.table_name, tc.constraint_name;

-- STEP 5: Test that the constraints work properly
-- Insert test data to verify NULL values are allowed

-- Test cycle_id can be NULL in sleep table
INSERT INTO whoop_users (id, email, first_name, last_name)
VALUES (999999, 'test@example.com', 'Test', 'User')
ON CONFLICT (id) DO NOTHING;

-- Test sleep record without cycle_id (should work now)
INSERT INTO whoop_sleep (
    id, user_id, cycle_id, start_time, end_time, nap, score_state
) VALUES (
    'test-sleep-uuid-123',
    999999,
    NULL,  -- This should now work!
    '2024-01-01 00:00:00+00',
    '2024-01-01 08:00:00+00',
    false,
    'SCORED'
) ON CONFLICT (id) DO NOTHING;

-- Test recovery record without sleep_id (should work now)
INSERT INTO whoop_cycles (
    id, user_id, start_time, end_time, score_state
) VALUES (
    888888,
    999999,
    '2024-01-01 00:00:00+00',
    '2024-01-02 00:00:00+00',
    'SCORED'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO whoop_recovery (
    cycle_id, user_id, sleep_id, score_state, recovery_score
) VALUES (
    888888,
    999999,
    NULL,  -- This should now work!
    'SCORED',
    85.5
) ON CONFLICT (cycle_id) DO NOTHING;

-- Clean up test data
DELETE FROM whoop_recovery WHERE cycle_id = 888888;
DELETE FROM whoop_cycles WHERE id = 888888;
DELETE FROM whoop_sleep WHERE id = 'test-sleep-uuid-123';
DELETE FROM whoop_users WHERE id = 999999;

-- SUCCESS MESSAGE
SELECT 'Database schema updated successfully! 🎉' AS message;
