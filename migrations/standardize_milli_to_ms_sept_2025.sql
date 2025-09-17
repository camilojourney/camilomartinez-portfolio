-- 📂 migrations/standardize_milli_to_ms_sept_2025.sql
/**
 * Schema Standardization: _milli → _ms suffix
 * Date: September 16, 2025
 * Purpose: Standardize all time duration columns to use "_ms" instead of "_milli"
 * 
 * This migration renames columns for consistency and brevity:
 * - total_*_time_milli → total_*_time_ms
 * - hrv_rmssd_milli → hrv_rmssd_ms  
 * - baseline_milli → baseline_ms
 * - need_*_milli → need_*_ms
 * - zone_*_milli → zone_*_ms (NOTE: These were already renamed to hr_zone_*_ms)
 */

-- =============================================================================
-- WHOOP SLEEP TABLE
-- =============================================================================

-- Sleep timing columns
ALTER TABLE whoop_sleep 
RENAME COLUMN total_in_bed_time_milli TO total_in_bed_time_ms;

ALTER TABLE whoop_sleep 
RENAME COLUMN total_awake_time_milli TO total_awake_time_ms;

ALTER TABLE whoop_sleep 
RENAME COLUMN total_no_data_time_milli TO total_no_data_time_ms;

ALTER TABLE whoop_sleep 
RENAME COLUMN total_light_sleep_time_milli TO total_light_sleep_time_ms;

ALTER TABLE whoop_sleep 
RENAME COLUMN total_slow_wave_sleep_time_milli TO total_slow_wave_sleep_time_ms;

ALTER TABLE whoop_sleep 
RENAME COLUMN total_rem_sleep_time_milli TO total_rem_sleep_time_ms;

-- Sleep need columns
ALTER TABLE whoop_sleep 
RENAME COLUMN baseline_milli TO baseline_ms;

ALTER TABLE whoop_sleep 
RENAME COLUMN need_from_sleep_debt_milli TO need_from_sleep_debt_ms;

ALTER TABLE whoop_sleep 
RENAME COLUMN need_from_recent_strain_milli TO need_from_recent_strain_ms;

ALTER TABLE whoop_sleep 
RENAME COLUMN need_from_recent_nap_milli TO need_from_recent_nap_ms;

-- =============================================================================
-- WHOOP RECOVERY TABLE  
-- =============================================================================

-- HRV column
ALTER TABLE whoop_recovery 
RENAME COLUMN hrv_rmssd_milli TO hrv_rmssd_ms;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

-- Update column comments
COMMENT ON COLUMN whoop_sleep.total_in_bed_time_ms IS 'Total time in bed in milliseconds';
COMMENT ON COLUMN whoop_sleep.total_awake_time_ms IS 'Time awake during sleep period in milliseconds';
COMMENT ON COLUMN whoop_sleep.total_no_data_time_ms IS 'Time with no data during sleep period in milliseconds';
COMMENT ON COLUMN whoop_sleep.total_light_sleep_time_ms IS 'Light sleep duration in milliseconds';
COMMENT ON COLUMN whoop_sleep.total_slow_wave_sleep_time_ms IS 'Deep sleep duration in milliseconds';
COMMENT ON COLUMN whoop_sleep.total_rem_sleep_time_ms IS 'REM sleep duration in milliseconds';
COMMENT ON COLUMN whoop_sleep.baseline_ms IS 'Baseline sleep need in milliseconds';
COMMENT ON COLUMN whoop_sleep.need_from_sleep_debt_ms IS 'Additional sleep needed from debt in milliseconds';
COMMENT ON COLUMN whoop_sleep.need_from_recent_strain_ms IS 'Additional sleep needed from recent strain in milliseconds';
COMMENT ON COLUMN whoop_sleep.need_from_recent_nap_ms IS 'Sleep need offset from recent naps in milliseconds';

COMMENT ON COLUMN whoop_recovery.hrv_rmssd_ms IS 'Heart rate variability (RMSSD) in milliseconds';

-- =============================================================================
-- MIGRATION SUMMARY
-- =============================================================================

/*
✅ WHOOP SLEEP TABLE CHANGES:
• total_in_bed_time_milli → total_in_bed_time_ms
• total_awake_time_milli → total_awake_time_ms  
• total_no_data_time_milli → total_no_data_time_ms
• total_light_sleep_time_milli → total_light_sleep_time_ms
• total_slow_wave_sleep_time_milli → total_slow_wave_sleep_time_ms
• total_rem_sleep_time_milli → total_rem_sleep_time_ms
• baseline_milli → baseline_ms
• need_from_sleep_debt_milli → need_from_sleep_debt_ms
• need_from_recent_strain_milli → need_from_recent_strain_ms
• need_from_recent_nap_milli → need_from_recent_nap_ms

✅ WHOOP RECOVERY TABLE CHANGES:
• hrv_rmssd_milli → hrv_rmssd_ms

📝 NOTES:
- Zone columns (zone_*_milli) were already renamed to hr_zone_*_ms in previous migration
- All columns maintain the same data types and constraints
- Comments updated to reflect new naming convention
- This completes the standardization from "_milli" to "_ms" suffix
*/
