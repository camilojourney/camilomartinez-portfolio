// Quick test to check current token status
const { WhoopDatabaseService } = require('./src/lib/db/whoop-database.js');

async function checkTokenStatus() {
    try {
        const dbService = new WhoopDatabaseService();
        const users = await dbService.getAllUsersWithTokens();
        
        console.log(`Found ${users.length} users with tokens:`);
        
        for (const user of users) {
            const expiresAt = user.token_expires_at ? new Date(user.token_expires_at) : null;
            const now = new Date();
            const timeUntilExpiry = expiresAt ? Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60)) : null;
            
            console.log(`\nUser ${user.id} (${user.first_name} ${user.last_name}):`);
            console.log(`  Access Token: ${user.access_token ? 'Present (' + user.access_token.substring(0, 20) + '...)' : 'Missing'}`);
            console.log(`  Refresh Token: ${user.refresh_token ? 'Present' : 'Missing'}`);
            console.log(`  Expires At: ${expiresAt ? expiresAt.toISOString() : 'Unknown'}`);
            console.log(`  Time Until Expiry: ${timeUntilExpiry !== null ? timeUntilExpiry + ' minutes' : 'Unknown'}`);
            console.log(`  Token Status: ${timeUntilExpiry && timeUntilExpiry > 0 ? '✅ Valid' : '❌ Expired'}`);
        }
        
    } catch (error) {
        console.error('Error checking token status:', error);
    }
}

checkTokenStatus();
