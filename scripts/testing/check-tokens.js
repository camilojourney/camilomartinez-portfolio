const dotenv = require('dotenv');
dotenv.config();

const { sql } = require('@vercel/postgres');

async function checkTokens() {
    try {
        console.log('🔍 Checking WHOOP tokens in database...');
        
        // First check the schema
        const schemaResult = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'whoop_users'
            ORDER BY ordinal_position
        `;
        
        console.log('📋 whoop_users table columns:');
        schemaResult.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type}`);
        });
        
        const result = await sql`
            SELECT *
            FROM whoop_users 
            ORDER BY id DESC 
            LIMIT 1
        `;
        
        if (result.rows.length === 0) {
            console.log('❌ No WHOOP users found in database');
            return;
        }
        
        const user = result.rows[0];
        console.log('\n👤 User data:');
        Object.entries(user).forEach(([key, value]) => {
            if (key.includes('token') && value) {
                console.log(`${key}: ${String(value).substring(0, 20) + '...'} (length: ${String(value).length})`);
            } else {
                console.log(`${key}: ${value}`);
            }
        });
        
        // Check token expiration
        if (user.token_expires_at) {
            const expiryDate = new Date(user.token_expires_at);
            const now = new Date();
            console.log('\n⏰ Token Status:');
            console.log('Expires at:', expiryDate);
            console.log('Current time:', now);
            console.log('Is expired:', expiryDate < now);
            console.log('Minutes until expiry:', Math.round((expiryDate - now) / (1000 * 60)));
        }
        
    } catch (error) {
        console.error('💥 Error checking tokens:', error);
    }
}

checkTokens();
