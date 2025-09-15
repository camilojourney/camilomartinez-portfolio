// 📂 scripts/testing/get-workout-data.js
// Test script to fetch specific WHOOP workout data using database token

// Load environment variables from .env file
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function getWorkoutData() {
    try {
        console.log('🔍 Fetching your WHOOP access token from database...');
        
        // Get the most recent user's access token
        const userQuery = `
            SELECT 
                id,
                email,
                whoop_access_token,
                whoop_refresh_token,
                whoop_token_expires_at
            FROM users 
            WHERE whoop_access_token IS NOT NULL 
            ORDER BY updated_at DESC 
            LIMIT 1
        `;
        
        const userResult = await pool.query(userQuery);
        
        if (userResult.rows.length === 0) {
            console.error('❌ No user found with WHOOP access token');
            return;
        }
        
        const user = userResult.rows[0];
        console.log(`✅ Found token for user: ${user.email}`);
        console.log(`🕐 Token expires at: ${user.whoop_token_expires_at}`);
        
        // Check if token is expired
        const expiresAt = new Date(user.whoop_token_expires_at);
        const now = new Date();
        const isExpired = expiresAt <= now;
        
        if (isExpired) {
            console.warn(`⚠️ Token expired ${Math.round((now - expiresAt) / 1000 / 60)} minutes ago`);
            console.log('💡 You may need to refresh your token at /signin');
        } else {
            const minutesUntilExpiry = Math.round((expiresAt - now) / 1000 / 60);
            console.log(`✅ Token valid for ${minutesUntilExpiry} more minutes`);
        }
        
        // Make the API call to WHOOP
        const workoutId = '0af75906-debe-4b24-8577-e590df8b85c5';
        const apiUrl = `https://api.prod.whoop.com/developer/v1/activity/workout/${workoutId}`;
        
        console.log(`\n🚀 Fetching workout data from: ${apiUrl}`);
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${user.whoop_access_token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error Response:');
            console.error(errorText);
            return;
        }
        
        const workoutData = await response.json();
        
        console.log('\n🎯 WORKOUT DATA RESPONSE:');
        console.log('='.repeat(50));
        console.log(JSON.stringify(workoutData, null, 2));
        console.log('='.repeat(50));
        
        // Also save to a file for easier inspection
        const fs = require('fs');
        const outputFile = `/Users/camilo/camilomartinez-portfolio/cache/workout-${workoutId}.json`;
        fs.writeFileSync(outputFile, JSON.stringify(workoutData, null, 2));
        console.log(`\n💾 Full response saved to: ${outputFile}`);
        
    } catch (error) {
        console.error('❌ Error fetching workout data:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

// Run the script
getWorkoutData();
