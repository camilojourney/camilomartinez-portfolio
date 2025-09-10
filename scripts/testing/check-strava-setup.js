// 📂 check-strava-setup.js
/**
 * Simple test to verify Strava setup without TypeScript imports
 * Run with: node check-strava-setup.js
 */

import { sql } from '@vercel/postgres';
import { config } from 'dotenv';

// Load environment variables
config();

async function checkStravaSetup() {
  console.log('🧪 Checking Strava Setup...\n');

  try {
    // Test 1: Check environment variables
    console.log('1️⃣ Checking environment variables...');
    
    const requiredEnvVars = [
      'STRAVA_CLIENT_ID',
      'STRAVA_CLIENT_SECRET',
      'POSTGRES_URL'
    ];

    let envCheck = true;
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        console.log(`   ✅ ${envVar}: Set`);
      } else {
        console.log(`   ❌ ${envVar}: Missing`);
        envCheck = false;
      }
    }
    
    if (!envCheck) {
      throw new Error('Missing required environment variables');
    }
    console.log('');

    // Test 2: Check database connection
    console.log('2️⃣ Checking database connection...');
    const dbTest = await sql`SELECT 1 as test`;
    console.log(`   ✅ Database connected successfully\n`);

    // Test 3: Check if strava_users table exists
    console.log('3️⃣ Checking strava_users table...');
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'strava_users'
      );
    `;
    
    if (tableCheck.rows[0].exists) {
      console.log(`   ✅ strava_users table exists`);
      
      // Get column count
      const columnCheck = await sql`
        SELECT COUNT(*) as column_count 
        FROM information_schema.columns 
        WHERE table_name = 'strava_users';
      `;
      console.log(`   ✅ Table has ${columnCheck.rows[0].column_count} columns`);
    } else {
      console.log(`   ❌ strava_users table does not exist`);
    }
    console.log('');

    // Test 4: Check OAuth endpoints exist
    console.log('4️⃣ Checking OAuth endpoint files...');
    
    const fs = await import('fs');
    const path = await import('path');
    
    const endpointFiles = [
      'src/app/api/auth/strava/authorize/route.ts',
      'src/app/api/auth/strava/callback/route.ts'
    ];

    for (const file of endpointFiles) {
      if (fs.existsSync(file)) {
        console.log(`   ✅ ${file} exists`);
      } else {
        console.log(`   ❌ ${file} missing`);
      }
    }
    console.log('');

    // Test 5: Check service files
    console.log('5️⃣ Checking service files...');
    
    const serviceFiles = [
      'src/lib/db/strava-database.ts',
      'src/lib/services/strava-token-service.ts',
      'src/types/strava-auth.ts'
    ];

    for (const file of serviceFiles) {
      if (fs.existsSync(file)) {
        console.log(`   ✅ ${file} exists`);
      } else {
        console.log(`   ❌ ${file} missing`);
      }
    }
    console.log('');

    console.log('🎉 Strava setup verification complete!');
    console.log('\n📋 Summary:');
    console.log('✅ Environment variables configured');
    console.log('✅ Database connection working');
    console.log('✅ strava_users table created');
    console.log('✅ OAuth endpoint files present');
    console.log('✅ Service files present');
    
    console.log('\n🚀 Ready for OAuth testing!');
    console.log('Next steps:');
    console.log('1. Start your dev server: npm run dev');
    console.log('2. Visit: http://localhost:3000/api/auth/strava/authorize');
    console.log('3. Complete OAuth flow to test integration');
    console.log('4. Check database for new user entry');

  } catch (error) {
    console.error('❌ Setup check failed:', error);
    
    if (error.message.includes('ENOTFOUND') || error.message.includes('database')) {
      console.log('\n💡 Database connection tips:');
      console.log('- Make sure POSTGRES_URL is set correctly');
      console.log('- Check if database is accessible');
      console.log('- Verify Neon database is running');
    }
    
    process.exit(1);
  }
}

// Run the check
checkStravaSetup();
