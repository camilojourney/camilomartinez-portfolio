#!/usr/bin/env node
// 📂 scripts/data/simple-historical-import.js
/**
 * Simple historical import script for Strava data
 * Focuses on just getting the data populated in the database
 */

require('dotenv').config();

async function main() {
  console.log('🚀 Simple Strava Historical Import');
  console.log('===================================');
  
  try {
    // Import the database functions
    const { stravaUserService } = require('../../src/lib/db/strava-database');
    const { createStravaClient } = require('../../src/lib/strava-client');
    const { sql } = require('../../src/lib/db/db');
    
    console.log('📋 Step 1: Checking for users with Strava tokens...');
    
    // Get users with tokens
    const users = await stravaUserService.getAllUsersWithTokens();
    
    if (users.length === 0) {
      console.log('❌ No users with Strava tokens found');
      console.log('   Users need to authenticate via OAuth first');
      process.exit(1);
    }
    
    console.log(`✅ Found ${users.length} users with tokens:`);
    users.forEach(user => {
      const name = user.username || `${user.first_name} ${user.last_name}`.trim() || `User ${user.id}`;
      console.log(`   👤 ${name} (ID: ${user.id})`);
    });
    
    // Process each user
    for (const user of users) {
      console.log(`\n📋 Step 2: Importing data for ${user.username || user.id}...`);
      
      try {
        // Create Strava client with user's refresh token
        const stravaClient = await createStravaClient(user.refresh_token);
        
        // Get activities from the past year (reasonable starting point)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        console.log(`📅 Fetching activities since ${oneYearAgo.toDateString()}...`);
        
        const activities = await stravaClient.getAllRunsInDateRange(oneYearAgo, new Date());
        
        console.log(`📊 Found ${activities.length} activities`);
        
        if (activities.length === 0) {
          console.log('ℹ️  No activities found for this user in the past year');
          continue;
        }
        
        // Insert activities one by one
        let successCount = 0;
        for (const activity of activities) {
          try {
            if (!activity.map?.summary_polyline) {
              console.log(`⚠️  Skipping ${activity.name}: No GPS data`);
              continue;
            }
            
            // Insert directly using SQL
            await sql`
              INSERT INTO strava_runs (
                id,
                user_id,
                name,
                sport_type,
                start_date,
                distance_meters,
                summary_polyline,
                detailed_polyline
              ) VALUES (
                ${activity.id},
                ${user.id},
                ${activity.name},
                ${activity.type},
                ${activity.start_date},
                ${activity.distance},
                ${activity.map.summary_polyline},
                ${activity.map.summary_polyline}
              )
              ON CONFLICT (id) DO NOTHING
            `;
            
            successCount++;
            console.log(`✅ ${successCount}/${activities.length}: ${activity.name} (${(activity.distance / 1000).toFixed(2)}km)`);
            
            // Small delay to be respectful
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (error) {
            console.error(`❌ Failed to insert ${activity.name}:`, error.message);
          }
        }
        
        console.log(`✅ User ${user.id}: ${successCount}/${activities.length} activities imported`);
        
      } catch (userError) {
        console.error(`❌ Failed to process user ${user.id}:`, userError.message);
      }
      
      // Delay between users
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Final summary
    console.log('\n🎉 Import Summary');
    console.log('================');
    
    const totalRuns = await sql`SELECT COUNT(*) as count FROM strava_runs`;
    console.log(`📊 Total runs in database: ${totalRuns.rows[0].count}`);
    
    const recentRuns = await sql`
      SELECT name, start_date, distance_meters 
      FROM strava_runs 
      ORDER BY start_date DESC 
      LIMIT 5
    `;
    
    if (recentRuns.rows.length > 0) {
      console.log('\n📋 Most recent runs:');
      recentRuns.rows.forEach(run => {
        const date = new Date(run.start_date).toDateString();
        const distance = (run.distance_meters / 1000).toFixed(2);
        console.log(`   🏃 ${run.name} - ${distance}km on ${date}`);
      });
    }
    
    console.log('\n✅ Historical import complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Import interrupted');
  process.exit(0);
});

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
