#!/usr/bin/env node

/**
 * Check Strava API rate limit status
 */

const https = require('https');

async function checkRateLimit() {
  console.log('🔍 Checking Strava API Rate Limit Status');
  console.log('=========================================');
  
  // Get the secret
  const fs = require('fs');
  const envContent = fs.readFileSync('.env', 'utf8');
  const secretMatch = envContent.match(/CRON_SECRET=(.+)/);
  const secret = secretMatch ? secretMatch[1].replace(/"/g, '') : '';

  const postData = JSON.stringify({
    checkOnly: true, // Just check status, don't import
    maxActivitiesPerBatch: 1
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

  console.log('📡 Checking API status...\n');

  const req = https.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk.toString();
    });

    res.on('end', () => {
      try {
        const parsed = JSON.parse(responseData);
        
        if (parsed.data && parsed.data.results) {
          const result = parsed.data.results[0];
          
          if (result.errors && result.errors.some(e => e.includes('Rate Limit'))) {
            console.log('🚨 RATE LIMIT EXCEEDED');
            console.log('======================');
            console.log('⏰ Strava API limits reset every 15 minutes');
            console.log('💡 Try again in a few minutes');
            console.log('📊 Current time:', new Date().toLocaleTimeString());
            
            // Calculate next 15-minute mark
            const now = new Date();
            const nextReset = new Date(now);
            nextReset.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
            console.log('🔄 Next possible reset:', nextReset.toLocaleTimeString());
          } else {
            console.log('✅ API is responding normally');
            console.log('🎯 Ready to fetch historical data!');
          }
        }
        
        console.log('\n📄 Full response:');
        console.log(JSON.stringify(parsed, null, 2));
        
      } catch (e) {
        console.log('📄 Raw response:', responseData);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Error: ${e.message}`);
  });

  req.setTimeout(15000);
  req.write(postData);
  req.end();
}

checkRateLimit().catch(console.error);
