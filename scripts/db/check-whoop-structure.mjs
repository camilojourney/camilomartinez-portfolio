#!/usr/bin/env node

// Quick script to check WHOOP workouts table structure
import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf8');
const databaseUrl = envFile.match(/DATABASE_URL="([^"]+)"/)?.[1];
if (databaseUrl && !process.env.POSTGRES_URL) {
  process.env.POSTGRES_URL = databaseUrl;
}

import { sql } from '../../src/lib/db/db.ts';

async function checkWhoopWorkoutsStructure() {
  try {
    console.log('🔍 Checking WHOOP workouts table structure...');
    
    const columns = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'whoop_workouts' 
      ORDER BY ordinal_position
    `;
    
    console.log('\n📋 whoop_workouts columns:');
    columns.rows.forEach(col => {
      console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? '- nullable' : '- not null'}`);
    });
    
    // Also check if there are any workouts with distance data
    const sampleData = await sql`
      SELECT id, sport_name, start_time, 
             CASE WHEN column_name = 'distance_meters' THEN 'HAS_DISTANCE' ELSE 'NO_DISTANCE' END as distance_check
      FROM whoop_workouts 
      CROSS JOIN information_schema.columns 
      WHERE table_name = 'whoop_workouts' AND column_name = 'distance_meters'
      LIMIT 5
    `;
    
    console.log('\n📊 Sample data check:');
    console.table(sampleData.rows);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkWhoopWorkoutsStructure();
