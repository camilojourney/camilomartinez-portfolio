#!/usr/bin/env node
// 📂 scripts/data/strava-sync-status.js
/**
 * CLI script to check the current status of Strava data synchronization
 * Shows statistics, recent sync info, and recommendations
 * 
 * Usage:
 *   node scripts/data/strava-sync-status.js
 */

const { stravaDataSyncCoordinator } = require('../../src/lib/services/strava-data-sync');
const { stravaUserService } = require('../../src/lib/db/strava-database');

async function main() {
  console.log('📊 Strava Data Sync Status Report');
  console.log('=================================');

  try {
    // Get sync status
    const syncStatus = await stravaDataSyncCoordinator.getSyncStatus();
    
    // Get user details
    const allUsers = await stravaUserService.getAllUsersWithTokens();

    // Display current status
    console.log('\n📈 Current Statistics:');
    console.log('=====================');
    console.log(`👥 Total Users: ${syncStatus.totalUsers}`);
    console.log(`🏃 Total Runs: ${syncStatus.totalRuns}`);
    console.log(`📊 Average Runs per User: ${syncStatus.totalUsers > 0 ? Math.round(syncStatus.totalRuns / syncStatus.totalUsers) : 0}`);
    console.log(`📅 Last Sync: ${syncStatus.lastSyncDate ? syncStatus.lastSyncDate.toDateString() : 'Never'}`);

    // Show user details
    if (allUsers.length > 0) {
      console.log('\n👥 Users with Strava Access:');
      console.log('============================');
      
      for (const user of allUsers) {
        const displayName = user.username || `${user.first_name} ${user.last_name}`.trim() || `User ${user.id}`;
        const tokenStatus = user.access_token ? '✅' : '❌';
        console.log(`${tokenStatus} ${displayName} (ID: ${user.id})`);
      }
    } else {
      console.log('\n⚠️  No users with Strava tokens found');
      console.log('   Users need to authenticate via the OAuth flow first');
    }

    // Recommendations
    console.log('\n🎯 Recommendations:');
    console.log('===================');
    
    if (syncStatus.needsHistoricalImport) {
      console.log('📥 Run historical import to populate past activities:');
      console.log('   node scripts/data/strava-historical-import.js');
      console.log('   OR');
      console.log('   curl -X POST http://localhost:3000/api/strava/sync/historical');
    } else {
      console.log('✅ Historical data appears to be populated');
    }

    console.log('\n🔄 Set up weekly sync for ongoing updates:');
    console.log('   Manual: node scripts/data/strava-weekly-sync.js');
    console.log('   Cron: 0 6 * * 1 /usr/bin/node /path/to/scripts/data/strava-weekly-sync.js');
    console.log('   API: curl -X POST http://localhost:3000/api/strava/sync/weekly');

    // Next steps
    console.log('\n⏭️  Next Steps:');
    console.log('==============');
    
    if (allUsers.length === 0) {
      console.log('1. Set up Strava authentication for users');
      console.log('2. Run historical import');
      console.log('3. Schedule weekly sync');
    } else if (syncStatus.needsHistoricalImport) {
      console.log('1. Run historical import to get all past activities');
      console.log('2. Schedule weekly sync for ongoing updates');
      console.log('3. Monitor sync status regularly');
    } else {
      console.log('1. Ensure weekly sync is scheduled');
      console.log('2. Monitor for new users needing historical import');
      console.log('3. Check sync status periodically');
    }

    // API endpoints
    console.log('\n🔗 API Endpoints:');
    console.log('=================');
    console.log('Status: GET /api/strava/sync-status');
    console.log('Historical: POST /api/strava/sync/historical');
    console.log('Weekly: POST /api/strava/sync/weekly');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error checking sync status:');
    console.error('==============================');
    console.error('Error:', error.message);
    
    console.log('\n🔧 Troubleshooting:');
    console.log('===================');
    console.log('1. Check database connection and migrations');
    console.log('2. Verify environment variables are set');
    console.log('3. Ensure Strava tables exist (strava_users, strava_runs)');
    
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { main };
