#!/usr/bin/env node
// 📂 scripts/data/debug-strava-response.js
/**
 * Debug script to see exact Strava API response structure
 */

require('dotenv').config({ path: process.env.CAMILO_ENV_PATH || `${require('os').homedir()}/.config/secrets/camilomartinez-portfolio-local.env` });
const { sql } = require('@vercel/postgres');

async function debugStravaResponse() {
  console.log('🔍 Debugging Strava API Response Structure...\n');

  try {
    // Get user tokens
    const userResult = await sql`
      SELECT id, access_token, refresh_token
      FROM strava_users 
      WHERE access_token IS NOT NULL 
      ORDER BY id 
      LIMIT 1
    `;

    const user = userResult.rows[0];
    const STRAVA_API_BASE = 'https://www.strava.com/api/v3';
    
    console.log('📄 Fetching first activity to inspect structure...');
    
    const response = await fetch(`${STRAVA_API_BASE}/athlete/activities?per_page=1&page=1`, {
      headers: {
        'Authorization': `Bearer ${user.access_token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.log('❌ API call failed:', response.status);
      return;
    }

    const activities = await response.json();
    
    if (activities.length > 0) {
      const activity = activities[0];
      
      console.log('🎯 Activity Structure:');
      console.log('======================');
      console.log(`ID: ${activity.id}`);
      console.log(`Name: ${activity.name}`);
      console.log(`Type: ${activity.type}`);
      console.log(`Sport Type: ${activity.sport_type}`);
      console.log();
      
      console.log('📊 Key Fields:');
      console.log(`- suffer_score: ${activity.suffer_score}`);
      console.log(`- elev_high: ${activity.elev_high}`);
      console.log(`- elev_low: ${activity.elev_low}`);
      console.log(`- utc_offset: ${activity.utc_offset}`);
      console.log(`- start_latlng: ${JSON.stringify(activity.start_latlng)}`);
      console.log(`- end_latlng: ${JSON.stringify(activity.end_latlng)}`);
      console.log();
      
      console.log('🗺️  Map/Polyline Structure:');
      console.log(`- map: ${activity.map ? 'EXISTS' : 'NULL'}`);
      if (activity.map) {
        console.log(`  - map.id: ${activity.map.id}`);
        console.log(`  - map.summary_polyline: ${activity.map.summary_polyline ? 'EXISTS (' + activity.map.summary_polyline.length + ' chars)' : 'NULL'}`);
        console.log(`  - map.polyline: ${activity.map.polyline ? 'EXISTS (' + activity.map.polyline.length + ' chars)' : 'NULL'}`);
      }
      console.log(`- polyline (top level): ${activity.polyline ? 'EXISTS (' + activity.polyline.length + ' chars)' : 'NULL'}`);
      console.log(`- summary_polyline (top level): ${activity.summary_polyline ? 'EXISTS (' + activity.summary_polyline.length + ' chars)' : 'NULL'}`);
      
      console.log();
      console.log('🔍 Full Activity Object Keys:');
      console.log(Object.keys(activity).sort());
      
      if (activity.map) {
        console.log();
        console.log('🗺️  Full Map Object Keys:');
        console.log(Object.keys(activity.map).sort());
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugStravaResponse().catch(console.error);
