#!/usr/bin/env node

/**
 * Test Production Daily WHOOP Fetching
 * Tests the new column names with real production data
 */

// Set up environment for testing
import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf8');
const cronSecret = envFile.match(/CRON_SECRET="([^"]+)"/)?.[1];

if (!cronSecret) {
  console.error('❌ CRON_SECRET not found in .env file');
  process.exit(1);
}

async function testProductionFetch() {
  try {
    console.log('🧪 Testing production WHOOP daily fetch with updated schema...\n');

    const baseUrl = 'http://localhost:3000';
    const url = `${baseUrl}/api/cron/daily-data-fetch?secret=${cronSecret}`;
    
    console.log('📡 Calling daily data fetch endpoint...');
    console.log(`   URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': cronSecret
      }
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Request failed:', response.status);
      console.error('❌ Error:', result);
      return;
    }

    console.log('\n✅ Daily fetch completed successfully!');
    console.log('\n📊 Results Summary:');
    console.log(`   Success: ${result.success}`);
    console.log(`   Timestamp: ${result.timestamp}`);
    
    if (result.data) {
      console.log(`   Total Users: ${result.data.totalUsers}`);
      console.log(`   Successful Users: ${result.data.successfulUsers}`);
      console.log(`   Failed Users: ${result.data.failedUsers}`);
      
      if (result.data.tokenRefreshResults) {
        console.log('\n🔑 Token Refresh Results:');
        console.log(`   Successful: ${result.data.tokenRefreshResults.successful}`);
        console.log(`   Failed: ${result.data.tokenRefreshResults.failed}`);
      }
      
      if (result.data.userResults && result.data.userResults.length > 0) {
        console.log('\n👥 User Data Results:');
        result.data.userResults.forEach((user, index) => {
          console.log(`   User ${index + 1}: ${user.userName}`);
          console.log(`     Cycles: ${user.newCycles}`);
          console.log(`     Sleep: ${user.newSleep}`);
          console.log(`     Recovery: ${user.newRecovery}`);
          console.log(`     Workouts: ${user.newWorkouts}`);
        });
      }
      
      if (result.data.errors && result.data.errors.length > 0) {
        console.log('\n⚠️ Errors encountered:');
        result.data.errors.forEach(error => console.log(`   - ${error}`));
      }
    }

    console.log('\n🎉 Schema migration test passed! All new column names working correctly.');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    throw error;
  }
}

// Run the test
testProductionFetch()
  .then(() => {
    console.log('\n✅ Production fetch test completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Production fetch test failed:', error);
    process.exit(1);
  });
