// 📂 src/app/api/auth/whoop/refresh/route.ts
/**
 * Manual WHOOP Token Refresh Endpoint
 * Only refreshes WHOOP tokens when explicitly called
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { TokenRefreshService } from '@/lib/services/token-refresh-service';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No WHOOP session found' },
        { status: 401 }
      );
    }

    const rawUserId = (session.user as any)?.user_id ?? (session.user as any)?.id;
    const userId = typeof rawUserId === 'number' ? rawUserId : parseInt(String(rawUserId), 10);
    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json(
        { error: 'Unable to resolve WHOOP user id from session' },
        { status: 400 }
      );
    }

    const tokenService = new TokenRefreshService();
    const refreshedTokens = await tokenService.getFreshTokensForUser(userId, true);
    if (!refreshedTokens) {
      return NextResponse.json(
        {
          error: 'Failed to refresh WHOOP tokens',
          requiresReauth: true,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'WHOOP tokens refreshed successfully',
      expiresAt: refreshedTokens.expiresAt,
    });

  } catch (error) {
    console.error('❌ Error refreshing WHOOP tokens:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Failed to refresh WHOOP tokens',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
