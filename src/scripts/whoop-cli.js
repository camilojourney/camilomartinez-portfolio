#!/usr/bin/env node

const fetch = require('node-fetch');

// Test script for WHOOP data collection
async function testCollector(mode = 'daily') {
    console.log(`🧪 Testing WHOOP collector in ${mode} mode...`);

    try {
        // Test the optimized v2 collector
        const response = await fetch('http://localhost:3000/api/whoop-collector-v2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ mode }),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('❌ Error:', result);
            return;
        }

        console.log('📊 Collection Results:');
        console.log(`  - Cycles: ${result.newCycles}`);
        console.log(`  - Sleep: ${result.newSleep}`);
        console.log(`  - Recovery: ${result.newRecovery}`);
        console.log(`  - Workouts: ${result.newWorkouts}`);
        console.log(`  - Errors: ${result.errors?.length || 0}`);

        if (result.errors?.length > 0) {
            console.log('⚠️ Errors encountered:');
            result.errors.forEach(error => console.log(`  - ${error}`));
        }

    } catch (error) {
        console.error('💥 Test failed:', error.message);
    }
}

// Parse command line arguments
const mode = process.argv[2] || 'daily';
if (!['daily', 'historical'].includes(mode)) {
    console.log('Usage: node whoop-cli.js [daily|historical]');
    process.exit(1);
}

testCollector(mode).then(() => {
    console.log('✅ Test completed');
    process.exit(0);
}).catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
});
