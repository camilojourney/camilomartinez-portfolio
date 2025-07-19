-- WHOOP V1 to V2 Migration - Phase 1 & 2
-- Safe to run immediately - preserves all existing data
-- Run this in your Neon SQL Editor

-- =============================================
-- PHASE 1: CREATE BACKUPS
-- =============================================

-- Create backup tables for safety
CREATE TABLE whoop_sleep_v1_backup AS SELECT * FROM whoop_sleep;
CREATE TABLE whoop_workouts_v1_backup AS SELECT * FROM whoop_workouts;
CREATE TABLE whoop_recovery_v1_backup AS SELECT * FROM whoop_recovery;

-- Verify backups
SELECT
    'Backup Verification' as status,
    (SELECT COUNT(*) FROM whoop_sleep) as sleep_original,
    (SELECT COUNT(*) FROM whoop_sleep_v1_backup) as sleep_backup,
    (SELECT COUNT(*) FROM whoop_workouts) as workouts_original,
    (SELECT COUNT(*) FROM whoop_workouts_v1_backup) as workouts_backup,
    (SELECT COUNT(*) FROM whoop_recovery) as recovery_original,
    (SELECT COUNT(*) FROM whoop_recovery_v1_backup) as recovery_backup;

-- =============================================
-- PHASE 2: ADD V2 COMPATIBILITY COLUMNS
-- =============================================

-- Drop foreign key constraints temporarily
ALTER TABLE whoop_recovery DROP CONSTRAINT IF EXISTS whoop_recovery_sleep_id_fkey;

-- Add new columns to support v2 UUIDs and v1 compatibility
ALTER TABLE whoop_sleep ADD COLUMN id_v2 VARCHAR(36);
ALTER TABLE whoop_sleep ADD COLUMN activity_v1_id BIGINT;

ALTER TABLE whoop_workouts ADD COLUMN id_v2 VARCHAR(36);
ALTER TABLE whoop_workouts ADD COLUMN activity_v1_id BIGINT;

ALTER TABLE whoop_recovery ADD COLUMN sleep_id_v2 VARCHAR(36);

-- Preserve existing v1 IDs in compatibility columns
UPDATE whoop_sleep SET activity_v1_id = id;
UPDATE whoop_workouts SET activity_v1_id = id;

-- Verify schema changes
SELECT
    'Schema Update Complete' as status,
    (SELECT COUNT(*) FROM whoop_sleep WHERE activity_v1_id IS NOT NULL) as sleep_v1_preserved,
    (SELECT COUNT(*) FROM whoop_workouts WHERE activity_v1_id IS NOT NULL) as workouts_v1_preserved;

-- Show new table structure
SELECT
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('whoop_sleep', 'whoop_workouts', 'whoop_recovery')
    AND table_schema = 'public'
    AND column_name IN ('id', 'id_v2', 'activity_v1_id', 'sleep_id', 'sleep_id_v2')
ORDER BY table_name, ordinal_position;

-- =============================================
-- MIGRATION STATUS
-- =============================================

SELECT
    'MIGRATION PHASE 1 & 2 COMPLETE' as status,
    'Ready to deploy v2 code' as next_step,
    'All existing data preserved' as data_status;

-- Next steps:
-- 1. Deploy your updated code with WhoopV2Client
-- 2. Let the app collect data with UUID IDs for a few days
-- 3. Run the final migration (Phase 4) when you have UUID data
