// 📂 src/app/api/auth/strava/authorize/route.ts
/**
 * Strava OAuth Authorization Endpoint
 * Redirects users to Strava for authorization
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get client credentials
    const clientId = process.env.STRAVA_CLIENT_ID;
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    if (!clientId) {
      console.error('❌ STRAVA_CLIENT_ID not configured');
      return NextResponse.json(
        { error: 'Strava client ID not configured' },
        { status: 500 }
      );
    }

    // Construct callback URL explicitly
    const callbackUrl = `${baseUrl}/api/auth/strava/callback`;
    
    console.log(`🔧 Using callback URL: ${callbackUrl}`);
    console.log(`🔧 Client ID: ${clientId}`);

    // Strava OAuth authorization URL
    const authUrl = new URL('https://www.strava.com/oauth/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', callbackUrl);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'read,activity:read_all,profile:read_all');
    authUrl.searchParams.set('approval_prompt', 'auto');

    console.log(`🔗 Redirecting to Strava authorization: ${authUrl.toString()}`);

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('❌ Error creating Strava authorization URL:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create authorization URL', details: errorMessage },
      { status: 500 }
    );
  }
}
