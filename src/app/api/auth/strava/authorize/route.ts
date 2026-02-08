// 📂 src/app/api/auth/strava/authorize/route.ts
/**
 * Strava OAuth Authorization Endpoint
 * Redirects users to Strava for authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

function resolveBaseUrl(request: NextRequest): string {
  const configured = process.env.NEXTAUTH_URL || process.env.VERCEL_URL;
  if (configured) {
    return configured.startsWith('http') ? configured : `https://${configured}`;
  }
  return request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.STRAVA_CLIENT_ID;
    const baseUrl = resolveBaseUrl(request);
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Strava client ID not configured' },
        { status: 500 }
      );
    }

    const callbackUrl = `${baseUrl}/api/auth/strava/callback`;
    const oauthState = randomUUID();
    
    const authUrl = new URL('https://www.strava.com/oauth/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', callbackUrl);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'read,activity:read_all,profile:read_all');
    authUrl.searchParams.set('approval_prompt', 'auto');
    authUrl.searchParams.set('state', oauthState);

    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set('strava_oauth_state', oauthState, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60,
      path: '/api/auth/strava/callback',
    });

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create authorization URL', details: errorMessage },
      { status: 500 }
    );
  }
}
