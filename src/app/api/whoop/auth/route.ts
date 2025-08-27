import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        const sessionWithToken = session as typeof session & { accessToken?: string };
        
        if (!sessionWithToken?.accessToken) {
            return NextResponse.json({
                error: 'Not authenticated',
                suggestion: 'Please sign in to WHOOP first'
            }, { status: 401 });
        }

        return NextResponse.json({
            authenticated: true,
            user: sessionWithToken.user,
            expires: sessionWithToken.expires
        });
    } catch (error) {
        console.error('Auth check error:', error);
        return NextResponse.json({
            error: 'Authentication check failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        const sessionWithToken = session as typeof session & { accessToken?: string };
        
        if (!sessionWithToken?.accessToken) {
            return NextResponse.json({
                error: 'Not authenticated',
                suggestion: 'Please sign in to WHOOP first'
            }, { status: 401 });
        }

        // Trigger token refresh if needed
        await auth();

        return NextResponse.json({
            success: true,
            message: 'Authentication refreshed successfully',
            user: sessionWithToken.user,
            expires: sessionWithToken.expires
        });
    } catch (error) {
        console.error('Auth refresh error:', error);
        return NextResponse.json({
            error: 'Authentication refresh failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
