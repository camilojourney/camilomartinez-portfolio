#!/usr/bin/env node
/**
 * Simple Activity Correlation
 * Matches Strava runs with WHOOP workouts based on date and hour
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function correlateActivities() {
  console.log('🔄 Finding activity correlations...');
  
  // First, check what we have
  const stravaCount = await pool.query('SELECT COUNT(*) FROM strava_runs');
  const whoopCount = await pool.query('SELECT COUNT(*) FROM whoop_workouts');
  
  console.log(`📊 Found ${stravaCount.rows[0].count} Strava runs`);
  console.log(`📊 Found ${whoopCount.rows[0].count} WHOOP workouts`);

  // Find matches by date and hour
  const query = `
    SELECT
      s.id as strava_id,
      w.id as whoop_id,
      s.distance_meters as strava_distance, 
      s.start_date as strava_time,
      w.start_time as whoop_time, 
      w.distance_meters as whoop_distance
    FROM
      strava_runs AS s
    JOIN
      whoop_workouts AS w ON s.start_date::date = w.start_time::date
      AND EXTRACT(HOUR FROM s.start_date) = EXTRACT(HOUR FROM w.start_time)
    ORDER BY
      w.start_time DESC
  `;

  const matches = await pool.query(query);
  console.log(`\n✨ Found ${matches.rows.length} matching activities!`);

  // Save correlations
  if (matches.rows.length > 0) {
    const values = matches.rows.map(m => {
      // Calculate time difference in minutes
      const timeDiff = Math.abs((new Date(m.whoop_time) - new Date(m.strava_time)) / 1000 / 60);
      
      return `(${m.strava_id}, '${m.whoop_id}', ${timeDiff}, ${m.strava_distance}, ${m.whoop_distance})`;
    }).join(',');

    const insertQuery = `
      INSERT INTO activity_correlations (
        strava_run_id, 
        whoop_workout_id, 
        time_diff_minutes,
        strava_distance_meters,
        whoop_distance_meters
      )
      VALUES ${values}
      ON CONFLICT (strava_run_id, whoop_workout_id) DO UPDATE SET
        time_diff_minutes = EXCLUDED.time_diff_minutes,
        strava_distance_meters = EXCLUDED.strava_distance_meters,
        whoop_distance_meters = EXCLUDED.whoop_distance_meters,
        updated_at = NOW()
    `;

    await pool.query(insertQuery);
    console.log('✅ Saved correlations to database');

    // Show matches
    console.log('\n📊 Matched Activities:');
    console.table(matches.rows.map(m => ({
      'Strava Time': new Date(m.strava_time).toLocaleString(),
      'WHOOP Time': new Date(m.whoop_time).toLocaleString(),
      'Strava Distance (km)': (m.strava_distance / 1000).toFixed(2),
      'WHOOP Distance (km)': (m.whoop_distance / 1000).toFixed(2)
    })));
  }
}

// Run it
correlateActivities().catch(console.error);