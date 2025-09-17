#!/usr/bin/env node

// Simple query to see correlations
import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf8');
const databaseUrl = envFile.match(/DATABASE_URL="([^"]+)"/)?.[1];
if (databaseUrl && !process.env.POSTGRES_URL) {
  process.env.POSTGRES_URL = databaseUrl;
}

import { sql } from '../../src/lib/db/db.ts';

async function showCorrelations() {
  try {
    const userResult = await sql`SELECT DISTINCT user_id FROM activity_correlations`;
    const userId = userResult.rows[0]?.user_id;
    
    console.log(`🔍 Showing correlations for user ${userId}:\n`);
    
    const result = await sql`
      SELECT 
        sr.name as strava_name,
        (sr.distance_meters/1000)::numeric(5,2) as strava_km,
        TO_CHAR(sr.start_date, 'YYYY-MM-DD HH24:MI') as strava_start,
        ww.sport_name as whoop_sport,
        ww.strain::numeric(5,2) as whoop_strain,
        ww.average_heart_rate,
        (COALESCE(ww.distance_meter/1000, 0))::numeric(5,2) as whoop_km,
        TO_CHAR(ww.start_time, 'YYYY-MM-DD HH24:MI') as whoop_start,
        ac.correlation_confidence::numeric(3,2) as confidence,
        ac.correlation_method as method,
        ac.time_diff_minutes as time_diff_min
      FROM activity_correlations ac
      JOIN strava_runs sr ON ac.strava_run_id = sr.id
      JOIN whoop_workouts ww ON ac.whoop_workout_id = ww.id
      ORDER BY sr.start_date DESC
    `;
    
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

showCorrelations();
