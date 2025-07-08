import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.email || !session.accessToken) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const accessToken = session.accessToken;
        const baseUrl = 'https://api.prod.whoop.com/developer';

        // Test basic connectivity
        console.log('Testing WHOOP API connectivity...');
        
        // Get user profile
        const userResponse = await fetch(`${baseUrl}/v1/user/profile/basic`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!userResponse.ok) {
            throw new Error(`User profile fetch failed: ${userResponse.status}`);
        }

        const userData = await userResponse.json();

        // Test cycles endpoint
        const cyclesResponse = await fetch(`${baseUrl}/v1/cycle?limit=5`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        let cyclesData: any = null;
        if (cyclesResponse.ok) {
            cyclesData = await cyclesResponse.json();
        }

        // Test workouts endpoint
        const workoutsResponse = await fetch(`${baseUrl}/v1/activity/workout?limit=5`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        let workoutsData: any = null;
        if (workoutsResponse.ok) {
            workoutsData = await workoutsResponse.json();
        }

        return NextResponse.json({
            success: true,
            message: 'WHOOP API test successful',
            user: {
                id: userData.user_id,
                firstName: userData.first_name,
                lastName: userData.last_name
            },
            endpoints: {
                cycles: {
                    status: cyclesResponse.status,
                    count: cyclesData?.records?.length || 0
                },
                workouts: {
                    status: workoutsResponse.status,
                    count: workoutsData?.records?.length || 0
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('WHOOP API test error:', error);
        return NextResponse.json({
            error: 'WHOOP API test failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
