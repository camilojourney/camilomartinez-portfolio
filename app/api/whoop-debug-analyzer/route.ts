import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../lib/auth';
import { WhoopV2Client } from '../../../lib/whoop-client';

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.accessToken) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        console.log('🔍 DEBUG: Starting WHOOP API analysis...');

        const whoopClient = new WhoopV2Client(session.accessToken);
        const results = {
            user: null,
            cycleAnalysis: {},
            sleepAnalysis: {},
            recoveryAnalysis: {},
            workoutAnalysis: {},
            apiEndpointTests: {}
        };

        // Get user profile
        results.user = await whoopClient.getUserProfile();
        console.log('👤 User:', results.user.first_name, results.user.last_name);

        // Test each endpoint individually to understand the data structure

        // 1. Test cycles endpoint (recent data)
        try {
            console.log('🔄 Testing cycles endpoint...');
            const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // Last 7 days
            const recentCycles = await whoopClient.getAllCycles(recentDate);

            // Try historical cycles (no start date)
            const allCycles = await whoopClient.getAllCycles();

            results.cycleAnalysis = {
                recentCycles: recentCycles.length,
                allCycles: allCycles.length,
                sampleCycle: allCycles[0] || null,
                dateRange: {
                    oldest: allCycles.length > 0 ? allCycles[allCycles.length - 1]?.created_at : null,
                    newest: allCycles.length > 0 ? allCycles[0]?.created_at : null
                }
            };

            console.log(`📊 Cycles found - Recent (7 days): ${recentCycles.length}, All time: ${allCycles.length}`);

        } catch (error) {
            results.cycleAnalysis = { error: error.message };
            console.error('❌ Cycles error:', error);
        }

        // 2. Test sleep endpoint
        try {
            console.log('🛌 Testing sleep endpoint...');
            const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const recentSleep = await whoopClient.getAllSleep(recentDate);
            const allSleep = await whoopClient.getAllSleep();

            results.sleepAnalysis = {
                recentSleep: recentSleep.length,
                allSleep: allSleep.length,
                sampleSleep: allSleep[0] || null
            };

            console.log(`🛌 Sleep found - Recent: ${recentSleep.length}, All time: ${allSleep.length}`);

        } catch (error) {
            results.sleepAnalysis = { error: error.message };
            console.error('❌ Sleep error:', error);
        }

        // 3. Test recovery endpoint
        try {
            console.log('❤️‍🩹 Testing recovery endpoint...');
            const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const recentRecovery = await whoopClient.getAllRecovery(recentDate);
            const allRecovery = await whoopClient.getAllRecovery();

            results.recoveryAnalysis = {
                recentRecovery: recentRecovery.length,
                allRecovery: allRecovery.length,
                sampleRecovery: allRecovery[0] || null
            };

            console.log(`❤️‍🩹 Recovery found - Recent: ${recentRecovery.length}, All time: ${allRecovery.length}`);

        } catch (error) {
            results.recoveryAnalysis = { error: error.message };
            console.error('❌ Recovery error:', error);
        }

        // 4. Test workout endpoint
        try {
            console.log('🏃‍♂️ Testing workout endpoint...');
            const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const recentWorkouts = await whoopClient.getAllWorkouts(recentDate);
            const allWorkouts = await whoopClient.getAllWorkouts();

            results.workoutAnalysis = {
                recentWorkouts: recentWorkouts.length,
                allWorkouts: allWorkouts.length,
                sampleWorkout: allWorkouts[0] || null
            };

            console.log(`🏃‍♂️ Workouts found - Recent: ${recentWorkouts.length}, All time: ${allWorkouts.length}`);

        } catch (error) {
            results.workoutAnalysis = { error: error.message };
            console.error('❌ Workout error:', error);
        }

        // 5. Test individual cycle endpoints (the problematic ones)
        if (results.cycleAnalysis.allCycles > 0 && !results.cycleAnalysis.error) {
            try {
                const cycles = await whoopClient.getAllCycles();
                const testCycle = cycles[0];

                console.log(`🧪 Testing individual cycle endpoints with cycle ID: ${testCycle.id}`);

                // Test individual sleep endpoint
                try {
                    const cycleSleep = await whoopClient.getSleep(testCycle.id);
                    results.apiEndpointTests.sleepById = { success: true, data: cycleSleep };
                } catch (error) {
                    results.apiEndpointTests.sleepById = { success: false, error: error.message };
                }

                // Test individual recovery endpoint
                try {
                    const cycleRecovery = await whoopClient.getRecovery(testCycle.id);
                    results.apiEndpointTests.recoveryById = { success: true, data: cycleRecovery };
                } catch (error) {
                    results.apiEndpointTests.recoveryById = { success: false, error: error.message };
                }

            } catch (error) {
                results.apiEndpointTests = { error: 'Could not test individual endpoints: ' + error.message };
            }
        }

        console.log('🎉 DEBUG analysis complete!');
        return NextResponse.json(results, { status: 200 });

    } catch (error) {
        console.error('💥 DEBUG analysis failed:', error);
        return NextResponse.json({
            error: 'Analysis failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'WHOOP API Debug Analyzer',
        description: 'This endpoint analyzes all WHOOP API endpoints to understand data availability and structure',
        usage: 'Send a POST request to analyze your WHOOP data'
    });
}
