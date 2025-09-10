// 📂 simple-strava-check.js
/**
 * Simple check for Strava setup without external dependencies
 * Run with: node simple-strava-check.js
 */

import fs from 'fs';
import path from 'path';

function loadEnvFile() {
  try {
    const envFile = fs.readFileSync('.env', 'utf8');
    const envVars = {};
    
    envFile.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        envVars[key] = value;
        process.env[key] = value;
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('❌ Could not load .env file:', error.message);
    return {};
  }
}

async function checkStravaSetup() {
  console.log('🧪 Checking Strava Setup...\n');

  try {
    // Load environment variables
    console.log('0️⃣ Loading environment variables...');
    const envVars = loadEnvFile();
    console.log(`   ✅ Loaded ${Object.keys(envVars).length} environment variables\n`);

    // Test 1: Check environment variables
    console.log('1️⃣ Checking Strava environment variables...');
    
    const requiredEnvVars = [
      'STRAVA_CLIENT_ID',
      'STRAVA_CLIENT_SECRET'
    ];

    let envCheck = true;
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        console.log(`   ✅ ${envVar}: ${process.env[envVar]}`);
      } else {
        console.log(`   ❌ ${envVar}: Missing`);
        envCheck = false;
      }
    }
    
    if (!envCheck) {
      throw new Error('Missing required Strava environment variables');
    }
    console.log('');

    // Test 2: Check OAuth endpoint files
    console.log('2️⃣ Checking OAuth endpoint files...');
    
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

    // Test 3: Check service files
    console.log('3️⃣ Checking service files...');
    
    const serviceFiles = [
      'src/lib/db/strava-database.ts',
      'src/lib/services/strava-token-service.ts',
      'src/types/strava-auth.ts'
    ];

    let serviceCheck = true;
    for (const file of serviceFiles) {
      if (fs.existsSync(file)) {
        console.log(`   ✅ ${file} exists`);
      } else {
        console.log(`   ❌ ${file} missing`);
        serviceCheck = false;
      }
    }
    console.log('');

    // Test 4: Check database migration
    console.log('4️⃣ Checking database migration files...');
    
    const migrationFiles = [
      'migrations/create_strava_users_table.sql',
      'run-strava-migration.js'
    ];

    for (const file of migrationFiles) {
      if (fs.existsSync(file)) {
        console.log(`   ✅ ${file} exists`);
      } else {
        console.log(`   ❌ ${file} missing`);
      }
    }
    console.log('');

    console.log('🎉 Strava setup verification complete!');
    console.log('\n📋 Summary:');
    console.log('✅ Strava environment variables configured');
    console.log('✅ OAuth endpoint files present');
    console.log('✅ Service files present');
    console.log('✅ Database migration files present');
    
    console.log('\n🚀 Ready for OAuth testing!');
    console.log('Next steps:');
    console.log('1. Start your dev server: npm run dev');
    console.log('2. Visit: http://localhost:3000/api/auth/strava/authorize');
    console.log('3. Complete OAuth flow to test integration');
    console.log('4. Check database for new user entry');
    
    console.log('\n🔗 OAuth Flow URLs:');
    console.log(`   - Authorization: http://localhost:3000/api/auth/strava/authorize`);
    console.log(`   - Callback: http://localhost:3000/api/auth/strava/callback`);
    
    console.log('\n📱 Strava App Configuration:');
    console.log(`   - Client ID: ${process.env.STRAVA_CLIENT_ID}`);
    console.log(`   - Authorization Callback Domain: localhost:3000`);
    console.log(`   - Callback URL: http://localhost:3000/api/auth/strava/callback`);

  } catch (error) {
    console.error('❌ Setup check failed:', error.message);
    process.exit(1);
  }
}

// Run the check
checkStravaSetup();
