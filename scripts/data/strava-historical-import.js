#!/usr/bin/env node
// 📂 scripts/data/strava-historical-import.js
/**
 * CLI script for one-time historical import of all Strava running data
 * This is Phase 2 of the Strava integration - historical data population
 * 
 * Usage:
 *   node scripts/data/strava-historical-import.js [user_id]
 *   
 * Examples:
 *   node scripts/data/strava-historical-import.js           # Import for all users
 *   node scripts/data/strava-historical-import.js 12345    # Import for specific user
 */

const { stravaDataSyncCoordinator, historicalDataImporter } = require('../../src/lib/services/strava-data-sync');

async function main() {
  const args = process.argv.slice(2);
  const specificUserId = args[0] ? parseInt(args[0]) : null;

  console.log('🚀 Strava Historical Data Import Starting...');
  console.log('================================================');
  
  if (specificUserId) {
    console.log(`📊 Importing historical data for user: ${specificUserId}`);
  } else {
    console.log('📊 Importing historical data for all users with valid tokens');
  }

  try {
    const startTime = Date.now();
    let results;

    // Progress callback to show real-time updates
    const onProgress = (progress) => {
      const percentage = progress.totalActivities > 0 
        ? Math.round((progress.processedActivities / progress.totalActivities) * 100) 
        : 0;
      
      console.log(`👤 User ${progress.userId}: ${percentage}% complete (${progress.successfulImports}/${progress.totalActivities} activities imported)`);
      
      if (progress.errors.length > 0) {
        console.log(`⚠️  ${progress.errors.length} errors encountered`);
      }
    };

    const options = {
      maxActivitiesPerBatch: 20,
      delayBetweenBatches: 1500, // Be conservative with rate limiting
      onProgress,
    };

    if (specificUserId) {
      // Import for specific user
      const result = await historicalDataImporter.importUserHistoricalData(specificUserId, options);
      results = [result];
    } else {
      // Import for all users
      results = await stravaDataSyncCoordinator.runHistoricalImportForAllUsers(options);
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    // Summary statistics
    console.log('\n🎉 Historical Import Complete!');
    console.log('===============================');
    
    const totalImported = results.reduce((sum, r) => sum + r.successfulImports, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalProcessed = results.reduce((sum, r) => sum + r.totalActivities, 0);
    const successfulUsers = results.filter(r => r.status === 'completed').length;
    const failedUsers = results.filter(r => r.status === 'failed').length;

    console.log(`📊 Total activities processed: ${totalProcessed}`);
    console.log(`✅ Successfully imported: ${totalImported}`);
    console.log(`❌ Errors encountered: ${totalErrors}`);
    console.log(`👥 Users successfully processed: ${successfulUsers}`);
    console.log(`❌ Users with failures: ${failedUsers}`);
    console.log(`⏱️  Total duration: ${duration} seconds`);
    console.log(`📈 Average rate: ${totalImported > 0 ? Math.round(totalImported / (duration / 60)) : 0} activities/minute`);

    // Show detailed results for each user
    if (results.length > 1) {
      console.log('\n📋 Detailed Results by User:');
      console.log('============================');
      
      results.forEach(result => {
        const status = result.status === 'completed' ? '✅' : '❌';
        console.log(`${status} User ${result.userId}: ${result.successfulImports}/${result.totalActivities} activities (${result.errors.length} errors)`);
        
        if (result.errors.length > 0 && result.errors.length <= 3) {
          result.errors.forEach(error => {
            console.log(`   ⚠️  ${error}`);
          });
        } else if (result.errors.length > 3) {
          console.log(`   ⚠️  ${result.errors.length} errors (first 3):`);
          result.errors.slice(0, 3).forEach(error => {
            console.log(`   ⚠️  ${error}`);
          });
        }
      });
    }

    // Show next steps
    console.log('\n🔄 Next Steps:');
    console.log('==============');
    console.log('1. Historical import complete!');
    console.log('2. Set up weekly sync cron job: node scripts/data/strava-weekly-sync.js');
    console.log('3. Monitor sync status via API: /api/strava/sync-status');
    
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Historical Import Failed!');
    console.error('============================');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    console.log('\n🔧 Troubleshooting:');
    console.log('===================');
    console.log('1. Check your Strava API credentials in environment variables');
    console.log('2. Ensure database is accessible and migrations are up to date');
    console.log('3. Verify users have valid Strava tokens in strava_users table');
    console.log('4. Check Strava API rate limits (600 requests per 15 minutes)');
    
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Import interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Import terminated');
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
