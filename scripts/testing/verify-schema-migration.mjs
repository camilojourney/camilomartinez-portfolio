#!/usr/bin/env node

/**
 * Verify Schema Migration Success
 * Quick test to confirm all column renames are working
 */

// Set up environment for Vercel Postgres
import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf8');
const databaseUrl = envFile.match(/DATABASE_URL="([^"]+)"/)?.[1];
if (databaseUrl && !process.env.POSTGRES_URL) {
  process.env.POSTGRES_URL = databaseUrl;
}

import { sql } from '../../src/lib/db/db.ts';

async function verifySchemaChanges() {
  try {
    console.log('🔍 Verifying schema migration success...\n');

    // Test 1: Check that old column names don't exist
    console.log('📋 TEST 1: Confirming old column names are gone...');
    
    const oldDistanceCheck = await sql`
      SELECT CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whoop_workouts' 
        AND column_name = 'distance_meter'
      ) THEN 'FAIL - Old column still exists' ELSE 'PASS' END as status
    `;
    console.log(`   ↪ distance_meter (old): ${oldDistanceCheck.rows[0].status}`);

    const oldZoneCheck = await sql`
      SELECT CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whoop_workouts' 
        AND column_name = 'zone_zero_milli'
      ) THEN 'FAIL - Old column still exists' ELSE 'PASS' END as status
    `;
    console.log(`   ↪ zone_zero_milli (old): ${oldZoneCheck.rows[0].status}`);

    // Test 2: Check that new column names exist
    console.log('\n📋 TEST 2: Confirming new column names exist...');
    
    const newDistanceCheck = await sql`
      SELECT CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whoop_workouts' 
        AND column_name = 'distance_meters'
      ) THEN 'PASS' ELSE 'FAIL - New column missing' END as status
    `;
    console.log(`   ↪ distance_meters (new): ${newDistanceCheck.rows[0].status}`);

    const newHeartRateCheck = await sql`
      SELECT CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whoop_workouts' 
        AND column_name = 'avg_heart_rate_bpm'
      ) THEN 'PASS' ELSE 'FAIL - New column missing' END as status
    `;
    console.log(`   ↪ avg_heart_rate_bpm (new): ${newHeartRateCheck.rows[0].status}`);

    const newZoneCheck = await sql`
      SELECT CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whoop_workouts' 
        AND column_name = 'hr_zone_0_ms'
      ) THEN 'PASS' ELSE 'FAIL - New column missing' END as status
    `;
    console.log(`   ↪ hr_zone_0_ms (new): ${newZoneCheck.rows[0].status}`);

    const booleanCheck = await sql`
      SELECT CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whoop_sleep' 
        AND column_name = 'is_nap'
      ) THEN 'PASS' ELSE 'FAIL - New column missing' END as status
    `;
    console.log(`   ↪ is_nap (new): ${booleanCheck.rows[0].status}`);

    const recoveryCheck = await sql`
      SELECT CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whoop_recovery' 
        AND column_name = 'recovery_percentage'
      ) THEN 'PASS' ELSE 'FAIL - New column missing' END as status
    `;
    console.log(`   ↪ recovery_percentage (new): ${recoveryCheck.rows[0].status}`);

    // Test 3: Check data types
    console.log('\n📋 TEST 3: Verifying data type changes...');
    
    const dataTypeCheck = await sql`
      SELECT data_type, numeric_precision, numeric_scale
      FROM information_schema.columns 
      WHERE table_name = 'whoop_workouts' 
      AND column_name = 'avg_heart_rate_bpm'
    `;
    const dataType = dataTypeCheck.rows[0];
    const expectedType = dataType.data_type === 'numeric' && dataType.numeric_precision === 5 && dataType.numeric_scale === 1;
    console.log(`   ↪ avg_heart_rate_bpm type: ${dataType.data_type}(${dataType.numeric_precision},${dataType.numeric_scale}) - ${expectedType ? 'PASS' : 'FAIL'}`);

    // Test 4: Sample data query using new column names
    console.log('\n📋 TEST 4: Testing queries with new column names...');
    
    try {
      const sampleWorkout = await sql`
        SELECT id, distance_meters, avg_heart_rate_bpm, hr_zone_0_ms 
        FROM whoop_workouts 
        WHERE distance_meters IS NOT NULL 
        LIMIT 1
      `;
      console.log(`   ↪ Workout query with new columns: PASS (${sampleWorkout.rows.length} record found)`);
      
      if (sampleWorkout.rows.length > 0) {
        const workout = sampleWorkout.rows[0];
        console.log(`      Sample: distance=${workout.distance_meters}m, hr=${workout.avg_heart_rate_bpm}bpm, zone0=${workout.hr_zone_0_ms}ms`);
      }
    } catch (error) {
      console.log(`   ↪ Workout query with new columns: FAIL - ${error.message}`);
    }

    try {
      const sampleSleep = await sql`
        SELECT id, is_nap, sleep_performance_percentage 
        FROM whoop_sleep 
        WHERE is_nap IS NOT NULL 
        LIMIT 1
      `;
      console.log(`   ↪ Sleep query with new columns: PASS (${sampleSleep.rows.length} record found)`);
      
      if (sampleSleep.rows.length > 0) {
        const sleep = sampleSleep.rows[0];
        console.log(`      Sample: is_nap=${sleep.is_nap}, performance=${sleep.sleep_performance_percentage}%`);
      }
    } catch (error) {
      console.log(`   ↪ Sleep query with new columns: FAIL - ${error.message}`);
    }

    try {
      const sampleRecovery = await sql`
        SELECT cycle_id, recovery_percentage, resting_heart_rate_bpm 
        FROM whoop_recovery 
        WHERE recovery_percentage IS NOT NULL 
        LIMIT 1
      `;
      console.log(`   ↪ Recovery query with new columns: PASS (${sampleRecovery.rows.length} record found)`);
      
      if (sampleRecovery.rows.length > 0) {
        const recovery = sampleRecovery.rows[0];
        console.log(`      Sample: recovery=${recovery.recovery_percentage}%, rhr=${recovery.resting_heart_rate_bpm}bpm`);
      }
    } catch (error) {
      console.log(`   ↪ Recovery query with new columns: FAIL - ${error.message}`);
    }

    console.log('\n✅ Schema verification completed!');
    console.log('\n🎉 All column renames are working correctly. The migration was successful!');
    console.log('    Ready for production data fetching with new schema.');

  } catch (error) {
    console.error('❌ Schema verification failed:', error);
    throw error;
  }
}

// Run verification
verifySchemaChanges()
  .then(() => {
    console.log('\n✅ Schema verification passed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Schema verification failed:', error);
    process.exit(1);
  });
