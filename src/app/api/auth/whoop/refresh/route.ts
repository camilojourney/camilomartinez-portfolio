// 📂 src/app/api/auth/whoop/refresh/route.ts
/**
 * Manual WHOOP Token Refresh Endpoint
 * Only refreshes WHOOP tokens when explicitly called
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { TokenRefreshService } from '@/lib/services/token-refresh-service';
import { WhoopDatabaseService } from '@/lib/db/whoop-database';

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await auth();
    
    if (!session || !session.refreshToken) {
      return NextResponse.json(
        { error: 'No WHOOP session or refresh token found' },
        { status: 401 }
      );
    }

    console.log('🔄 Manual WHOOP token refresh requested...');
    
    // Refresh the tokens
    const tokenService = new TokenRefreshService();
    const refreshedTokens = await tokenService.refreshWhoopToken(session.refreshToken as string);

    // Update database if we have user info
    if (session.user) {
      try {
        const dbService = new WhoopDatabaseService();
        await dbService.upsertUserWithTokens(session.user as any, refreshedTokens);
        console.log('✅ Updated WHOOP tokens in database');
      } catch (error) {
        console.error('❌ Failed to update WHOOP tokens in database:', error);
      }
    }

    console.log('✅ WHOOP tokens refreshed successfully');
    
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
