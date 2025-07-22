import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../lib/auth';
import { WhoopV2Client } from '../../../lib/whoop-client';
import { WhoopDatabaseService } from '../../../lib/whoop-database';

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.accessToken) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const mode = body.mode || 'daily';
        const isDaily = mode === 'daily';

        console.log(`🔧 Running ${mode} collection with SIMPLIFIED strategy`);

        // Initialize clients
        const whoopClient = new WhoopV2Client(session.accessToken);
        const dbService = new WhoopDatabaseService();
        
        // Get user profile first
        const userProfile = await whoopClient.getUserProfile();
        await dbService.upsertUser(userProfile);

        const results = {
            user: userProfile,
            newCycles: 0,
            newSleep: 0,
            newRecovery: 0,
            newWorkouts: 0,
            errors: [] as string[],
        };

        // Date range
        let startDate: string | undefined;
        if (isDaily) {
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
            startDate = threeDaysAgo.toISOString();
        } else {
            startDate = undefined; // Get ALL historical data
        }

        console.log(`📅 Collection mode: ${mode}, Start date: ${startDate || 'ALL HISTORY'}`);

        // IMPROVED COLLECTION STRATEGY: Use collection endpoints with relationship mapping
        
        // 1. Get ALL cycles via pagination
        try {
            console.log('🔄 Fetching ALL cycles...');
            const cycles = await whoopClient.getAllCycles(startDate);
            if (cycles.length > 0) {
                await dbService.upsertCycles(cycles);
                results.newCycles = cycles.length;
                console.log(`✅ Collected ${cycles.length} cycles`);
            }
        } catch (error) {
            console.error('❌ Cycles failed:', error);
            results.errors.push(`Cycles: ${error}`);
        }

        // 2. Get ALL sleep data via collection endpoint
        try {
            console.log('🛌 Fetching ALL sleep data...');
            const sleepData = await whoopClient.getAllSleep(startDate);
            if (sleepData.length > 0) {
                await dbService.upsertSleeps(sleepData);
                results.newSleep = sleepData.length;
                console.log(`✅ Collected ${sleepData.length} sleep records`);
            }
        } catch (error) {
            console.error('❌ Sleep failed:', error);
            results.errors.push(`Sleep: ${error}`);
        }

        // 3. Get ALL recovery data via collection endpoint
        // Recovery data contains both cycle_id and sleep_id, establishing the relationship
        try {
            console.log('❤️‍🩹 Fetching ALL recovery data (with relationship mapping)...');
            const recoveryData = await whoopClient.getAllRecovery(startDate);
            if (recoveryData.length > 0) {
                // This will also update the relationships between cycles and sleep
                const { newRecoveryCount, errors } = await dbService.upsertRecoveries(recoveryData);
                results.newRecovery = newRecoveryCount;
                results.errors.push(...errors);
                console.log(`✅ Collected ${newRecoveryCount} recovery records`);
                
                // Now update the cycle_id in sleep records using the recovery data
                console.log('🔄 Updating relationships between cycles and sleep...');
                await dbService.updateSleepCycleRelationships(recoveryData);
                console.log('✅ Relationships updated successfully');
            }
        } catch (error) {
            console.error('❌ Recovery failed:', error);
            results.errors.push(`Recovery: ${error}`);
        }

        // 4. Get ALL workout data via collection endpoint
        try {
            console.log('🏃‍♂️ Fetching ALL workouts...');
            const workouts = await whoopClient.getAllWorkouts(startDate);
            if (workouts.length > 0) {
                await dbService.upsertWorkouts(workouts);
                results.newWorkouts = workouts.length;
                console.log(`✅ Collected ${workouts.length} workouts`);
            }
        } catch (error) {
            console.error('❌ Workouts failed:', error);
            results.errors.push(`Workouts: ${error}`);
        }

        // Summary
        const totalRecords = results.newCycles + results.newSleep + results.newRecovery + results.newWorkouts;
        console.log(`📊 COLLECTION COMPLETE!`);
        console.log(`  - Cycles: ${results.newCycles}`);
        console.log(`  - Sleep: ${results.newSleep}`);
        console.log(`  - Recovery: ${results.newRecovery}`);
        console.log(`  - Workouts: ${results.newWorkouts}`);
        console.log(`  - Total Records: ${totalRecords}`);
        console.log(`  - Errors: ${results.errors.length}`);

        return NextResponse.json(results);

    } catch (error) {
        console.error('Collection failed catastrophically:', error);
        return NextResponse.json({
            error: 'Collection failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'WHOOP Simple Data Collector',
        description: 'Collects data using only collection endpoints - no individual cycle queries',
        usage: 'POST with {"mode": "historical"} for all data or {"mode": "daily"} for recent data'
    });
}
