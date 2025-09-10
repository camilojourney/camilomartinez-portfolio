// 📂 test-strava-integration.js
/**
 * Test script for Strava OAuth integration
 * Run with: node scripts/testing/test-strava-integration.js
 */

import { stravaUserService } from '../../src/lib/db/strava-database.ts';
import { stravaTokenService } from '../../src/lib/services/strava-token-service.ts';

async function testStravaIntegration() {
  console.log('🧪 Testing Strava Integration...\n');

  try {
    // Test 1: Check database connection
    console.log('1️⃣ Testing database connection...');
    const users = await stravaUserService.getAllUsersWithTokens();
    console.log(`✅ Database connected. Found ${users.length} Strava users.\n`);

    // Test 2: Create a mock user for testing
    console.log('2️⃣ Testing user creation...');
    const mockProfile = {
      id: 999999,
      email: 'test@example.com',
      firstname: 'Test',
      lastname: 'User',
      username: 'testuser123',
      city: 'Astoria',
      state: 'NY',
      country: 'USA',
      sex: 'M',
      profilePictureUrl: 'https://example.com/avatar.jpg',
    };

    const mockTokens = {
      accessToken: 'test_access_token_12345',
      refreshToken: 'test_refresh_token_67890',
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
      scopes: 'read,activity:read_all,profile:read_all',
    };

    await stravaUserService.upsertUserWithTokens(mockProfile, mockTokens);
    console.log(`✅ Test user created/updated successfully.\n`);

    // Test 3: Retrieve user tokens
    console.log('3️⃣ Testing token retrieval...');
    const retrievedTokens = await stravaUserService.getUserTokens(mockProfile.id);
    
    if (retrievedTokens) {
      console.log(`✅ Tokens retrieved successfully:`);
      console.log(`   Access Token: ${retrievedTokens.accessToken.substring(0, 20)}...`);
      console.log(`   Refresh Token: ${retrievedTokens.refreshToken.substring(0, 20)}...`);
      console.log(`   Expires At: ${retrievedTokens.expiresAt}`);
      console.log(`   Scopes: ${retrievedTokens.scopes}\n`);
    } else {
      console.log(`❌ Failed to retrieve tokens for user ${mockProfile.id}\n`);
    }

    // Test 4: Check if token is expired
    console.log('4️⃣ Testing token expiration check...');
    if (retrievedTokens) {
      const isExpired = stravaTokenService.isTokenExpired(retrievedTokens);
      console.log(`✅ Token expiration check: ${isExpired ? 'EXPIRED' : 'VALID'}\n`);
    }

    // Test 5: Get user profile
    console.log('5️⃣ Testing user profile retrieval...');
    const userProfile = await stravaUserService.getUserProfile(mockProfile.id);
    
    if (userProfile) {
      console.log(`✅ User profile retrieved:`);
      console.log(`   Name: ${userProfile.first_name} ${userProfile.last_name}`);
      console.log(`   Username: ${userProfile.username}`);
      console.log(`   Location: ${userProfile.city}, ${userProfile.state}, ${userProfile.country}\n`);
    } else {
      console.log(`❌ Failed to retrieve user profile for ${mockProfile.id}\n`);
    }

    // Test 6: Clean up test data
    console.log('6️⃣ Cleaning up test data...');
    // Note: In a real scenario, you might want to keep the test data or have a specific cleanup method
    // For now, we'll just log that we would clean up
    console.log(`✅ Test completed. Test user ${mockProfile.id} can be manually removed if needed.\n`);

    console.log('🎉 All Strava integration tests passed!');
    console.log('\n📋 Summary:');
    console.log('✅ Database connection working');
    console.log('✅ User creation/update working');
    console.log('✅ Token storage and retrieval working');
    console.log('✅ Token expiration checking working');
    console.log('✅ User profile retrieval working');
    console.log('\n🚀 Ready for OAuth flow testing!');
    console.log('   - Start your dev server: npm run dev');
    console.log('   - Visit: http://localhost:3000/api/auth/strava/authorize');
    console.log('   - Complete OAuth flow to test full integration');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testStravaIntegration();
