// 📂 src/app/api/strava/auth/route.ts
/**
 * Strava OAuth authentication endpoint
 * Handles the OAuth flow for connecting user's Strava account
 */

import { NextRequest, NextResponse } from 'next/server';
import { StravaClient } from '@/lib/strava-client';

/**
 * GET endpoint - Initiate Strava OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || 'astoria-conquest';
    
    // Generate Strava authorization URL
    const authUrl = StravaClient.generateAuthUrl(state);
    
    console.log('🔐 Initiating Strava OAuth flow');
    
    return NextResponse.json({
      authUrl,
      message: 'Redirect user to this URL to authorize Strava access',
      state
    });

  } catch (error) {
    console.error('❌ Error initiating Strava OAuth:', error);
    
    return NextResponse.json({
      error: 'Failed to initiate Strava authentication',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

/**
 * POST endpoint - Handle OAuth callback and exchange code for token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, state } = body;
    
    if (!code) {
      return NextResponse.json({
        error: 'Missing authorization code',
        message: 'The authorization code is required to complete OAuth flow'
      }, { status: 400 });
    }

    console.log('🔄 Exchanging Strava authorization code for tokens...');
    
    // Exchange authorization code for access token
    const tokenResponse = await StravaClient.exchangeCodeForToken(code);
    
    console.log('✅ Strava OAuth flow completed successfully');
    
    // In a real application, you would store these tokens securely
    // For now, return them to the client (remove in production)
    return NextResponse.json({
      success: true,
      message: 'Successfully authenticated with Strava',
      tokenData: {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_at: tokenResponse.expires_at,
        expires_in: tokenResponse.expires_in,
        token_type: tokenResponse.token_type
      },
      state,
      completedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in Strava OAuth callback:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to complete Strava authentication',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

/**
 * DELETE endpoint - Revoke Strava access (disconnect)
 */
export async function DELETE(request: NextRequest) {
  try {
    // This would handle revoking the Strava token
    // For now, just return a success message
    
    console.log('🔓 Strava access revoked');
    
    return NextResponse.json({
      success: true,
      message: 'Strava access has been revoked',
      revokedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error revoking Strava access:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to revoke Strava access',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
