// Test script for WHOOP cron endpoints
async function testCronEndpoints() {
    const CRON_SECRET = process.env.CRON_SECRET || 'test-secret';
    const BASE_URL = 'http://localhost:3000';

    console.log('🧪 Testing WHOOP cron endpoints...\n');

    // Test daily-data-fetch
    try {
        console.log('📊 Testing daily-data-fetch endpoint...');
        const dataFetchResponse = await fetch(`${BASE_URL}/api/cron/daily-data-fetch`, {
            headers: {
                'Authorization': `Bearer ${CRON_SECRET}`
            }
        });

        const dataFetchResult = await dataFetchResponse.json();
        console.log('Response status:', dataFetchResponse.status);
        console.log('Response body:', JSON.stringify(dataFetchResult, null, 2));
    } catch (error) {
        console.error('❌ daily-data-fetch error:', error.message);
    }

    console.log('\n-----------------------------------\n');

    // Test daily-whoop-sync
    try {
        console.log('🔄 Testing daily-whoop-sync endpoint...');
        const syncResponse = await fetch(`${BASE_URL}/api/cron/daily-whoop-sync`, {
            headers: {
                'Authorization': `Bearer ${CRON_SECRET}`
            }
        });

        const syncResult = await syncResponse.json();
        console.log('Response status:', syncResponse.status);
        console.log('Response body:', JSON.stringify(syncResult, null, 2));
    } catch (error) {
        console.error('❌ daily-whoop-sync error:', error.message);
    }
}

testCronEndpoints().catch(console.error);
