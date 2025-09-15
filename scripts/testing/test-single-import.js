// 📂 scripts/testing/test-single-import.js
/**
 * Quick test to import just one activity to debug the database insert
 */

// Use dynamic imports for ES modules
async function importModules() {
  const stravaClientModule = await import('../../src/lib/strava-client.ts');
  const stravaDbModule = await import('../../src/lib/db/strava-database.ts');
  const dbModule = await import('../../src/lib/db/db.ts');
  
  return {
    createStravaClient: stravaClientModule.createStravaClient,
    stravaUserService: stravaDbModule.stravaUserService,
    sql: dbModule.sql
  };
}

async function testSingleImport() {
  try {
    console.log('🧪 Testing single activity import...');

    // Import modules dynamically
    const { createStravaClient, stravaUserService, sql } = await importModules();

    // Get first user
    const users = await stravaUserService.getAllUsersWithTokens();
    if (users.length === 0) {
      console.log('❌ No users found');
      return;
    }

    const user = users[0];
    console.log(`👤 Testing with user ${user.id} (${user.username})`);

    // Get user tokens
    const tokens = await stravaUserService.getUserTokens(user.id);
    if (!tokens) {
      console.log('❌ No tokens found');
      return;
    }

    // Create Strava client
    const stravaClient = await createStravaClient(tokens.refreshToken);
    
    // Get just a few activities to test
    console.log('📊 Fetching recent activities...');
    const startDate = new Date('2024-01-01');
    const endDate = new Date();
    
    const activities = await stravaClient.getAllRunsInDateRange(startDate, endDate);
    console.log(`📈 Found ${activities.length} activities`);

    if (activities.length === 0) {
      console.log('😴 No activities found');
      return;
    }

    // Test inserting just the first activity
    const activity = activities[0];
    console.log(`🧪 Testing insert of activity: ${activity.name} (${activity.id})`);

    // Manual insert to test
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
        ${activity.map?.summary_polyline || ''},
        ${activity.map?.summary_polyline || ''}
      )
      ON CONFLICT (id) 
      DO UPDATE SET
        name = EXCLUDED.name,
        updated_at = NOW()
    `;

    console.log('✅ Successfully inserted activity!');

    // Check if it's in the database
    const result = await sql`SELECT COUNT(*) as count FROM strava_runs WHERE user_id = ${user.id}`;
    console.log(`📊 Total runs in database for user: ${result.rows[0].count}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSingleImport();
