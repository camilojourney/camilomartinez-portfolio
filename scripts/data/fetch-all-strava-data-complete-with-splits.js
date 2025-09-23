#!/usr/bin/env node
// 📂 scripts/data/fetch-all-strava-data-complete-with-splits.js
/**
 * 🎯 OPTIMIZED STRAVA DATA FETCHER - Fetches missing enhanced Strava data WITH SPLITS
 * 
 * This script:
 * ✅ Handles proper pagination to get ALL activities (not just 20)
 * ✅ SMART OPTIMIZATION: Only fetches detailed data for activities missing detailed polylines/splits
 * ✅ Skips activities that already have complete polyline and splits data
 * ✅ Processes splits data for performance analysis
 * ✅ Reduces API calls by up to 80-90% after initial import
 * ✅ Handles rate limiting with delays
 * ✅ Updates existing activities with available data
 * 
 * Usage:
 *   node scripts/data/fetch-all-strava-data-complete-with-splits.js
 *   
 * Features:
 * - Complete pagination (all pages)
 * - Smart polyline and splits checking
 * - Minimal API calls (only for missing data)
 * - Rate limiting protection
 * - Token refresh handling
 * - Splits data processing (metric and standard)
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
    // Don't throw here - we don't want splits errors to prevent the main run data from being saved
  }
}

async function fetchAllStravaActivities() {
  console.log('🚀 Fetching ALL Strava Activities with Pagination and Splits...\n');

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

    // Step 2: Fetch ALL activities with pagination
    console.log('\n2️⃣ Fetching ALL activities from Strava API...');
    
    const STRAVA_API_BASE = 'https://www.strava.com/api/v3';
    const PER_PAGE = 50;
    let page = 1;
    let allActivities = [];
    let totalFetched = 0;
    
    while (true) {
      console.log(`   📄 Fetching page ${page} (${PER_PAGE} activities per page)...`);
      
      try {
        const response = await fetch(`${STRAVA_API_BASE}/athlete/activities?per_page=${PER_PAGE}&page=${page}&include_all_efforts=true`, {
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
              const retryResponse = await fetch(`${STRAVA_API_BASE}/athlete/activities?per_page=${PER_PAGE}&page=${page}&include_all_efforts=true`, {
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
              
              allActivities.push(...activities);
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
          
          allActivities.push(...activities);
          totalFetched += activities.length;
          console.log(`      📊 Got ${activities.length} activities (total: ${totalFetched})`);
        }
        
        page++;
        
        // Rate limiting: wait 1 second between API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Safety check
        if (page > 20) {
          console.log('      ⚠️  Reached page limit (20) for safety');
          break;
        }
        
      } catch (error) {
        console.log(`      ❌ Error on page ${page}: ${error.message}`);
        break;
      }
    }

    console.log(`\n📊 Total activities fetched: ${allActivities.length}`);

    // Step 3: Check which running activities need detailed data
    console.log('\n3️⃣ Optimizing: Check which activities need detailed data and splits...');
    
    const runningActivities = allActivities.filter(activity => 
      activity.sport_type === 'Run' || 
      activity.sport_type === 'TrailRun' || 
      activity.type === 'Run'
    );
    
    console.log(`   🏃 Found ${runningActivities.length} running activities`);
    
    // Check which activities need detailed data or splits
    console.log('   🔍 Checking database for existing polyline and splits data...');
    
    const activitiesNeedingDetailedData = [];
    const activitiesWithCompleteData = [];
    
    for (const activity of runningActivities) {
      const existingResult = await sql`
        SELECT sr.id, sr.summary_polyline, sr.detailed_polyline,
               COUNT(srs.id) as splits_count
        FROM strava_runs sr
        LEFT JOIN strava_run_splits srs ON sr.id = srs.strava_run_id
        WHERE sr.id = ${activity.id}
        GROUP BY sr.id, sr.summary_polyline, sr.detailed_polyline
      `;
      
      const existing = existingResult.rows[0];
      
      if (!existing) {
        // New activity - needs detailed data
        activitiesNeedingDetailedData.push(activity);
      } else {
        const hasSummary = existing.summary_polyline && existing.summary_polyline.length > 0;
        const hasDetailed = existing.detailed_polyline && existing.detailed_polyline.length > 0;
        const hasSplits = existing.splits_count > 0;
        
        if (!hasSummary || !hasDetailed || !hasSplits) {
          // Missing some data - needs API call
          activitiesNeedingDetailedData.push(activity);
        } else {
          // Has complete data - skip
          activitiesWithCompleteData.push(activity);
        }
      }
    }
    
    console.log(`   ✅ ${activitiesWithCompleteData.length} activities already have complete data (skipping)`);
    console.log(`   📡 ${activitiesNeedingDetailedData.length} activities need detailed data or splits`);
    console.log(`   🎯 API calls reduced by ${Math.round((activitiesWithCompleteData.length / runningActivities.length) * 100)}%`);

    // Process activities that need detailed data
    const detailedActivities = [];
    
    // We'll only process activities that need detailed data
    // Don't add activities that already have complete data to the processing list
    console.log('   ✅ Skipping activities that already have complete data');
    
    // Fetch detailed data for activities that need it
    console.log('\n   📡 Fetching detailed data for activities needing polylines or splits...');
    for (let i = 0; i < activitiesNeedingDetailedData.length; i++) {
      const activity = activitiesNeedingDetailedData[i];
      
      try {
        console.log(`      📄 Fetching details ${i + 1}/${activitiesNeedingDetailedData.length} (ID: ${activity.id})...`);
        
        const detailResponse = await fetch(`${STRAVA_API_BASE}/activities/${activity.id}`, {
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'Accept': 'application/json',
          },
        });

        if (detailResponse.ok) {
          const detailedActivity = await detailResponse.json();
          detailedActivities.push(detailedActivity);
        } else if (detailResponse.status === 401) {
          console.log('      🔄 Token expired, refreshing...');
          const newToken = await refreshToken(user);
          if (newToken) {
            const retryResponse = await fetch(`${STRAVA_API_BASE}/activities/${activity.id}`, {
              headers: {
                'Authorization': `Bearer ${newToken}`,
                'Accept': 'application/json',
              },
            });
            if (retryResponse.ok) {
              const detailedActivity = await retryResponse.json();
              detailedActivities.push(detailedActivity);
            } else {
              console.log('      ❌ Token refresh retry failed - skipping activity to prevent data corruption');
              continue;
            }
          } else {
            console.log('      ❌ Token refresh failed - skipping activity to prevent data corruption');
            continue;
          }
        } else if (detailResponse.status === 429) {
          console.log('      ⏳ Rate limit exceeded! Stopping process to prevent data corruption.');
          console.log('      💡 Run the script again later when rate limit resets.');
          console.log(`      📊 Progress saved: ${i}/${activitiesNeedingDetailedData.length} activities processed.`);
          
          // Stop processing immediately - don't continue with incomplete data
          break;
        } else {
          console.log(`      ❌ API call failed: ${detailResponse.status} ${detailResponse.statusText}`);
          console.log('      ⚠️ Skipping this activity to avoid data corruption');
          // Skip this activity instead of adding it with incomplete data
          continue;
        }
        
        // Rate limiting
        if (i % 5 === 0 && i > 0) {
          console.log(`      ⏱️  Rate limiting: processed ${i} activities, waiting 5 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.warn(`      ⚠️  Failed to fetch details for activity ${activity.id}:`, error.message);
        console.log('      ⚠️ Skipping this activity to avoid data corruption');
        // Skip this activity instead of adding it with incomplete data
        continue;
      }
    }

    console.log(`   ✅ Retrieved detailed data for ${detailedActivities.length} activities`);

    // Step 4: Process and store activities
    console.log('\n4️⃣ Processing and storing activities with splits...');
    
    let newActivities = 0;
    let updatedActivities = 0;
    let processedSplits = 0;
    
    for (const activity of detailedActivities) {
      try {
        // Check if activity already exists
        const existingResult = await sql`
          SELECT id FROM strava_runs WHERE id = ${activity.id}
        `;
        
        // Handle coordinates
        let startPoint = null;
        let endPoint = null;
        if (activity.start_latlng && activity.start_latlng.length === 2) {
          startPoint = `(${activity.start_latlng[1]}, ${activity.start_latlng[0]})`;
        }
        if (activity.end_latlng && activity.end_latlng.length === 2) {
          endPoint = `(${activity.end_latlng[1]}, ${activity.end_latlng[0]})`;
        }

        if (existingResult.rows.length === 0) {
          // Insert new activity
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
              ${activity.map?.polyline || null},
              ${activity.private_note || activity.description || null}, NOW(), NOW()
            )
          `;
          newActivities++;
        } else {
          // Update existing activity
          await sql`
            UPDATE strava_runs 
            SET 
              name = ${activity.name},
              sport_type = ${activity.sport_type || activity.type},
              start_date = ${activity.start_date},
              start_date_local = ${activity.start_date_local},
              distance_meters = ${activity.distance || null},
              elapsed_time_seconds = ${activity.elapsed_time || null},
              utc_offset_seconds = ${activity.utc_offset || null},
              total_elevation_gain = ${activity.total_elevation_gain || null},
              elev_high = ${activity.elev_high || null},
              elev_low = ${activity.elev_low || null},
              average_speed_mps = ${activity.average_speed || null},
              max_speed_mps = ${activity.max_speed || null},
              suffer_score = ${activity.suffer_score || null},
              perceived_exertion = ${activity.perceived_exertion || null},
              start_latlng = ${startPoint},
              end_latlng = ${endPoint},
              summary_polyline = ${activity.map?.summary_polyline || null},
              detailed_polyline = ${activity.map?.polyline || null},
              private_note = ${activity.private_note || activity.description || null},
              updated_at = NOW()
            WHERE id = ${activity.id}
          `;
          updatedActivities++;
        }
        
        // Handle splits data if available
        if (activity.splits_metric || activity.splits_standard) {
          console.log(`      📊 Processing splits for activity ${activity.id}...`);
          await upsertStravaSplits(activity.id, activity.splits_metric, activity.splits_standard);
          processedSplits++;
        }
        
        if ((newActivities + updatedActivities) % 10 === 0) {
          console.log(`      📊 Processed ${newActivities + updatedActivities} activities...`);
        }
        
      } catch (error) {
        console.log(`      ❌ Error processing activity ${activity.id}: ${error.message}`);
      }
    }

    // Step 5: Show final results
    console.log('\n5️⃣ Final Results:');
    console.log(`   ➕ New activities added: ${newActivities}`);
    console.log(`   🔄 Existing activities updated: ${updatedActivities}`);
    console.log(`   📊 Activities with splits processed: ${processedSplits}`);
    
    const finalCount = await sql`SELECT COUNT(*) as total FROM strava_runs`;
    console.log(`   📊 Total activities in database: ${finalCount.rows[0].total}`);
    
    const polylineCount = await sql`SELECT COUNT(*) as with_polylines FROM strava_runs WHERE detailed_polyline IS NOT NULL`;
    console.log(`   🗺️  Activities with detailed polylines: ${polylineCount.rows[0].with_polylines}`);
    
    const splitsCount = await sql`SELECT COUNT(DISTINCT strava_run_id) as with_splits FROM strava_run_splits`;
    console.log(`   📊 Activities with splits data: ${splitsCount.rows[0].with_splits}`);
    
    const totalSplitsCount = await sql`SELECT COUNT(*) as total_splits FROM strava_run_splits`;
    console.log(`   📈 Total splits in database: ${totalSplitsCount.rows[0].total_splits}`);
    
    console.log('\n✅ All Strava activities fetched successfully!');
    console.log('🗺️  Detailed polylines and splits data now available for route and performance analysis');

  } catch (error) {
    console.error('❌ Fetch failed:', error);
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

fetchAllStravaActivities().catch(console.error);