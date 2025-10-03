#!/usr/bin/env node
// 📂 scripts/data/strava-weekly-sync-clean.js
/**
 * 🔄 STREAMLINED WEEKLY STRAVA SYNC
 * 
 * This script:
 * ✅ Uses proven pagination to fetch new activities
 * ✅ Focuses only on recent activities (last 7 days) for efficiency
 * ✅ Handles rate limiting with delays
 * ✅ Updates existing activities with detailed polylines and splits
 * 
 * Usage:
 *   node scripts/data/strava-weekly-sync-clean.js
 */

require('dotenv').config({ path: '.env' });
const { sql } = require('@vercel/postgres');

// Helper function to upsert splits data
async function upsertStravaSplits(runId, splitsMetric, splitsStandard) {
  try {
    // Clear existing splits for this run first
    await sql`DELETE FROM strava_run_splits WHERE strava_run_id = ${runId}`;

    let totalSplitsInserted = 0;

    // Insert metric splits
    if (splitsMetric && splitsMetric.length > 0) {
      for (const [index, split] of splitsMetric.entries()) {
        await sql`
          INSERT INTO strava_run_splits (
            strava_run_id,
            split_number,
            split_type,
            distance_meters,
            elapsed_time_seconds,
            moving_time_seconds,
            elevation_difference_meters,
            average_speed_mps,
            average_grade_adjusted_speed,
            pace_zone
          ) VALUES (
            ${runId},
            ${index + 1},
            'metric',
            ${split.distance || null},
            ${split.elapsed_time || null},
            ${split.moving_time || null},
            ${split.elevation_difference || null},
            ${split.average_speed || null},
            ${split.average_grade_adjusted_speed || null},
            ${split.pace_zone || null}
          )
        `;
        totalSplitsInserted++;
      }
    }

    // Insert standard splits
    if (splitsStandard && splitsStandard.length > 0) {
      for (const [index, split] of splitsStandard.entries()) {
        await sql`
          INSERT INTO strava_run_splits (
            strava_run_id,
            split_number,
            split_type,
            distance_meters,
            elapsed_time_seconds,
            moving_time_seconds,
            elevation_difference_meters,
            average_speed_mps,
            average_grade_adjusted_speed,
            pace_zone
          ) VALUES (
            ${runId},
            ${index + 1},
            'standard',
            ${split.distance || null},
            ${split.elapsed_time || null},
            ${split.moving_time || null},
            ${split.elevation_difference || null},
            ${split.average_speed || null},
            ${split.average_grade_adjusted_speed || null},
            ${split.pace_zone || null}
          )
        `;
        totalSplitsInserted++;
      }
    }

    if (totalSplitsInserted > 0) {
      console.log(`        📊 Inserted ${totalSplitsInserted} splits (${splitsMetric?.length || 0} metric, ${splitsStandard?.length || 0} standard)`);
    }
  } catch (error) {
    console.error(`        ❌ Error upserting splits for run ${runId}:`, error.message);
  }
}

async function weeklyStravaSync() {
  console.log('🔄 Weekly Strava Sync Starting...');
  console.log('=================================\n');

  try {
    // Step 1: Get user tokens
    console.log('1️⃣ Getting Strava authentication...');
    const userResult = await sql`
      SELECT id, username, first_name, last_name, access_token, refresh_token
      FROM strava_users 
      WHERE access_token IS NOT NULL 
      ORDER BY id 
      LIMIT 1
    `;

    if (userResult.rows.length === 0) {
      console.log('❌ No users with Strava tokens found');
      return;
    }

    const user = userResult.rows[0];
    console.log(`   ✅ User: ${user.username || `${user.first_name} ${user.last_name}`}`);

    // Step 2: Get timestamp for recent activities (last 7 days)
    const sevenDaysAgo = Math.floor((Date.now() - (7 * 24 * 60 * 60 * 1000)) / 1000);
    console.log(`\n2️⃣ Fetching activities since: ${new Date(sevenDaysAgo * 1000).toDateString()}`);
    
    const STRAVA_API_BASE = 'https://www.strava.com/api/v3';
    const PER_PAGE = 50;
    let page = 1;
    let allNewActivities = [];
    let totalFetched = 0;
    
    while (true) {
      console.log(`   📄 Fetching page ${page} (${PER_PAGE} activities per page)...`);
      
      try {
        const response = await fetch(`${STRAVA_API_BASE}/athlete/activities?per_page=${PER_PAGE}&page=${page}&after=${sevenDaysAgo}`, {
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            console.log('      🔄 Token expired, refreshing...');
            const newToken = await refreshToken(user);
            if (newToken) {
              // Retry with new token
              const retryResponse = await fetch(`${STRAVA_API_BASE}/athlete/activities?per_page=${PER_PAGE}&page=${page}&after=${sevenDaysAgo}`, {
                headers: {
                  'Authorization': `Bearer ${newToken}`,
                  'Accept': 'application/json',
                },
              });
              
              if (!retryResponse.ok) {
                console.log(`      ❌ Retry failed: ${retryResponse.status}`);
                break;
              }
              
              const activities = await retryResponse.json();
              if (activities.length === 0) {
                console.log(`      ✅ No more activities (page ${page} empty)`);
                break;
              }
              
              allNewActivities.push(...activities);
              totalFetched += activities.length;
              console.log(`      📊 Got ${activities.length} activities (total: ${totalFetched})`);
            } else {
              console.log('      ❌ Token refresh failed');
              break;
            }
          } else {
            console.log(`      ❌ API call failed: ${response.status} ${response.statusText}`);
            break;
          }
        } else {
          const activities = await response.json();
          
          if (activities.length === 0) {
            console.log(`      ✅ No more activities (page ${page} empty)`);
            break;
          }
          
          allNewActivities.push(...activities);
          totalFetched += activities.length;
          console.log(`      📊 Got ${activities.length} activities (total: ${totalFetched})`);
        }
        
        page++;
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (page > 5) {
          console.log('      ⚠️  Reached page limit (5) for weekly sync');
          break;
        }
        
      } catch (error) {
        console.log(`      ❌ Error on page ${page}: ${error.message}`);
        break;
      }
    }

    console.log(`\n📊 Total new activities fetched: ${allNewActivities.length}`);

    // Step 3: Filter for running activities
    console.log('\n3️⃣ Filtering for running activities...');
    
    const newRunningActivities = allNewActivities.filter(activity => 
      activity.sport_type === 'Run' || 
      activity.sport_type === 'TrailRun' || 
      activity.type === 'Run'
    );
    
    console.log(`   🏃 Found ${newRunningActivities.length} new running activities`);
    
    if (newRunningActivities.length === 0) {
      console.log('\n✅ No new running activities found. Weekly sync complete!');
      return;
    }

    // Step 4: Fetch detailed data for new running activities
    console.log('\n4️⃣ Fetching detailed data for new running activities...');
    
    const detailedActivities = [];
    for (let i = 0; i < newRunningActivities.length; i++) {
      const activity = newRunningActivities[i];
      
      try {
        console.log(`      📄 Fetching details ${i + 1}/${newRunningActivities.length} (ID: ${activity.id})...`);
        
        const detailResponse = await fetch(`${STRAVA_API_BASE}/activities/${activity.id}`, {
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'Accept': 'application/json',
          },
        });

        if (detailResponse.ok) {
          const detailedActivity = await detailResponse.json();
          detailedActivities.push(detailedActivity);
          console.log(`        ✅ Got detailed data (${detailedActivity.map?.polyline ? 'with detailed polyline' : 'summary only'})`);
        } else if (detailResponse.status === 429) {
          console.log('      ⏳ Rate limit exceeded! Stopping to prevent data corruption.');
          console.log(`      📊 Progress: ${i}/${newRunningActivities.length} activities processed.`);
          break;
        } else {
          console.log(`        ❌ API call failed: ${detailResponse.status}, using basic data`);
          detailedActivities.push(activity);
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.warn(`      ⚠️  Failed to fetch details for activity ${activity.id}:`, error.message);
        detailedActivities.push(activity);
      }
    }

    console.log(`   ✅ Retrieved detailed data for ${detailedActivities.length} activities`);

    // Step 5: Process and store activities
    console.log('\n5️⃣ Processing and storing activities...');
    
    let newActivities = 0;
    let updatedActivities = 0;
    
    for (const activity of detailedActivities) {
      try {
        const existingResult = await sql`
          SELECT id FROM strava_runs WHERE id = ${activity.id}
        `;
        
        let startPoint = null;
        let endPoint = null;
        if (activity.start_latlng && activity.start_latlng.length === 2) {
          startPoint = `(${activity.start_latlng[1]}, ${activity.start_latlng[0]})`;
        }
        if (activity.end_latlng && activity.end_latlng.length === 2) {
          endPoint = `(${activity.end_latlng[1]}, ${activity.end_latlng[0]})`;
        }

        if (existingResult.rows.length === 0) {
          await sql`
            INSERT INTO strava_runs (
              id, user_id, name, sport_type, start_date, start_date_local,
              distance_meters, elapsed_time_seconds, utc_offset_seconds,
              total_elevation_gain, elev_high, elev_low,
              average_speed_mps, max_speed_mps, suffer_score, perceived_exertion,
              start_latlng, end_latlng, summary_polyline, detailed_polyline,
              private_note, created_at, updated_at
            ) VALUES (
              ${activity.id}, ${user.id}, ${activity.name}, ${activity.sport_type || activity.type},
              ${activity.start_date}, ${activity.start_date_local},
              ${activity.distance || null}, ${activity.elapsed_time || null}, ${activity.utc_offset || null},
              ${activity.total_elevation_gain || null}, ${activity.elev_high || null}, ${activity.elev_low || null},
              ${activity.average_speed || null}, ${activity.max_speed || null}, 
              ${activity.suffer_score || null}, ${activity.perceived_exertion || null},
              ${startPoint}, ${endPoint}, 
              ${activity.map?.summary_polyline || null}, 
              ${activity.map?.polyline || activity.map?.summary_polyline || null},
              ${activity.private_note || activity.description || null}, NOW(), NOW()
            )
          `;
          newActivities++;
          console.log(`      ➕ Added: ${activity.name} (${activity.map?.polyline ? 'with detailed polyline' : 'summary only'})`);
        } else {
          await sql`
            UPDATE strava_runs 
            SET 
              name = ${activity.name},
              sport_type = ${activity.sport_type || activity.type},
              summary_polyline = ${activity.map?.summary_polyline || null},
              detailed_polyline = ${activity.map?.polyline || activity.map?.summary_polyline || null},
              updated_at = NOW()
            WHERE id = ${activity.id}
          `;
          updatedActivities++;
          console.log(`      🔄 Updated: ${activity.name} (${activity.map?.polyline ? 'with detailed polyline' : 'summary only'})`);
        }

        // Process splits data if available
        if (activity.splits_metric || activity.splits_standard) {
          await upsertStravaSplits(activity.id, activity.splits_metric, activity.splits_standard);
        }
        
      } catch (error) {
        console.log(`      ❌ Error processing activity ${activity.id}: ${error.message}`);
      }
    }

    // Step 6: Show final results
    console.log('\n6️⃣ Weekly Sync Results:');
    console.log('========================');
    console.log(`   ➕ New activities added: ${newActivities}`);
    console.log(`   🔄 Existing activities updated: ${updatedActivities}`);
    console.log(`   📊 Total processed: ${newActivities + updatedActivities}`);
    
    const finalCount = await sql`SELECT COUNT(*) as total FROM strava_runs`;
    console.log(`   📊 Total activities in database: ${finalCount.rows[0].total}`);
    
    const polylineCount = await sql`SELECT COUNT(*) as with_polylines FROM strava_runs WHERE detailed_polyline IS NOT NULL`;
    console.log(`   🗺️  Activities with detailed polylines: ${polylineCount.rows[0].with_polylines}`);
    
    const splitsCount = await sql`SELECT COUNT(DISTINCT strava_run_id) as with_splits FROM strava_run_splits`;
    console.log(`   📊 Activities with splits data: ${splitsCount.rows[0].with_splits}`);
    
    console.log('\n✅ Weekly Strava sync completed successfully!');
    console.log('🗺️  New activities include detailed polylines and splits for analysis');

  } catch (error) {
    console.error('❌ Weekly sync failed:', error);
    process.exit(1);
  }
}

// Helper function to refresh token
async function refreshToken(user) {
  try {
    const refreshResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: user.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (refreshResponse.ok) {
      const tokenData = await refreshResponse.json();
      
      await sql`
        UPDATE strava_users 
        SET 
          access_token = ${tokenData.access_token},
          refresh_token = ${tokenData.refresh_token},
          token_expires_at = ${new Date(tokenData.expires_at * 1000).toISOString()},
          updated_at = NOW()
        WHERE id = ${user.id}
      `;
      
      console.log('      ✅ Token refreshed successfully');
      return tokenData.access_token;
    } else {
      console.log('      ❌ Token refresh failed');
      return null;
    }
  } catch (error) {
    console.log(`      ❌ Token refresh error: ${error.message}`);
    return null;
  }
}

/**
 * Simple Activity Correlation
 * Matches Strava runs with WHOOP workouts based on date and hour
 */

const { Pool } = require('pg');
// dotenv already loaded at the top of the file

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
      // Calculate time difference in minutes properly
      const stravaTime = new Date(m.strava_time);
      const whoopTime = new Date(m.whoop_time);
      
      // Get difference in milliseconds, convert to minutes and round to nearest minute
      const diffMs = Math.abs(whoopTime - stravaTime);
      const timeDiffMinutes = Math.round(diffMs / 1000 / 60);
      
      console.log(`DEBUG: Strava time: ${stravaTime.toISOString()}, WHOOP time: ${whoopTime.toISOString()}, diff: ${timeDiffMinutes} minutes`);
      
      return `(${m.strava_id}, '${m.whoop_id}', ${timeDiffMinutes}, ${m.strava_distance}, ${m.whoop_distance})`;
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

    // Show matches with time differences
    console.log('\n📊 Matched Activities:');
    console.table(matches.rows.map(m => {
      const stravaTime = new Date(m.strava_time);
      const whoopTime = new Date(m.whoop_time);
      const diffMs = Math.abs(whoopTime - stravaTime);
      const timeDiffMinutes = Math.round(diffMs / 1000 / 60);
      
      return {
        'Strava Time': stravaTime.toLocaleString(),
        'WHOOP Time': whoopTime.toLocaleString(),
        'Diff (mins)': timeDiffMinutes,
        'Strava Dist (km)': (m.strava_distance / 1000).toFixed(2),
        'WHOOP Dist (km)': (m.whoop_distance / 1000).toFixed(2)
      };
    }));
  }
}

// Main function to run everything in sequence
async function main() {
  try {
    // First, run the weekly Strava sync
    console.log('▶️ STEP 1: RUNNING WEEKLY STRAVA SYNC');
    console.log('====================================\n');
    await weeklyStravaSync();
    
    console.log('\n\n▶️ STEP 2: FINDING ACTIVITY CORRELATIONS');
    console.log('====================================\n');
    // Then run the correlation after sync completes
    await correlateActivities();
    
    console.log('\n✅ Complete script execution finished successfully!');
  } catch (error) {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);