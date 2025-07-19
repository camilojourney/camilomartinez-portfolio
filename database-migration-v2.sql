-- WHOOP API V1 to V2 Migration Script
-- This script migrates the database schema to support WHOOP API v2
-- Key changes:
-- 1. Sleep and Workout IDs change from BIGINT to VARCHAR (UUID)
-- 2. Add activityV1Id columns for backwards compatibility
-- 3. Update foreign key references

-- STEP 1: Create backup tables (optional but recommended)
CREATE TABLE whoop_sleep_v1_backup AS SELECT * FROM whoop_sleep;
CREATE TABLE whoop_workouts_v1_backup AS SELECT * FROM whoop_workouts;
CREATE TABLE whoop_recovery_v1_backup AS SELECT * FROM whoop_recovery;

-- STEP 2: Drop foreign key constraints that reference sleep and workout IDs
ALTER TABLE whoop_recovery DROP CONSTRAINT IF EXISTS whoop_recovery_sleep_id_fkey;

-- STEP 3: Add new columns for v2 UUIDs and v1 compatibility
ALTER TABLE whoop_sleep
    ADD COLUMN id_v2 VARCHAR(36),
    ADD COLUMN activity_v1_id BIGINT;

ALTER TABLE whoop_workouts
    ADD COLUMN id_v2 VARCHAR(36),
    ADD COLUMN activity_v1_id BIGINT;

-- STEP 4: Copy existing v1 IDs to the activity_v1_id columns
UPDATE whoop_sleep SET activity_v1_id = id;
UPDATE whoop_workouts SET activity_v1_id = id;

-- STEP 5: Update recovery table to support UUID sleep_id
ALTER TABLE whoop_recovery
    ADD COLUMN sleep_id_v2 VARCHAR(36);

-- Note: At this point, you would need to run the v2 API to get the new UUIDs
-- and populate the id_v2 and sleep_id_v2 columns before proceeding

-- STEP 6: Once v2 data is populated, swap the columns
-- This would be done after API migration is complete:
-- ALTER TABLE whoop_sleep DROP COLUMN id CASCADE;
-- ALTER TABLE whoop_sleep RENAME COLUMN id_v2 TO id;
-- ALTER TABLE whoop_workouts DROP COLUMN id CASCADE;
-- ALTER TABLE whoop_workouts RENAME COLUMN id_v2 TO id;
-- ALTER TABLE whoop_recovery DROP COLUMN sleep_id;
-- ALTER TABLE whoop_recovery RENAME COLUMN sleep_id_v2 TO sleep_id;

-- STEP 7: Add new primary key constraints
-- ALTER TABLE whoop_sleep ADD CONSTRAINT whoop_sleep_pkey PRIMARY KEY (id);
-- ALTER TABLE whoop_workouts ADD CONSTRAINT whoop_workouts_pkey PRIMARY KEY (id);

-- STEP 8: Recreate foreign key constraints
-- ALTER TABLE whoop_recovery
--     ADD CONSTRAINT whoop_recovery_sleep_id_fkey
--     FOREIGN KEY (sleep_id) REFERENCES whoop_sleep(id) ON DELETE CASCADE;

-- Add comments for documentation
COMMENT ON TABLE whoop_sleep IS 'Stores WHOOP sleep activity data (V2 API with UUID IDs)';
COMMENT ON TABLE whoop_workouts IS 'Stores WHOOP workout data (V2 API with UUID IDs)';
COMMENT ON TABLE whoop_recovery IS 'Stores WHOOP daily recovery scores (V2 API)';
