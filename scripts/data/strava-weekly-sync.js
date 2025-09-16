#!/usr/bin/env node
// 📂 scripts/data/strava-weekly-sync.js
/**
 * CLI script for weekly sync of new Strava running data
 * This is designed to run as a cron job to keep data up to date
 * 
 * Usage:
 *   node scripts/data/strava-weekly-sync.js [user_id]
 *   
 * Examples:
 *   node scripts/data/strava-weekly-sync.js           # Sync for all users
 *   node scripts/data/strava-weekly-sync.js 12345    # Sync for specific user
 *   
 * Cron job example (runs every Monday at 6 AM):
 *   0 6 * * 1 /usr/bin/node /path/to/scripts/data/strava-weekly-sync.js
 */

const { stravaDataSyncCoordinator, weeklySyncService } = require('../../src/lib/services/strava-data-sync');

async function main() {
  const args = process.argv.slice(2);
  const specificUserId = args[0] ? parseInt(args[0]) : null;

  console.log('🔄 Strava Weekly Sync Starting...');
  console.log('=================================');
  
  if (specificUserId) {
    console.log(`📊 Syncing new activities for user: ${specificUserId}`);
  } else {
    console.log('📊 Syncing new activities for all users with valid tokens');
  }

  try {
    const startTime = Date.now();
    
    // Get sync status first
    const syncStatus = await stravaDataSyncCoordinator.getSyncStatus();
    console.log(`📈 Current status: ${syncStatus.totalRuns} runs, ${syncStatus.totalUsers} users`);
    console.log(`📅 Last sync: ${syncStatus.lastSyncDate ? syncStatus.lastSyncDate.toDateString() : 'Never'}`);
    
    if (syncStatus.needsHistoricalImport) {
      console.log('⚠️  Warning: Low activity count detected. Consider running historical import first.');
      console.log('   Run: node scripts/data/strava-historical-import.js');
    }

    let results;

    // Progress callback for real-time updates
    const onProgress = (progress) => {
      if (progress.totalActivities === 0) {
        console.log(`👤 User ${progress.userId}: No new activities to sync`);
      } else {
        console.log(`👤 User ${progress.userId}: ${progress.successfulImports}/${progress.totalActivities} new activities synced`);
      }
      
      if (progress.errors.length > 0) {
        console.log(`⚠️  ${progress.errors.length} errors encountered`);
      }
    };

    const options = {
      maxActivitiesPerBatch: 50, // Weekly sync can be more aggressive
      delayBetweenBatches: 500,
      onProgress,
    };

    if (specificUserId) {
      // Sync for specific user
      const result = await weeklySyncService.syncUserNewActivities(specificUserId, options);
      results = [result];
    } else {
      // Sync for all users
      results = await stravaDataSyncCoordinator.runWeeklySyncForAllUsers(options);
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    // Summary statistics
    console.log('\n✅ Weekly Sync Complete!');
    console.log('========================');
    
    const totalSynced = results.reduce((sum, r) => sum + r.successfulImports, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalNewActivities = results.reduce((sum, r) => sum + r.totalActivities, 0);
    const successfulUsers = results.filter(r => r.status === 'completed').length;
    const failedUsers = results.filter(r => r.status === 'failed').length;
    const usersWithNewActivities = results.filter(r => r.totalActivities > 0).length;

    console.log(`📊 Total new activities found: ${totalNewActivities}`);
    console.log(`✅ Successfully synced: ${totalSynced}`);
    console.log(`❌ Errors encountered: ${totalErrors}`);
    console.log(`👥 Users checked: ${results.length}`);
    console.log(`🏃 Users with new activities: ${usersWithNewActivities}`);
    console.log(`✅ Users successfully processed: ${successfulUsers}`);
    console.log(`❌ Users with failures: ${failedUsers}`);
    console.log(`⏱️  Total duration: ${duration} seconds`);

    // Process cross-platform correlations if there were new activities
    if (totalNewActivities > 0) {
      console.log('\n🔗 Processing cross-platform activity correlations...');
      try {
        const { spawn } = require('child_process');
        
        // Run the correlation ETL with 7-day window for weekly sync
        const correlationProcess = spawn('node', ['scripts/data/run-correlation-etl.mjs', 'process', '7'], {
          stdio: 'inherit',
          cwd: process.cwd()
        });
        
        await new Promise((resolve, reject) => {
          correlationProcess.on('close', (code) => {
            if (code === 0) {
              console.log('✅ Activity correlations processed successfully');
              resolve();
            } else {
              console.log('⚠️  Activity correlation processing failed, but sync continues');
              resolve(); // Don't fail the entire sync for correlation issues
            }
          });
          correlationProcess.on('error', (error) => {
            console.log('⚠️  Correlation process error (sync continues):', error.message);
            resolve();
          });
        });
      } catch (error) {
        console.log('⚠️  Failed to run correlation processing (sync continues):', error.message);
      }
    } else {
      console.log('\n🔗 Skipping correlation processing (no new activities)');
    }

    // Show detailed results for users with new activities or errors
    const relevantResults = results.filter(r => r.totalActivities > 0 || r.errors.length > 0);
    
    if (relevantResults.length > 0) {
      console.log('\n📋 Detailed Results:');
      console.log('====================');
      
      relevantResults.forEach(result => {
        const status = result.status === 'completed' ? '✅' : '❌';
        console.log(`${status} User ${result.userId}: ${result.successfulImports}/${result.totalActivities} activities synced`);
        
        if (result.errors.length > 0) {
          result.errors.forEach(error => {
            console.log(`   ⚠️  ${error}`);
          });
        }
      });
    } else {
      console.log('\n😴 No new activities found for any users since last sync');
    }

    // Show sync performance metrics
    if (totalSynced > 0) {
      console.log('\n📈 Performance Metrics:');
      console.log('======================');
      console.log(`📊 Sync rate: ${Math.round(totalSynced / (duration / 60))} activities/minute`);
      console.log(`📊 Average per user: ${Math.round(totalSynced / usersWithNewActivities)} activities`);
    }

    // Next run information
    console.log('\n⏰ Sync Schedule:');
    console.log('================');
    console.log('Next recommended sync: In 7 days');
    console.log('Cron job setup: 0 6 * * 1 (Every Monday at 6 AM)');
    console.log('Manual run: node scripts/data/strava-weekly-sync.js');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Weekly Sync Failed!');
    console.error('======================');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    console.log('\n🔧 Troubleshooting:');
    console.log('===================');
    console.log('1. Check your Strava API credentials in environment variables');
    console.log('2. Ensure database is accessible and up to date');
    console.log('3. Verify users have valid Strava tokens (may need refresh)');
    console.log('4. Check Strava API rate limits (600 requests per 15 minutes)');
    console.log('5. Check network connectivity to Strava API');
    
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Sync interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Sync terminated');
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { main };
