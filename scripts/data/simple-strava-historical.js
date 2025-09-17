#!/usr/bin/env node
// 📂 scripts/data/simple-strava-historical.js
/**
 * Simple historical import for Strava data
 * Works directly with the existing database schema and Strava API
 */

require('dotenv').config();

async function main() {
  console.log('🚀 Simple Strava Historical Import');
  console.log('===================================');

  // First, let's check if we have the necessary environment variables
  const requiredEnvVars = [
    'DATABASE_URL',
    'STRAVA_CLIENT_ID', 
    'STRAVA_CLIENT_SECRET'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  if (missing.length > 0) {
    console.log('❌ Missing required environment variables:');
    missing.forEach(envVar => console.log(`   - ${envVar}`));
    console.log('\n📝 Please set these in your .env file');
    process.exit(1);
  }

  // Check database connection
  try {
    const { sql } = require('../../src/lib/db/db');
    
    console.log('🔍 Checking database connection...');
    const result = await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful');

    // Check if strava_users table exists and has data
    console.log('\n📊 Checking Strava users...');
    const usersResult = await sql`
      SELECT COUNT(*) as user_count, 
             COUNT(CASE WHEN refresh_token IS NOT NULL THEN 1 END) as users_with_tokens
      FROM strava_users
    `;

    const userCount = parseInt(usersResult.rows[0]?.user_count || 0);
    const usersWithTokens = parseInt(usersResult.rows[0]?.users_with_tokens || 0);

    console.log(`👥 Total users: ${userCount}`);
    console.log(`🔑 Users with tokens: ${usersWithTokens}`);

    if (usersWithTokens === 0) {
      console.log('\n⚠️  No users with Strava tokens found!');
      console.log('📋 To get historical data, you need to:');
      console.log('   1. Set up Strava OAuth authentication');
      console.log('   2. Have users authorize your app');
      console.log('   3. Store their tokens in the strava_users table');
      console.log('\n🔗 Strava authentication endpoints:');
      console.log('   Authorization: /api/auth/strava/authorize');
      console.log('   Callback: /api/auth/strava/callback');
      console.log('\n💡 Once users authenticate, run this script again to import their data');
      process.exit(0);
    }

    // Check existing runs
    console.log('\n📊 Checking existing runs...');
    const runsResult = await sql`
      SELECT COUNT(*) as run_count,
             MIN(start_date) as earliest_run,
             MAX(start_date) as latest_run
      FROM strava_runs
    `;

    const runCount = parseInt(runsResult.rows[0]?.run_count || 0);
    const earliestRun = runsResult.rows[0]?.earliest_run;
    const latestRun = runsResult.rows[0]?.latest_run;

    console.log(`🏃 Total runs: ${runCount}`);
    if (earliestRun) {
      console.log(`📅 Date range: ${new Date(earliestRun).toDateString()} to ${new Date(latestRun).toDateString()}`);
    }

    // Show system status
    console.log('\n🎯 System Status:');
    console.log('=================');
    console.log(`✅ Database: Connected`);
    console.log(`✅ Tables: Created`);
    console.log(`${usersWithTokens > 0 ? '✅' : '❌'} Auth: ${usersWithTokens} users ready`);
    console.log(`${runCount > 0 ? '✅' : '📭'} Data: ${runCount} runs`);

    if (usersWithTokens > 0 && runCount === 0) {
      console.log('\n🚀 Ready for historical import!');
      console.log('📋 Next steps:');
      console.log('   1. Use the API endpoint: POST /api/strava/sync/historical');
      console.log('   2. Or use the web interface');
      console.log('   3. Monitor progress in the logs');
    }

    console.log('\n🔗 Available API endpoints:');
    console.log('   📊 Status: GET /api/strava/sync-status');
    console.log('   📥 Historical: POST /api/strava/sync/historical');
    console.log('   🔄 Weekly: POST /api/strava/sync/weekly');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check DATABASE_URL in .env file');
    console.log('   2. Ensure database is accessible');
    console.log('   3. Run migrations: node scripts/db/run-strava-migrations.js');
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
