#!/usr/bin/env node

/**
 * Quick test script to see Strava historical import with terminal output
 */

const https = require('https');
const { createReadStream } = require('fs');

async function testHistoricalImport() {
  console.log('🚀 Testing Strava Historical Import');
  console.log('==================================');
  console.log('⏳ Starting historical data fetch...\n');

  // Get the secret from .env
  const fs = require('fs');
  const envContent = fs.readFileSync('.env', 'utf8');
  const secretMatch = envContent.match(/CRON_SECRET=(.+)/);
  const secret = secretMatch ? secretMatch[1].replace(/"/g, '') : '';

  if (!secret) {
    console.log('❌ Could not find CRON_SECRET in .env file');
    return;
  }

  const postData = JSON.stringify({
    maxActivitiesPerBatch: 5, // Small batch to see output
    delayBetweenBatches: 1000, // 1 second between batches
    forceFullSync: true // Force a complete historical sync
  });

  const options = {
    hostname: 'www.camilomartinez.co',
    port: 443,
    path: `/api/strava/sync/historical?secret=${secret}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('📡 Making request to production API...');
  console.log(`🔗 URL: https://${options.hostname}${options.path}`);
  console.log(`📦 Payload: ${postData}\n`);

  const req = https.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);
    console.log('\n📥 Response:');
    console.log('================');

    let responseData = '';

    res.on('data', (chunk) => {
      const data = chunk.toString();
      responseData += data;
      console.log('📨 Received chunk:', data);
    });

    res.on('end', () => {
      console.log('\n✅ Response completed');
      console.log('==================');
      
      try {
        const parsedResponse = JSON.parse(responseData);
        console.log('\n📊 Parsed Results:');
        console.log(JSON.stringify(parsedResponse, null, 2));
        
        if (parsedResponse.results) {
          parsedResponse.results.forEach(result => {
            console.log(`\n👤 User ${result.userId}:`);
            console.log(`   📊 Activities: ${result.totalActivities}`);
            console.log(`   ✅ Imported: ${result.successfulImports}`);
            console.log(`   ❌ Errors: ${result.errors?.length || 0}`);
            
            if (result.errors && result.errors.length > 0) {
              console.log(`   🚨 Sample errors:`);
              result.errors.slice(0, 3).forEach(error => {
                console.log(`      • ${error}`);
              });
            }
          });
        }
      } catch (e) {
        console.log('📄 Raw response (not JSON):');
        console.log(responseData);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Request error: ${e.message}`);
  });

  req.on('timeout', () => {
    console.log('⏰ Request timed out - this might mean it\'s processing...');
    req.destroy();
  });

  // Set timeout to 45 seconds
  req.setTimeout(45000);

  req.write(postData);
  req.end();
}

// Run the test
testHistoricalImport().catch(console.error);
