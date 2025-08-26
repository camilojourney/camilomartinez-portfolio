import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/services/auth/auth';
import { WhoopV2Client } from '@/lib/whoop';
import { WhoopDatabaseService } from '@/lib/db/whoop-database';

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.accessToken) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const mode = body.mode || 'daily';
        const isDaily = mode === 'daily';

        console.log(`🔧 Running ${mode} collection with OPTIMIZED strategy`);

        // Initialize clients
        const whoopClient = new WhoopV2Client(session.accessToken);
        const dbService = new WhoopDatabaseService();

        // Get user profile first
        const userProfile = await whoopClient.getUserProfile();
        await dbService.upsertUser(userProfile);

        // Collect data based on mode (daily or historical)
        const results = await whoopClient.collectData(isDaily);

        // Store data in database
        await dbService.storeCollectedData(results);

        return NextResponse.json({
            success: true,
            ...results,
        });
    } catch (error) {
        console.error('Collection failed:', error);
        return NextResponse.json({
            error: 'Collection failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'WHOOP Data API',
        endpoints: {
            'POST /api/whoop/data': 'Collect WHOOP fitness data',
            'GET /api/whoop/data': 'Get API info'
        },
        usage: {
            daily: 'POST with {"mode": "daily"} for recent data',
            historical: 'POST with {"mode": "historical"} for all data'
        }
    });
}
