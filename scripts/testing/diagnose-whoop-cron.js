#!/usr/bin/env node
// 📂 scripts/testing/diagnose-whoop-cron.js
/**
 * 🔍 WHOOP CRON DIAGNOSTIC TOOL
 * 
 * This script helps diagnose why the WHOOP cron job isn't working:
 * ✅ Tests production cron endpoint
 * ✅ Validates environment variables
 * ✅ Checks database for recent WHOOP data
 * ✅ Tests WHOOP API connectivity
 * ✅ Validates token freshness
 */

require('dotenv').config({ path: '.env' });
const { sql } = require('@vercel/postgres');

async function diagnoseWhoopCron() {
  console.log('🔍 WHOOP Cron Job Diagnostic Tool');
  console.log('==================================\n');

  try {
    // Step 1: Check environment variables
    console.log('1️⃣ Environment Variable Check:');
    const cronSecret = process.env.CRON_SECRET;

    console.log(`   CRON_SECRET: ${cronSecret ? '✅ Set' : '❌ Missing'}`);
    if (!cronSecret) {
      console.log('\n🚨 MAJOR ISSUE FOUND:');
      console.log('   CRON_SECRET is not set in your environment.');
      console.log('   The cron endpoints require CRON_SECRET (via x-cron-secret header).');
      console.log('   Set CRON_SECRET in your local .env and in Vercel env vars.');
    }

    // Step 2: Check recent WHOOP data in database
    console.log('\n2️⃣ Database Freshness Check:');
    
    const recentCycles = await sql`
      SELECT 
        DATE(created_at) as sync_date,
        COUNT(*) as records
      FROM whoop_cycles 
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY sync_date DESC
    `;
    
    const recentRecovery = await sql`
      SELECT 
        DATE(created_at) as sync_date,
        COUNT(*) as records
      FROM whoop_recovery 
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY sync_date DESC
    `;

    console.log('   📊 Recent WHOOP Cycles (last 7 days):');
    if (recentCycles.rows.length === 0) {
      console.log('      ❌ No cycles synced in last 7 days');
    } else {
      recentCycles.rows.forEach(row => {
        console.log(`      ${row.sync_date}: ${row.records} cycles`);
      });
    }

    console.log('   📊 Recent WHOOP Recovery (last 7 days):');
    if (recentRecovery.rows.length === 0) {
      console.log('      ❌ No recovery data synced in last 7 days');
    } else {
      recentRecovery.rows.forEach(row => {
        console.log(`      ${row.sync_date}: ${row.records} recovery records`);
      });
    }

    // Step 3: Check WHOOP user tokens
    console.log('\n3️⃣ WHOOP User Token Check:');
    
    const whoopUsers = await sql`
      SELECT 
        id, 
        first_name, 
        last_name,
        access_token IS NOT NULL as has_token,
        token_expires_at,
        CASE 
          WHEN token_expires_at > NOW() THEN 'Valid'
          WHEN token_expires_at <= NOW() THEN 'Expired'
          ELSE 'Unknown'
        END as token_status,
        updated_at
      FROM whoop_users
      ORDER BY updated_at DESC
    `;

    if (whoopUsers.rows.length === 0) {
      console.log('   ❌ No WHOOP users found in database');
    } else {
      whoopUsers.rows.forEach(user => {
        console.log(`   👤 ${user.first_name} ${user.last_name}:`);
        console.log(`      Token: ${user.has_token ? '✅ Present' : '❌ Missing'}`);
        console.log(`      Status: ${user.token_status}`);
        console.log(`      Expires: ${user.token_expires_at || 'Unknown'}`);
        console.log(`      Last Updated: ${user.updated_at}`);
      });
    }

    // Step 4: Test production endpoint manually
    console.log('\n4️⃣ Production Endpoint Test:');
    console.log('   Testing: https://camilomartinez.co/api/cron/daily-data-fetch');
    
    const testUrl = `https://camilomartinez.co/api/cron/daily-data-fetch?dryRun=true`;
    
    try {
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': cronSecret
        }
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ Endpoint reachable and working');
        console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
      } else {
        const errorText = await response.text();
        console.log('   ❌ Endpoint failed');
        console.log(`   Error: ${errorText}`);
      }
    } catch (error) {
      console.log('   ❌ Network error reaching endpoint');
      console.log(`   Error: ${error.message}`);
    }

    // Step 5: Summary and recommendations
    console.log('\n5️⃣ Diagnosis Summary:');
    console.log('========================');
    
    if (!cronSecret) {
      console.log('🚨 PRIMARY ISSUE: CRON_SECRET is missing');
      console.log('   SOLUTION: Set CRON_SECRET locally and in production (Vercel env vars).');
      console.log('   Use a long random value and rotate it if it was ever committed.');
    }
    
    if (recentCycles.rows.length === 0 && recentRecovery.rows.length === 0) {
      console.log('⚠️  No recent data: Cron job likely not running');
    }
    
    if (whoopUsers.rows.some(u => u.token_status === 'Expired')) {
      console.log('⚠️  Some tokens expired: May need refresh');
    }

    console.log('\n💡 Next Steps:');
    console.log('==============');
    console.log('1. Ensure CRON_SECRET is set (most critical)');
    console.log('2. Check Vercel dashboard for cron job logs');
    console.log('3. Test endpoint manually after fixing secrets');
    console.log('4. Monitor database for new data after fixes');

  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }
}

diagnoseWhoopCron().catch(console.error);
