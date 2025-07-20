import { NextResponse } from 'next/server';
import { auth } from '../../../lib/auth';

export async function GET() {
    try {
        const session = await auth();

        if (!session?.accessToken) {
            return NextResponse.json({
                error: 'Not authenticated or no access token available',
                session: session ? 'Session exists but no token' : 'No session'
            }, { status: 401 });
        }

        return NextResponse.json({
            success: true,
            accessToken: session.accessToken,
            user: session.user,
            expires: session.expires,
            instructions: {
                message: "Copy this token to your .env.local file",
                envVariable: "WHOOP_ACCESS_TOKEN",
                example: `WHOOP_ACCESS_TOKEN=${session.accessToken}`
            }
        });

    } catch (error) {
        console.error('Debug token error:', error);
        return NextResponse.json({
            error: 'Failed to get token',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
