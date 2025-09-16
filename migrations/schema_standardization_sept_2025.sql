-- Schema Standardization Migration
-- Date: September 16, 2025
-- Purpose: Standardize column naming and data types for better AI compliance and data integrity
-- Excludes: v1_id legacy column renames (keeping as-is)

BEGIN;

-- =============================================================================
-- PHASE 1: CRITICAL FIXES (High Priority)
-- =============================================================================

-- 1. Fix distance column naming inconsistency
-- Current: whoop_workouts.distance_meter vs strava_runs.distance_meters
-- This inconsistency causes ETL and JOIN issues
ALTER TABLE whoop_workouts 
RENAME COLUMN distance_meter TO distance_meters;

-- 2. Standardize heart rate data types for consistency
-- Current: whoop_recovery uses numeric(5,2), whoop_workouts/cycles use integer
-- Heart rate can have decimal precision (e.g., 72.5 BPM)
ALTER TABLE whoop_workouts 
ALTER COLUMN average_heart_rate TYPE numeric(5,1);

ALTER TABLE whoop_workouts 
ALTER COLUMN max_heart_rate TYPE numeric(5,1);

ALTER TABLE whoop_cycles 
ALTER COLUMN average_heart_rate TYPE numeric(5,1);

ALTER TABLE whoop_cycles 
ALTER COLUMN max_heart_rate TYPE numeric(5,1);

-- =============================================================================
-- PHASE 2: NAMING IMPROVEMENTS (Medium Priority)
-- =============================================================================

-- 3. Add explicit units to heart rate columns for clarity
ALTER TABLE whoop_recovery 
RENAME COLUMN resting_heart_rate TO resting_heart_rate_bpm;

ALTER TABLE whoop_workouts 
RENAME COLUMN average_heart_rate TO avg_heart_rate_bpm;

ALTER TABLE whoop_workouts 
RENAME COLUMN max_heart_rate TO max_heart_rate_bpm;

ALTER TABLE whoop_cycles 
RENAME COLUMN average_heart_rate TO avg_heart_rate_bpm;

ALTER TABLE whoop_cycles 
RENAME COLUMN max_heart_rate TO max_heart_rate_bpm;

-- 4. Improve zone column naming pattern
-- Current: zone_zero_milli, zone_one_milli, etc.
-- Better: hr_zone_0_ms, hr_zone_1_ms, etc. (shorter, clearer)
ALTER TABLE whoop_workouts RENAME COLUMN zone_zero_milli TO hr_zone_0_ms;
ALTER TABLE whoop_workouts RENAME COLUMN zone_one_milli TO hr_zone_1_ms;
ALTER TABLE whoop_workouts RENAME COLUMN zone_two_milli TO hr_zone_2_ms;
ALTER TABLE whoop_workouts RENAME COLUMN zone_three_milli TO hr_zone_3_ms;
ALTER TABLE whoop_workouts RENAME COLUMN zone_four_milli TO hr_zone_4_ms;
ALTER TABLE whoop_workouts RENAME COLUMN zone_five_milli TO hr_zone_5_ms;

-- =============================================================================
-- PHASE 3: BOOLEAN AND PERCENTAGE CONSISTENCY (Low Priority)
-- =============================================================================

-- 5. Boolean field clarity - add 'is_' prefix
ALTER TABLE whoop_sleep 
RENAME COLUMN nap TO is_nap;

-- 6. Percentage field consistency
ALTER TABLE whoop_recovery 
RENAME COLUMN recovery_score TO recovery_percentage;

-- =============================================================================
-- UPDATE COMMENTS AND CONSTRAINTS
-- =============================================================================

-- Add helpful comments to clarify renamed columns
COMMENT ON COLUMN whoop_workouts.distance_meters IS 'Distance covered in meters (standardized with strava_runs)';
COMMENT ON COLUMN whoop_workouts.avg_heart_rate_bpm IS 'Average heart rate in beats per minute (decimal precision)';
COMMENT ON COLUMN whoop_workouts.max_heart_rate_bpm IS 'Maximum heart rate in beats per minute (decimal precision)';
COMMENT ON COLUMN whoop_workouts.hr_zone_0_ms IS 'Time in heart rate zone 0 (50-60% max HR) in milliseconds';
COMMENT ON COLUMN whoop_workouts.hr_zone_1_ms IS 'Time in heart rate zone 1 (60-70% max HR) in milliseconds';
COMMENT ON COLUMN whoop_workouts.hr_zone_2_ms IS 'Time in heart rate zone 2 (70-80% max HR) in milliseconds';
COMMENT ON COLUMN whoop_workouts.hr_zone_3_ms IS 'Time in heart rate zone 3 (80-90% max HR) in milliseconds';
COMMENT ON COLUMN whoop_workouts.hr_zone_4_ms IS 'Time in heart rate zone 4 (90-95% max HR) in milliseconds';
COMMENT ON COLUMN whoop_workouts.hr_zone_5_ms IS 'Time in heart rate zone 5 (95-100+ max HR) in milliseconds';

COMMENT ON COLUMN whoop_recovery.resting_heart_rate_bpm IS 'Resting heart rate in beats per minute (measured during sleep)';
COMMENT ON COLUMN whoop_recovery.recovery_percentage IS 'Recovery score as percentage 0-100 (renamed from recovery_score for consistency)';

COMMENT ON COLUMN whoop_sleep.is_nap IS 'Boolean indicating if this is a nap (true) or overnight sleep (false)';

-- =============================================================================
-- VALIDATION QUERIES
-- =============================================================================

-- Verify the changes were applied correctly
SELECT 
    'whoop_workouts distance column' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whoop_workouts' 
        AND column_name = 'distance_meters'
    ) THEN 'PASS' ELSE 'FAIL' END as status;

SELECT 
    'heart rate BPM naming' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whoop_workouts' 
        AND column_name = 'avg_heart_rate_bpm'
    ) THEN 'PASS' ELSE 'FAIL' END as status;

SELECT 
    'heart rate zone naming' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whoop_workouts' 
        AND column_name = 'hr_zone_0_ms'
    ) THEN 'PASS' ELSE 'FAIL' END as status;

COMMIT;

-- =============================================================================
-- MIGRATION SUMMARY
-- =============================================================================
/*
CHANGES APPLIED:
✅ distance_meter → distance_meters (consistency with Strava)
✅ Heart rate columns → *_heart_rate_bpm (explicit units)
✅ Heart rate data types → numeric(5,1) (decimal precision)
✅ Zone columns → hr_zone_*_ms (shorter, clearer naming)
✅ nap → is_nap (boolean clarity)
✅ recovery_score → recovery_percentage (consistency)

EXCLUDED (as requested):
❌ v1_id → legacy_activity_id (keeping original naming)

RISK ASSESSMENT:
- HIGH: distance_meter rename affects ETL scripts
- MEDIUM: Heart rate column renames affect queries
- LOW: Zone renames are mostly cosmetic

NEXT STEPS:
1. Update TypeScript types in src/types/whoop.ts
2. Update database access in src/lib/db/whoop-database.ts
3. Update ETL scripts in scripts/data/
4. Test production data fetching
*/
