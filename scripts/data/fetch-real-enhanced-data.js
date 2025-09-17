#!/usr/bin/env node
// 📂 fetch-real-enhanced-data.js
/**
 * Fetch REAL enhanced data from Strava API for existing activities
 * This script calls the actua    console.log('4️⃣ Results summary:');
    const summaryResult = await sql`
      SELECT 
        COUNT(*) as total_runs,
        COUNT(suffer_score) as with_suffer_scores,
        COUNT(average_speed_mps) as with_speed_data,
        COUNT(total_elevation_gain) as with_elevation_data
      FROM strava_runs
    `;
    
    const splits = await sql`SELECT COUNT(*) as total_splits FROM strava_run_splits`;
    
    const summary = summaryResult.rows[0];
    console.log(`   📊 Total runs: ${summary.total_runs}`);
    console.log(`   💪 With suffer scores: ${summary.with_suffer_scores}`);
    console.log(`   🏃 With speed data: ${summary.with_speed_data}`);
    console.log(`   🏔️ With elevation data: ${summary.with_elevation_data}`);
    console.log(`   📈 Total splits: ${splits.rows[0].total_splits}`);
    
    // Show sample of recent enhanced data
    console.log('\n📋 Sample of enhanced data (last 5 activities):');
    const sampleData = await sql`
      SELECT name, start_date, suffer_score, average_speed_mps, total_elevation_gain
      FROM strava_runs 
      WHERE suffer_score IS NOT NULL
      ORDER BY start_date DESC
      LIMIT 5
    `;
    
    sampleData.rows.forEach(run => {
      console.log(`   🏃 ${run.name}: suffer=${run.suffer_score}, speed=${run.average_speed_mps?.toFixed(2)}m/s, elevation=${run.total_elevation_gain}m`);
    });t detailed activity information
 */

require('dotenv').config({ path: '.env' });
const { sql } = require('@vercel/postgres');

// Import the Strava client (we'll need to handle TypeScript import)
async function fetchRealEnhancedData() {
  console.log('🚀 Fetching REAL Enhanced Data from Strava API...\n');

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

    // Check database schema first
    console.log('\n🔍 Verifying database schema...');
    const schemaCheck = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'strava_runs' 
      AND column_name IN ('suffer_score', 'perceived_exertion', 'average_speed_mps', 'total_elevation_gain', 'elev_high', 'elev_low')
      ORDER BY column_name
    `;
    
    console.log('   📋 Enhanced fields available:');
    schemaCheck.rows.forEach(col => {
      console.log(`      ✅ ${col.column_name} (${col.data_type})`);
    });
    
    if (schemaCheck.rows.length === 0) {
      console.log('   ❌ ERROR: No enhanced fields found in database schema!');
      console.log('   ❌ The strava_runs table may not have the enhanced columns.');
      console.log('   ❌ You may need to run database migrations first.');
      return;
    }

    // Step 2: Get activities that need enhanced data
    console.log('\n2️⃣ Finding activities needing enhanced data...');
    const activitiesResult = await sql`
      SELECT id, name, start_date, distance_meters
      FROM strava_runs 
      WHERE suffer_score IS NULL
      ORDER BY start_date DESC
      LIMIT 3
    `;

    console.log(`   📋 Found ${activitiesResult.rows.length} activities to enhance:`);
    activitiesResult.rows.forEach(activity => {
      console.log(`      🏃 ${activity.name} (ID: ${activity.id})`);
    });

    // Step 3: Fetch enhanced data from Strava API
    console.log('\n3️⃣ Calling Strava API for enhanced data...');
    
    const STRAVA_API_BASE = 'https://www.strava.com/api/v3';
    
    for (const activity of activitiesResult.rows) {
      console.log(`\n   🔍 Fetching details for: ${activity.name}`);
      
      try {
        // Call Strava API for detailed activity data
        const response = await fetch(`${STRAVA_API_BASE}/activities/${activity.id}`, {
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          console.log(`      ❌ API call failed: ${response.status} ${response.statusText}`);
          
          // Check if it's a token issue
          if (response.status === 401) {
            console.log('      🔄 Trying to refresh token...');
            
            // Try to refresh token
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
              console.log('      ✅ Token refreshed successfully');
              
              // Update token in database
              await sql`
                UPDATE strava_users 
                SET 
                  access_token = ${tokenData.access_token},
                  refresh_token = ${tokenData.refresh_token},
                  token_expires_at = ${new Date(tokenData.expires_at * 1000).toISOString()},
                  updated_at = NOW()
                WHERE id = ${user.id}
              `;
              
              // Retry the API call with new token
              const retryResponse = await fetch(`${STRAVA_API_BASE}/activities/${activity.id}`, {
                headers: {
                  'Authorization': `Bearer ${tokenData.access_token}`,
                  'Accept': 'application/json',
                },
              });
              
              if (retryResponse.ok) {
                const detailedActivity = await retryResponse.json();
                await processActivityData(activity.id, detailedActivity);
              } else {
                console.log(`      ❌ Retry failed: ${retryResponse.status}`);
              }
            } else {
              console.log('      ❌ Token refresh failed');
            }
          }
          continue;
        }

        const detailedActivity = await response.json();
        await processActivityData(activity.id, detailedActivity);
        
        // Rate limiting: wait 1 second between API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`      ❌ Error: ${error.message}`);
      }
    }

    // Step 4: Show results
    console.log('\n4️⃣ Results summary:');
    const updatedStats = await sql`
      SELECT 
        COUNT(*) as total_runs,
        COUNT(suffer_score) as with_suffer_score,
        COUNT(average_speed_mps) as with_speed,
        COUNT(total_elevation_gain) as with_elevation
      FROM strava_runs
    `;
    
    const stats = updatedStats.rows[0];
    console.log(`   📊 Total runs: ${stats.total_runs}`);
    console.log(`   💪 With suffer scores: ${stats.with_suffer_score}`);
    console.log(`   🏃 With speed data: ${stats.with_speed}`);
    console.log(`   🏔️ With elevation data: ${stats.with_elevation}`);

    const splitsCount = await sql`SELECT COUNT(*) as total_splits FROM strava_run_splits`;
    console.log(`   📈 Total splits: ${splitsCount.rows[0].total_splits}`);

  } catch (error) {
    console.error('❌ Enhanced data fetch failed:', error);
  }
}

// Function to process and store the detailed activity data
async function processActivityData(activityId, detailedActivity) {
  try {
    console.log(`      📊 Processing enhanced data...`);
    console.log(`         Suffer Score: ${detailedActivity.suffer_score || 'N/A'}`);
    console.log(`         Average Speed: ${detailedActivity.average_speed || 'N/A'} m/s`);
    console.log(`         Elevation Gain: ${detailedActivity.total_elevation_gain || 'N/A'}m`);
    console.log(`         Coordinates: ${detailedActivity.start_latlng ? 'Available' : 'Missing'}`);
    console.log(`         Elapsed Time: ${detailedActivity.elapsed_time || 'N/A'}s`);
    console.log(`         Private Note: ${detailedActivity.private_note ? 'Yes' : 'None'}`);
    
    // Handle coordinates if available
    let updateQuery;
    if (detailedActivity.start_latlng && detailedActivity.end_latlng) {
      // Format coordinates as PostgreSQL POINT(longitude, latitude)
      const startPoint = `(${detailedActivity.start_latlng[1]}, ${detailedActivity.start_latlng[0]})`;
      const endPoint = `(${detailedActivity.end_latlng[1]}, ${detailedActivity.end_latlng[0]})`;
      
      console.log(`         Start Point: ${startPoint}`);
      console.log(`         End Point: ${endPoint}`);
      
      updateQuery = sql`
        UPDATE strava_runs 
        SET 
          suffer_score = ${detailedActivity.suffer_score || null},
          perceived_exertion = ${detailedActivity.perceived_exertion || null},
          average_speed_mps = ${detailedActivity.average_speed || null},
          max_speed_mps = ${detailedActivity.max_speed || null},
          total_elevation_gain = ${detailedActivity.total_elevation_gain || null},
          elev_high = ${detailedActivity.elev_high || null},
          elev_low = ${detailedActivity.elev_low || null},
          elapsed_time_seconds = ${detailedActivity.elapsed_time || null},
          utc_offset_seconds = ${detailedActivity.utc_offset || null},
          start_date_local = ${detailedActivity.start_date_local || null},
          private_note = ${detailedActivity.private_note || null},
          start_latlng = ${startPoint},
          end_latlng = ${endPoint},
          updated_at = NOW()
        WHERE id = ${activityId}
      `;
    } else {
      updateQuery = sql`
        UPDATE strava_runs 
        SET 
          suffer_score = ${detailedActivity.suffer_score || null},
          perceived_exertion = ${detailedActivity.perceived_exertion || null},
          average_speed_mps = ${detailedActivity.average_speed || null},
          max_speed_mps = ${detailedActivity.max_speed || null},
          total_elevation_gain = ${detailedActivity.total_elevation_gain || null},
          elev_high = ${detailedActivity.elev_high || null},
          elev_low = ${detailedActivity.elev_low || null},
          elapsed_time_seconds = ${detailedActivity.elapsed_time || null},
          utc_offset_seconds = ${detailedActivity.utc_offset || null},
          start_date_local = ${detailedActivity.start_date_local || null},
          private_note = ${detailedActivity.private_note || null},
          updated_at = NOW()
        WHERE id = ${activityId}
      `;
    }
    
    await updateQuery;

    // Handle splits data if available (both metric and standard)
    const totalSplits = (detailedActivity.splits_metric?.length || 0) + (detailedActivity.splits_standard?.length || 0);
    
    if (totalSplits > 0) {
      console.log(`         Splits: ${detailedActivity.splits_metric?.length || 0} metric, ${detailedActivity.splits_standard?.length || 0} standard`);
      
      // Clear existing splits
      await sql`DELETE FROM strava_run_splits WHERE strava_run_id = ${activityId}`;
      
      // Insert metric splits (1km splits)
      if (detailedActivity.splits_metric && detailedActivity.splits_metric.length > 0) {
        for (const [index, split] of detailedActivity.splits_metric.entries()) {
          await sql`
            INSERT INTO strava_run_splits (
              strava_run_id, split_type, split_number, 
              distance_meters, elapsed_time_seconds, moving_time_seconds,
              elevation_difference_meters, average_speed_mps, 
              average_grade_adjusted_speed, pace_zone
            ) VALUES (
              ${activityId}, 'metric', ${index + 1},
              ${split.distance || 0}, ${split.elapsed_time || 0}, ${split.moving_time || split.elapsed_time || 0},
              ${split.elevation_difference || null}, ${split.average_speed || null},
              ${split.average_grade_adjusted_speed || null}, ${split.pace_zone || null}
            )
          `;
        }
      }
      
      // Insert standard splits (mile splits)
      if (detailedActivity.splits_standard && detailedActivity.splits_standard.length > 0) {
        for (const [index, split] of detailedActivity.splits_standard.entries()) {
          await sql`
            INSERT INTO strava_run_splits (
              strava_run_id, split_type, split_number, 
              distance_meters, elapsed_time_seconds, moving_time_seconds,
              elevation_difference_meters, average_speed_mps,
              average_grade_adjusted_speed, pace_zone
            ) VALUES (
              ${activityId}, 'standard', ${index + 1},
              ${split.distance || 0}, ${split.elapsed_time || 0}, ${split.moving_time || split.elapsed_time || 0},
              ${split.elevation_difference || null}, ${split.average_speed || null},
              ${split.average_grade_adjusted_speed || null}, ${split.pace_zone || null}
            )
          `;
        }
      }
    } else {
      console.log(`         Splits: None available`);
    }

    console.log(`      ✅ Successfully updated activity ${activityId} with enhanced data`);
    
  } catch (error) {
    console.log(`      ❌ Error processing activity ${activityId}: ${error.message}`);
  }
}

fetchRealEnhancedData().catch(console.error);