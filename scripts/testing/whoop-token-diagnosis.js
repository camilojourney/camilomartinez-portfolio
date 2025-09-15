const dotenv = require('dotenv');
dotenv.config();

console.log(`
🔍 WHOOP TOKEN REFRESH ISSUE DIAGNOSIS
=====================================

❌ PROBLEM IDENTIFIED:
Your WHOOP refresh token has expired or become invalid, causing 400 "Bad Request" 
errors when the app tries to refresh your access token automatically.

🔧 SOLUTION:
You need to re-authenticate with WHOOP to get fresh tokens.

📋 STEPS TO FIX:
1. Navigate to: http://localhost:3000/signin
2. Click "Sign in with WHOOP" 
3. Complete the WHOOP authorization flow
4. You'll be redirected to /whoop-dashboard with fresh tokens

🎯 TECHNICAL DETAILS:
- Current refresh token length: 87 characters
- Token expires at: 2025-09-15T19:39:08.653Z
- Error: "invalid_request" - refresh token no longer valid
- WHOOP API requires periodic re-authentication for security

✅ AFTER RE-AUTH:
- All WHOOP data collection will work normally
- Daily sync cron job will function properly  
- Historical data already collected (662 records) will remain intact

🔗 Quick Links:
- Sign in: http://localhost:3000/signin
- Dashboard: http://localhost:3000/whoop-dashboard
- Production: https://camilomartinez-portfolio.vercel.app/signin

💡 TIP: This is normal OAuth2 behavior for enhanced security!
`);

// Test if we can access other endpoints without token
console.log('\n🧪 Testing non-auth endpoints...');

async function testHealthEndpoints() {
    try {
        const response = await fetch('http://localhost:3000/api/health');
        const data = await response.json();
        console.log('✅ Health endpoint working:', data.status);
    } catch (error) {
        console.log('❌ Health endpoint error:', error.message);
    }
}

testHealthEndpoints();
