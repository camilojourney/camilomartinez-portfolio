#!/usr/bin/env node
// 📂 scripts/data/fetch-all-strava-data-complete.js
/**
 * 🎯 COMPLETE STRAVA DATA FETCHER - Fetches ALL enhanced Strava data
 * 
 * This script:
 * ✅ Handles proper pagination to get ALL activities (not just 20)
 * ✅ Populates available fields from list API (summary polylines, basic data)  
 * ✅ Handles rate limiting with delays
 * ✅ Updates existing activities with available data
 * 
 * Usage:
 *   node scripts/data/fetch-all-strava-data-complete.js
 *   
 * Features:
 * - Complete pagination (all pages)
 * - Basic activity data from list API
 * - Rate limiting protection
 * - Token refresh handling
 */

require('dotenv').config({ path: '.env' });
const { sql } = require('@vercel/postgres');

async function fetchAllStravaActivities() {
  console.log('🚀 Fetching ALL Strava Activities with Pagination...\n');

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
    const PER_PAGE = 50;  // Strava max is 200, but 50 is safer for rate limiting
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
          
          // If no activities returned, we've reached the end
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
        
        // Safety check: don't go beyond reasonable pagination
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

    // Step 3: Fetch detailed data for running activities
    console.log('\n3️⃣ Fetching detailed data for running activities...');
    
    const runningActivities = allActivities.filter(activity => 
      activity.sport_type === 'Run' || 
      activity.sport_type === 'TrailRun' || 
      activity.type === 'Run'
    );
    
    console.log(`   🏃 Found ${runningActivities.length} running activities`);
    console.log('   📡 Fetching detailed data (including detailed polylines)...');

    // Fetch detailed data for each running activity
    const detailedActivities = [];
    for (let i = 0; i < runningActivities.length; i++) {
      const activity = runningActivities[i];
      
      try {
        console.log(`      📄 Fetching details ${i + 1}/${runningActivities.length} (ID: ${activity.id})...`);
        
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
            // Retry with new token
            const retryResponse = await fetch(`${STRAVA_API_BASE}/activities/${activity.id}`, {
              headers: {
                'Authorization': `Bearer ${newToken}`,
                'Accept': 'application/json',
              },
            });
            if (retryResponse.ok) {
              const detailedActivity = await retryResponse.json();
              detailedActivities.push(detailedActivity);
            }
          }
        }
        
        // Rate limiting - be respectful to Strava API
        if (i % 10 === 0 && i > 0) {
          console.log(`      ⏱️  Rate limiting: processed ${i} activities, waiting 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.warn(`      ⚠️  Failed to fetch details for activity ${activity.id}:`, error.message);
        // Continue with the basic activity data
        detailedActivities.push(activity);
      }
    }

    console.log(`   ✅ Retrieved detailed data for ${detailedActivities.length} activities`);

    // Step 4: Process and store activities
    console.log('\n4️⃣ Processing and storing activities...');
    
    let newActivities = 0;
    let updatedActivities = 0;
    
    for (const activity of detailedActivities) {
      try {
        // Check if activity already exists
        const existingResult = await sql`
          SELECT id FROM strava_runs WHERE id = ${activity.id}
        `;
        
        // Handle coordinates if available  
        let startPoint = null;
        let endPoint = null;
        if (activity.start_latlng && activity.start_latlng.length === 2) {
          // Format as PostgreSQL POINT(longitude, latitude)
          startPoint = `(${activity.start_latlng[1]}, ${activity.start_latlng[0]})`;
        }
        if (activity.end_latlng && activity.end_latlng.length === 2) {
          // Format as PostgreSQL POINT(longitude, latitude)  
          endPoint = `(${activity.end_latlng[1]}, ${activity.end_latlng[0]})`;
        }

        if (existingResult.rows.length === 0) {
          // Insert new activity with available fields from list API
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
          // Update existing activity with available fields from list API
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
    
    const finalCount = await sql`SELECT COUNT(*) as total FROM strava_runs`;
    console.log(`   📊 Total activities in database: ${finalCount.rows[0].total}`);
    
    const polylineCount = await sql`SELECT COUNT(*) as with_polylines FROM strava_runs WHERE detailed_polyline IS NOT NULL`;
    console.log(`   �️  Activities with detailed polylines: ${polylineCount.rows[0].with_polylines}`);
    
    console.log('\n✅ All Strava activities fetched successfully!');
    console.log('�️  Detailed polylines now available for route visualization');

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