import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
    try {
        const session = await auth();
        const sessionWithToken = session as typeof session & { 
            accessToken?: string; 
            refreshToken?: string;
            expiresAt?: number;
            error?: string; 
        };

        const now = Math.floor(Date.now() / 1000);
        const isExpired = sessionWithToken?.expiresAt ? now > sessionWithToken.expiresAt : true;
        const timeToExpiry = sessionWithToken?.expiresAt ? sessionWithToken.expiresAt - now : 0;

        return NextResponse.json({
            authenticated: !!session,
            hasAccessToken: !!sessionWithToken?.accessToken,
            hasRefreshToken: !!sessionWithToken?.refreshToken,
            tokenExpired: isExpired,
            timeToExpirySeconds: timeToExpiry,
            timeToExpiryHuman: timeToExpiry > 0 ? `${Math.floor(timeToExpiry / 60)} minutes` : 'Expired',
            expiresAt: sessionWithToken?.expiresAt,
            currentTime: now,
            error: sessionWithToken?.error,
            user: session?.user ? {
                name: session.user.name,
                email: session.user.email
            } : null,
            diagnosis: {
                canMakeAPICall: !!sessionWithToken?.accessToken && !isExpired && !sessionWithToken?.error,
                needsReAuth: isExpired || !!sessionWithToken?.error || !sessionWithToken?.accessToken,
                reason: isExpired ? 'Token expired' : 
                       sessionWithToken?.error ? `Auth error: ${sessionWithToken.error}` :
                       !sessionWithToken?.accessToken ? 'No access token' : 'Unknown'
            }
        });
    } catch (error) {
        return NextResponse.json({
            error: 'Failed to check auth status',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
