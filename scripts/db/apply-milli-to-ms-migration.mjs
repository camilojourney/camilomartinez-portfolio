#!/usr/bin/env node
// 📂 scripts/db/apply-milli-to-ms-migration.mjs

/**
 * Apply _milli to _ms standardization migration
 */

import fs from 'fs';
import { sql } from '../../src/lib/db/db.ts';

// Read environment variables
const envFile = fs.readFileSync('.env', 'utf8');
const databaseUrl = envFile.match(/DATABASE_URL="([^"]+)"/)?.[1];
if (databaseUrl && !process.env.POSTGRES_URL) {
  process.env.POSTGRES_URL = databaseUrl;
}

async function applyMilliToMsMigration() {
    try {
        console.log('🔄 Starting _milli to _ms standardization migration...\n');

        // =============================================================================
        // WHOOP SLEEP TABLE UPDATES
        // =============================================================================
        
        console.log('📋 Updating WHOOP Sleep table columns...');
        
        // Sleep timing columns
        await sql`ALTER TABLE whoop_sleep RENAME COLUMN total_in_bed_time_milli TO total_in_bed_time_ms`;
        console.log('  ✅ total_in_bed_time_milli → total_in_bed_time_ms');
        
        await sql`ALTER TABLE whoop_sleep RENAME COLUMN total_awake_time_milli TO total_awake_time_ms`;
        console.log('  ✅ total_awake_time_milli → total_awake_time_ms');
        
        await sql`ALTER TABLE whoop_sleep RENAME COLUMN total_no_data_time_milli TO total_no_data_time_ms`;
        console.log('  ✅ total_no_data_time_milli → total_no_data_time_ms');
        
        await sql`ALTER TABLE whoop_sleep RENAME COLUMN total_light_sleep_time_milli TO total_light_sleep_time_ms`;
        console.log('  ✅ total_light_sleep_time_milli → total_light_sleep_time_ms');
        
        await sql`ALTER TABLE whoop_sleep RENAME COLUMN total_slow_wave_sleep_time_milli TO total_slow_wave_sleep_time_ms`;
        console.log('  ✅ total_slow_wave_sleep_time_milli → total_slow_wave_sleep_time_ms');
        
        await sql`ALTER TABLE whoop_sleep RENAME COLUMN total_rem_sleep_time_milli TO total_rem_sleep_time_ms`;
        console.log('  ✅ total_rem_sleep_time_milli → total_rem_sleep_time_ms');

        // Sleep need columns
        await sql`ALTER TABLE whoop_sleep RENAME COLUMN baseline_milli TO baseline_ms`;
        console.log('  ✅ baseline_milli → baseline_ms');
        
        await sql`ALTER TABLE whoop_sleep RENAME COLUMN need_from_sleep_debt_milli TO need_from_sleep_debt_ms`;
        console.log('  ✅ need_from_sleep_debt_milli → need_from_sleep_debt_ms');
        
        await sql`ALTER TABLE whoop_sleep RENAME COLUMN need_from_recent_strain_milli TO need_from_recent_strain_ms`;
        console.log('  ✅ need_from_recent_strain_milli → need_from_recent_strain_ms');
        
        await sql`ALTER TABLE whoop_sleep RENAME COLUMN need_from_recent_nap_milli TO need_from_recent_nap_ms`;
        console.log('  ✅ need_from_recent_nap_milli → need_from_recent_nap_ms');

        // =============================================================================
        // WHOOP RECOVERY TABLE UPDATES
        // =============================================================================
        
        console.log('\n📋 Updating WHOOP Recovery table columns...');
        
        await sql`ALTER TABLE whoop_recovery RENAME COLUMN hrv_rmssd_milli TO hrv_rmssd_ms`;
        console.log('  ✅ hrv_rmssd_milli → hrv_rmssd_ms');

        // =============================================================================
        // UPDATE COLUMN COMMENTS
        // =============================================================================
        
        console.log('\n📝 Updating column comments...');
        
        await sql`COMMENT ON COLUMN whoop_sleep.total_in_bed_time_ms IS 'Total time in bed in milliseconds'`;
        await sql`COMMENT ON COLUMN whoop_sleep.total_awake_time_ms IS 'Time awake during sleep period in milliseconds'`;
        await sql`COMMENT ON COLUMN whoop_sleep.total_no_data_time_ms IS 'Time with no data during sleep period in milliseconds'`;
        await sql`COMMENT ON COLUMN whoop_sleep.total_light_sleep_time_ms IS 'Light sleep duration in milliseconds'`;
        await sql`COMMENT ON COLUMN whoop_sleep.total_slow_wave_sleep_time_ms IS 'Deep sleep duration in milliseconds'`;
        await sql`COMMENT ON COLUMN whoop_sleep.total_rem_sleep_time_ms IS 'REM sleep duration in milliseconds'`;
        await sql`COMMENT ON COLUMN whoop_sleep.baseline_ms IS 'Baseline sleep need in milliseconds'`;
        await sql`COMMENT ON COLUMN whoop_sleep.need_from_sleep_debt_ms IS 'Additional sleep needed from debt in milliseconds'`;
        await sql`COMMENT ON COLUMN whoop_sleep.need_from_recent_strain_ms IS 'Additional sleep needed from recent strain in milliseconds'`;
        await sql`COMMENT ON COLUMN whoop_sleep.need_from_recent_nap_ms IS 'Sleep need offset from recent naps in milliseconds'`;
        await sql`COMMENT ON COLUMN whoop_recovery.hrv_rmssd_ms IS 'Heart rate variability (RMSSD) in milliseconds'`;
        
        console.log('  ✅ All column comments updated');

        console.log('\n🎉 Migration completed successfully!');
        console.log('\n📊 SUMMARY:');
        console.log('• Sleep table: 10 columns renamed from _milli to _ms');
        console.log('• Recovery table: 1 column renamed from _milli to _ms');
        console.log('• All column comments updated');
        console.log('• Zone columns were already standardized in previous migration');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Run the migration
applyMilliToMsMigration()
    .then(() => {
        console.log('\n✅ _milli to _ms migration complete!');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Migration failed:', error);
        process.exit(1);
    });
