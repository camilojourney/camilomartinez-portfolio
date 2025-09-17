#!/usr/bin/env node

// Check data availability for correlation
import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf8');
const databaseUrl = envFile.match(/DATABASE_URL="([^"]+)"/)?.[1];
if (databaseUrl && !process.env.POSTGRES_URL) {
  process.env.POSTGRES_URL = databaseUrl;
}

import { sql } from '../../src/lib/db/db.ts';

async function checkDataAvailability() {
  try {
    console.log('📊 Checking data availability for correlations...\n');
    
    const stravaData = await sql`
      SELECT 
        COUNT(*) as total_runs,
        COUNT(CASE WHEN start_date >= NOW() - INTERVAL '90 days' THEN 1 END) as recent_runs,
        MAX(start_date) as latest_run
      FROM strava_runs
    `;
    
    const whoopData = await sql`
      SELECT 
        COUNT(*) as total_workouts,
        COUNT(CASE WHEN start_time >= NOW() - INTERVAL '90 days' THEN 1 END) as recent_workouts,
        COUNT(CASE WHEN sport_name ILIKE '%run%' AND start_time >= NOW() - INTERVAL '90 days' THEN 1 END) as recent_running,
        MAX(start_time) as latest_workout
      FROM whoop_workouts
    `;
    
    console.log('🏃 Strava Data:');
    console.table(stravaData.rows[0]);
    
    console.log('\n💪 WHOOP Data:');
    console.table(whoopData.rows[0]);
    
    // Check for potential matches
    const potentialMatches = await sql`
      SELECT COUNT(*) as potential_matches
      FROM strava_runs s
      CROSS JOIN whoop_workouts w
      WHERE s.user_id = w.user_id
        AND s.start_date >= NOW() - INTERVAL '90 days'
        AND w.start_time >= NOW() - INTERVAL '90 days'
        AND w.sport_name ILIKE '%run%'
        AND ABS(EXTRACT(EPOCH FROM (s.start_date - w.start_time)) / 60) <= 120
    `;
    
    console.log('\n🔗 Potential Correlations:');
    console.table(potentialMatches.rows[0]);
    
    // Check existing correlations
    const existingCorrelations = await sql`
      SELECT COUNT(*) as existing_correlations
      FROM activity_correlations
    `;
    
    console.log('\n✅ Existing Correlations:');
    console.table(existingCorrelations.rows[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDataAvailability();
