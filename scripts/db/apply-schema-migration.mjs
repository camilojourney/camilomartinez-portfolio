#!/usr/bin/env node

/**
 * Apply Schema Standardization Migration
 * September 16, 2025
 */

// Set up environment for Vercel Postgres
import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf8');
const databaseUrl = envFile.match(/DATABASE_URL="([^"]+)"/)?.[1];
if (databaseUrl && !process.env.POSTGRES_URL) {
  process.env.POSTGRES_URL = databaseUrl;
}

import { sql } from '../../src/lib/db/db.ts';

async function applyMigration() {
  try {
    console.log('🚀 Applying Schema Standardization Migration...\n');

    // Phase 1: Critical fixes
    console.log('📋 PHASE 1: Critical Fixes');
    
    console.log('  ↪ Renaming distance_meter to distance_meters...');
    await sql`ALTER TABLE whoop_workouts RENAME COLUMN distance_meter TO distance_meters`;
    
    console.log('  ↪ Updating heart rate data types to numeric(5,1)...');
    await sql`ALTER TABLE whoop_workouts ALTER COLUMN average_heart_rate TYPE numeric(5,1)`;
    await sql`ALTER TABLE whoop_workouts ALTER COLUMN max_heart_rate TYPE numeric(5,1)`;
    await sql`ALTER TABLE whoop_cycles ALTER COLUMN average_heart_rate TYPE numeric(5,1)`;
    await sql`ALTER TABLE whoop_cycles ALTER COLUMN max_heart_rate TYPE numeric(5,1)`;

    // Phase 2: Naming improvements
    console.log('\n📋 PHASE 2: Naming Improvements');
    
    console.log('  ↪ Adding _bpm suffix to heart rate columns...');
    await sql`ALTER TABLE whoop_recovery RENAME COLUMN resting_heart_rate TO resting_heart_rate_bpm`;
    await sql`ALTER TABLE whoop_workouts RENAME COLUMN average_heart_rate TO avg_heart_rate_bpm`;
    await sql`ALTER TABLE whoop_workouts RENAME COLUMN max_heart_rate TO max_heart_rate_bpm`;
    await sql`ALTER TABLE whoop_cycles RENAME COLUMN average_heart_rate TO avg_heart_rate_bpm`;
    await sql`ALTER TABLE whoop_cycles RENAME COLUMN max_heart_rate TO max_heart_rate_bpm`;

    console.log('  ↪ Improving zone column naming...');
    await sql`ALTER TABLE whoop_workouts RENAME COLUMN zone_zero_milli TO hr_zone_0_ms`;
    await sql`ALTER TABLE whoop_workouts RENAME COLUMN zone_one_milli TO hr_zone_1_ms`;
    await sql`ALTER TABLE whoop_workouts RENAME COLUMN zone_two_milli TO hr_zone_2_ms`;
    await sql`ALTER TABLE whoop_workouts RENAME COLUMN zone_three_milli TO hr_zone_3_ms`;
    await sql`ALTER TABLE whoop_workouts RENAME COLUMN zone_four_milli TO hr_zone_4_ms`;
    await sql`ALTER TABLE whoop_workouts RENAME COLUMN zone_five_milli TO hr_zone_5_ms`;

    // Phase 3: Boolean and percentage consistency
    console.log('\n📋 PHASE 3: Boolean and Percentage Consistency');
    
    console.log('  ↪ Renaming boolean fields...');
    await sql`ALTER TABLE whoop_sleep RENAME COLUMN nap TO is_nap`;
    
    console.log('  ↪ Standardizing percentage naming...');
    await sql`ALTER TABLE whoop_recovery RENAME COLUMN recovery_score TO recovery_percentage`;

    // Validation
    console.log('\n✅ VALIDATION CHECKS:');
    
    const distanceCheck = await sql`
      SELECT CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whoop_workouts' 
        AND column_name = 'distance_meters'
      ) THEN 'PASS' ELSE 'FAIL' END as status
    `;
    console.log(`  ↪ Distance column rename: ${distanceCheck.rows[0].status}`);

    const heartRateCheck = await sql`
      SELECT CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whoop_workouts' 
        AND column_name = 'avg_heart_rate_bpm'
      ) THEN 'PASS' ELSE 'FAIL' END as status
    `;
    console.log(`  ↪ Heart rate BPM naming: ${heartRateCheck.rows[0].status}`);

    const zoneCheck = await sql`
      SELECT CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whoop_workouts' 
        AND column_name = 'hr_zone_0_ms'
      ) THEN 'PASS' ELSE 'FAIL' END as status
    `;
    console.log(`  ↪ Heart rate zone naming: ${zoneCheck.rows[0].status}`);

    const booleanCheck = await sql`
      SELECT CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whoop_sleep' 
        AND column_name = 'is_nap'
      ) THEN 'PASS' ELSE 'FAIL' END as status
    `;
    console.log(`  ↪ Boolean field naming: ${booleanCheck.rows[0].status}`);

    console.log('\n🎉 Schema standardization migration completed successfully!');
    console.log('\n📝 SUMMARY OF CHANGES:');
    console.log('  ✅ distance_meter → distance_meters');
    console.log('  ✅ Heart rate columns → *_heart_rate_bpm');
    console.log('  ✅ Heart rate data types → numeric(5,1)');
    console.log('  ✅ Zone columns → hr_zone_*_ms');
    console.log('  ✅ nap → is_nap');
    console.log('  ✅ recovery_score → recovery_percentage');
    console.log('  ❌ v1_id renames (excluded as requested)');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
applyMigration()
  .then(() => {
    console.log('\n✅ Migration script completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });
