require('dotenv').config();
const { sql } = require('@vercel/postgres');

async function refreshStravaTokens() {
  try {
    console.log('🔍 Checking for expired Strava tokens...');
    
    // Get users with expired tokens
    const usersResult = await sql`
      SELECT 
        id,
        first_name,
        last_name,
        access_token,
        refresh_token,
        token_expires_at
      FROM strava_users 
      WHERE refresh_token IS NOT NULL
      AND token_expires_at < NOW() + INTERVAL '1 hour'
    `;
    
    if (usersResult.rows.length === 0) {
      console.log('✅ No expired tokens found');
      return;
    }
    
    console.log(`🔄 Found ${usersResult.rows.length} user(s) with expired tokens`);
    
    for (const user of usersResult.rows) {
      console.log(`♻️ Refreshing token for ${user.first_name} ${user.last_name} (ID: ${user.id})`);
      
      try {
        // Refresh the token using Strava API
        const response = await fetch('https://www.strava.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: process.env.STRAVA_CLIENT_ID,
            client_secret: process.env.STRAVA_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: user.refresh_token,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error(`❌ Failed to refresh token for user ${user.id}:`, errorData);
          continue;
        }
        
        const tokenData = await response.json();
        const newExpiresAt = new Date(tokenData.expires_at * 1000);
        
        // Update the database with new tokens
        await sql`
          UPDATE strava_users 
          SET 
            access_token = ${tokenData.access_token},
            refresh_token = ${tokenData.refresh_token},
            token_expires_at = ${newExpiresAt.toISOString()},
            updated_at = NOW()
          WHERE id = ${user.id}
        `;
        
        console.log(`✅ Token refreshed for ${user.first_name} ${user.last_name}`);
        console.log(`   New expiry: ${newExpiresAt.toISOString()}`);
        
      } catch (error) {
        console.error(`❌ Error refreshing token for user ${user.id}:`, error.message);
      }
    }
    
    console.log('🏁 Token refresh completed');
    
  } catch (error) {
    console.error('❌ Error during token refresh:', error.message);
  }
}

refreshStravaTokens();
