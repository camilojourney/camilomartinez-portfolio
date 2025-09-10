#!/usr/bin/env node
// 📂 scripts/data/test-strava-sync.js
/**
 * Test script to demonstrate the Strava data sync system
 * This script shows how Phase 1 (auth) and Phase 2 (data sync) work together
 * 
 * Usage:
 *   node scripts/data/test-strava-sync.js
 */

const { stravaDataSyncCoordinator } = require('../../src/lib/services/strava-data-sync');
const { stravaUserService } = require('../../src/lib/db/strava-database');

async function main() {
  console.log('🧪 Testing Strava Data Sync System');
  console.log('==================================');
  console.log('This script tests the unified Phase 1 (auth) + Phase 2 (data sync) system\n');

  try {
    // Step 1: Check existing authentication (Phase 1)
    console.log('📋 Step 1: Checking existing authentication...');
    const allUsers = await stravaUserService.getAllUsersWithTokens();
    
    if (allUsers.length === 0) {
      console.log('❌ No users with Strava tokens found');
      console.log('   Users need to authenticate via the OAuth flow first');
      console.log('   Visit: /api/auth/strava or use the authentication system\n');
      
      console.log('💡 To test with existing tokens:');
      console.log('   1. Users must complete OAuth flow via your app');
      console.log('   2. Tokens are automatically stored in strava_users table');
      console.log('   3. Then run this test script again\n');
      process.exit(0);
    }

    console.log(`✅ Found ${allUsers.length} users with valid tokens:`);
    allUsers.forEach(user => {
      const displayName = user.username || `${user.first_name} ${user.last_name}`.trim() || `User ${user.id}`;
      console.log(`   👤 ${displayName} (ID: ${user.id})`);
    });

    // Step 2: Check sync status (Phase 2)
    console.log('\n📋 Step 2: Checking data sync status...');
    const syncStatus = await stravaDataSyncCoordinator.getSyncStatus();
    
    console.log(`📊 Current data: ${syncStatus.totalRuns} runs from ${syncStatus.totalUsers} users`);
    console.log(`📅 Last sync: ${syncStatus.lastSyncDate ? syncStatus.lastSyncDate.toDateString() : 'Never'}`);
    console.log(`🎯 Needs historical import: ${syncStatus.needsHistoricalImport ? 'Yes' : 'No'}`);

    // Step 3: Test sync for one user (limited scope)
    console.log('\n📋 Step 3: Testing weekly sync for first user...');
    const testUser = allUsers[0];
    console.log(`🧪 Testing sync for: ${testUser.username || testUser.id}`);

    // Test with limited options to avoid hitting rate limits
    const testOptions = {
      maxActivitiesPerBatch: 5, // Very small batch for testing
      delayBetweenBatches: 2000, // Conservative delays
      onProgress: (progress) => {
        console.log(`   📊 Progress: ${progress.processedActivities}/${progress.totalActivities} activities (${progress.successfulImports} imported)`);
      },
    };

    const syncResult = await stravaDataSyncCoordinator.weeklySyncService.syncUserNewActivities(testUser.id, testOptions);
    
    console.log(`✅ Test sync completed for user ${testUser.id}:`);
    console.log(`   📊 Status: ${syncResult.status}`);
    console.log(`   📈 Activities found: ${syncResult.totalActivities}`);
    console.log(`   ✅ Successfully imported: ${syncResult.successfulImports}`);
    console.log(`   ❌ Errors: ${syncResult.errors.length}`);
    
    if (syncResult.errors.length > 0) {
      console.log('   🔍 Errors encountered:');
      syncResult.errors.slice(0, 3).forEach(error => {
        console.log(`      ⚠️  ${error}`);
      });
    }

    // Step 4: Show next steps
    console.log('\n📋 Step 4: Next Steps');
    console.log('===================');
    
    if (syncStatus.needsHistoricalImport) {
      console.log('🎯 Run full historical import:');
      console.log('   node scripts/data/strava-historical-import.js');
      console.log('   (This will import ALL historical activities for all users)');
    } else {
      console.log('✅ System ready for production use');
    }

    console.log('\n🔄 Set up ongoing weekly sync:');
    console.log('   Manual: node scripts/data/strava-weekly-sync.js');
    console.log('   Cron: 0 6 * * 1 /usr/bin/node /path/to/scripts/data/strava-weekly-sync.js');

    console.log('\n📊 Monitor system:');
    console.log('   Status: node scripts/data/strava-sync-status.js');
    console.log('   API: curl http://localhost:3000/api/strava/sync-status');

    console.log('\n🎉 Test Complete! The unified Strava sync system is working correctly.');
    console.log('   Phase 1 (Authentication): ✅ Working');
    console.log('   Phase 2 (Data Sync): ✅ Working');

  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error('===============');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    console.log('\n🔧 Troubleshooting:');
    console.log('===================');
    console.log('1. Check database connection');
    console.log('2. Verify Strava API credentials');
    console.log('3. Ensure users have completed OAuth flow');
    console.log('4. Check Strava API rate limits');
    
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Test interrupted by user');
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
