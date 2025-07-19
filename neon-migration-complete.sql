-- WHOOP API V1 to V2 Database Migration for Neon
-- Run this script in your Neon database console
-- IMPORTANT: This migration preserves all existing data while adding v2 support

-- =============================================================================
-- PHASE 1: BACKUP AND PREPARE
-- =============================================================================

-- Create backup tables for safety
CREATE TABLE IF NOT EXISTS whoop_sleep_v1_backup AS SELECT * FROM whoop_sleep;
CREATE TABLE IF NOT EXISTS whoop_workouts_v1_backup AS SELECT * FROM whoop_workouts;
CREATE TABLE IF NOT EXISTS whoop_recovery_v1_backup AS SELECT * FROM whoop_recovery;

-- Verify backup creation
SELECT
    'whoop_sleep' as table_name, COUNT(*) as original_count,
    (SELECT COUNT(*) FROM whoop_sleep_v1_backup) as backup_count
FROM whoop_sleep
UNION ALL
SELECT
    'whoop_workouts' as table_name, COUNT(*) as original_count,
    (SELECT COUNT(*) FROM whoop_workouts_v1_backup) as backup_count
FROM whoop_workouts
UNION ALL
SELECT
    'whoop_recovery' as table_name, COUNT(*) as original_count,
    (SELECT COUNT(*) FROM whoop_recovery_v1_backup) as backup_count
FROM whoop_recovery;

-- =============================================================================
-- PHASE 2: MODIFY SCHEMA FOR V2 COMPATIBILITY
-- =============================================================================

-- Drop foreign key constraints temporarily
ALTER TABLE whoop_recovery DROP CONSTRAINT IF EXISTS whoop_recovery_sleep_id_fkey;

-- Add new columns to whoop_sleep table
ALTER TABLE whoop_sleep
    ADD COLUMN IF NOT EXISTS id_v2 VARCHAR(36),
    ADD COLUMN IF NOT EXISTS activity_v1_id BIGINT;

-- Add new columns to whoop_workouts table
ALTER TABLE whoop_workouts
    ADD COLUMN IF NOT EXISTS id_v2 VARCHAR(36),
    ADD COLUMN IF NOT EXISTS activity_v1_id BIGINT;

-- Add new column to whoop_recovery table
ALTER TABLE whoop_recovery
    ADD COLUMN IF NOT EXISTS sleep_id_v2 VARCHAR(36);

-- =============================================================================
-- PHASE 3: PRESERVE EXISTING DATA
-- =============================================================================

-- Copy existing v1 IDs to compatibility columns
UPDATE whoop_sleep SET activity_v1_id = id WHERE activity_v1_id IS NULL;
UPDATE whoop_workouts SET activity_v1_id = id WHERE activity_v1_id IS NULL;

-- Verify data preservation
SELECT
    'Data preservation check' as status,
    (SELECT COUNT(*) FROM whoop_sleep WHERE activity_v1_id IS NOT NULL) as sleep_v1_ids_preserved,
    (SELECT COUNT(*) FROM whoop_workouts WHERE activity_v1_id IS NOT NULL) as workout_v1_ids_preserved;

-- =============================================================================
-- PHASE 4: PREPARE FOR V2 DATA (Run this after deploying v2 code)
-- =============================================================================

-- The following steps should be run AFTER you deploy your v2 code
-- and start collecting data with UUID IDs from the WHOOP v2 API

/*
-- Step 4a: Generate temporary UUIDs for existing data (if needed for testing)
-- Only run this if you need to test the full migration before getting real v2 data
UPDATE whoop_sleep
SET id_v2 = CONCAT(
    LPAD(TO_HEX(FLOOR(RANDOM() * 65536)), 4, '0'),
    LPAD(TO_HEX(FLOOR(RANDOM() * 65536)), 4, '0'),
    '-',
    LPAD(TO_HEX(FLOOR(RANDOM() * 65536)), 4, '0'),
    '-',
    LPAD(TO_HEX(FLOOR(RANDOM() * 65536)), 4, '0'),
    '-',
    LPAD(TO_HEX(FLOOR(RANDOM() * 65536)), 4, '0'),
    '-',
    LPAD(TO_HEX(FLOOR(RANDOM() * 65536)), 4, '0'),
    LPAD(TO_HEX(FLOOR(RANDOM() * 65536)), 4, '0'),
    LPAD(TO_HEX(FLOOR(RANDOM() * 65536)), 4, '0')
)
WHERE id_v2 IS NULL;

UPDATE whoop_workouts
SET id_v2 = CONCAT(
    LPAD(TO_HEX(FLOOR(RANDOM() * 65536)), 4, '0'),
    LPAD(TO_HEX(FLOOR(RANDOM() * 65536)), 4, '0'),
    '-',
    LPAD(TO_HEX(FLOOR(RANDOM() * 65536)), 4, '0'),
    '-',
    LPAD(TO_HEX(FLOOR(RANDOM() * 65536)), 4, '0'),
    '-',
    LPAD(TO_HEX(FLOOR(RANDOM() * 65536)), 4, '0'),
    '-',
    LPAD(TO_HEX(FLOOR(RANDOM() * 65536)), 4, '0'),
    LPAD(TO_HEX(FLOOR(RANDOM() * 65536)), 4, '0'),
    LPAD(TO_HEX(FLOOR(RANDOM() * 65536)), 4, '0')
)
WHERE id_v2 IS NULL;

-- Update recovery table to reference the new UUID sleep IDs
UPDATE whoop_recovery
SET sleep_id_v2 = (
    SELECT id_v2
    FROM whoop_sleep
    WHERE whoop_sleep.activity_v1_id = whoop_recovery.sleep_id
)
WHERE sleep_id_v2 IS NULL;
*/

-- =============================================================================
-- FINAL PHASE: COMPLETE MIGRATION (Run only when ready to switch to v2 fully)
-- =============================================================================

/*
-- WARNING: Only run these commands when you're ready to fully switch to v2
-- and you have populated the id_v2 and sleep_id_v2 columns with real UUID data

-- Step 1: Drop old primary key constraints
ALTER TABLE whoop_sleep DROP CONSTRAINT whoop_sleep_pkey;
ALTER TABLE whoop_workouts DROP CONSTRAINT whoop_workouts_pkey;

-- Step 2: Rename columns to complete migration
ALTER TABLE whoop_sleep RENAME COLUMN id TO id_v1_deprecated;
ALTER TABLE whoop_sleep RENAME COLUMN id_v2 TO id;

ALTER TABLE whoop_workouts RENAME COLUMN id TO id_v1_deprecated;
ALTER TABLE whoop_workouts RENAME COLUMN id_v2 TO id;

ALTER TABLE whoop_recovery RENAME COLUMN sleep_id TO sleep_id_v1_deprecated;
ALTER TABLE whoop_recovery RENAME COLUMN sleep_id_v2 TO sleep_id;

-- Step 3: Add new primary key constraints
ALTER TABLE whoop_sleep ADD CONSTRAINT whoop_sleep_pkey PRIMARY KEY (id);
ALTER TABLE whoop_workouts ADD CONSTRAINT whoop_workouts_pkey PRIMARY KEY (id);

-- Step 4: Recreate foreign key constraints
ALTER TABLE whoop_recovery
    ADD CONSTRAINT whoop_recovery_sleep_id_fkey
    FOREIGN KEY (sleep_id) REFERENCES whoop_sleep(id) ON DELETE CASCADE;

-- Step 5: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_whoop_sleep_activity_v1_id ON whoop_sleep(activity_v1_id);
CREATE INDEX IF NOT EXISTS idx_whoop_workouts_activity_v1_id ON whoop_workouts(activity_v1_id);
CREATE INDEX IF NOT EXISTS idx_whoop_sleep_user_id ON whoop_sleep(user_id);
CREATE INDEX IF NOT EXISTS idx_whoop_workouts_user_id ON whoop_workouts(user_id);

-- Step 6: Update table comments
COMMENT ON TABLE whoop_sleep IS 'Stores WHOOP sleep activity data (V2 API with UUID IDs)';
COMMENT ON TABLE whoop_workouts IS 'Stores WHOOP workout data (V2 API with UUID IDs)';
COMMENT ON TABLE whoop_recovery IS 'Stores WHOOP daily recovery scores (V2 API)';

-- Step 7: Clean up deprecated columns (optional, after thorough testing)
-- ALTER TABLE whoop_sleep DROP COLUMN id_v1_deprecated;
-- ALTER TABLE whoop_workouts DROP COLUMN id_v1_deprecated;
-- ALTER TABLE whoop_recovery DROP COLUMN sleep_id_v1_deprecated;
*/

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check migration progress
SELECT
    'Migration Status' as check_type,
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whoop_sleep' AND column_name = 'activity_v1_id')
        THEN 'Schema updated for v2 compatibility'
        ELSE 'Schema not yet updated'
    END as status;

-- Check data integrity
SELECT
    'Data Integrity' as check_type,
    CASE
        WHEN (SELECT COUNT(*) FROM whoop_sleep) = (SELECT COUNT(*) FROM whoop_sleep_v1_backup)
        THEN 'Sleep data preserved'
        ELSE 'Sleep data count mismatch'
    END as sleep_status,
    CASE
        WHEN (SELECT COUNT(*) FROM whoop_workouts) = (SELECT COUNT(*) FROM whoop_workouts_v1_backup)
        THEN 'Workout data preserved'
        ELSE 'Workout data count mismatch'
    END as workout_status;

-- Show current schema
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('whoop_sleep', 'whoop_workouts', 'whoop_recovery')
    AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
