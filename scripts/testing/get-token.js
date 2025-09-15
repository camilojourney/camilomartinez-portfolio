// 📂 scripts/testing/get-token.js
// Simple script to get WHOOP access token for Postman testing

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { Pool } = require('pg');

async function getToken() {
    let pool;
    try {
        // Create database connection
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        console.log('🔍 Fetching your WHOOP access token...');
        
        const query = `
            SELECT 
                email,
                whoop_access_token,
                whoop_token_expires_at
            FROM users 
            WHERE whoop_access_token IS NOT NULL 
            ORDER BY updated_at DESC 
            LIMIT 1
        `;
        
        const result = await pool.query(query);
        
        if (result.rows.length === 0) {
            console.log('❌ No WHOOP token found in database');
            return;
        }
        
        const user = result.rows[0];
        
        console.log('\n🎯 TOKEN FOR POSTMAN:');
        console.log('='.repeat(60));
        console.log(`📧 User: ${user.email}`);
        console.log(`🔑 Access Token: ${user.whoop_access_token}`);
        console.log(`⏰ Expires: ${user.whoop_token_expires_at}`);
        console.log('='.repeat(60));
        
        // Check if expired
        const expiresAt = new Date(user.whoop_token_expires_at);
        const now = new Date();
        
        if (expiresAt <= now) {
            console.log('\n⚠️  TOKEN IS EXPIRED!');
            console.log('💡 Visit /signin to refresh your token');
        } else {
            const minutesLeft = Math.round((expiresAt - now) / 1000 / 60);
            console.log(`\n✅ Token valid for ${minutesLeft} more minutes`);
        }
        
    } catch (error) {
        console.error('❌ Database error:', error.message);
    } finally {
        if (pool) await pool.end();
    }
}

getToken();
