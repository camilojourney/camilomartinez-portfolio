// 📂 src/app/api/auth/strava/callback/route.ts
/**
 * Strava OAuth Callback Endpoint
 * Handles the authorization code exchange for access tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { stravaUserService } from '@/lib/db/strava-database';
import { StravaOAuthResponse, StravaTokens, StravaProfile } from '@/types/strava-auth';

function resolveBaseUrl(request: NextRequest): string {
  const configured = process.env.NEXTAUTH_URL || process.env.VERCEL_URL;
  if (configured) {
    return configured.startsWith('http') ? configured : `https://${configured}`;
  }
  return request.nextUrl.origin;
}

function buildErrorRedirect(baseUrl: string, errorCode: string): string {
  return `${baseUrl}?strava_error=${encodeURIComponent(errorCode)}`;
}

export async function GET(request: NextRequest) {
  try {
    const baseUrl = resolveBaseUrl(request);
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');
    const storedState = request.cookies.get('strava_oauth_state')?.value;

    // Handle authorization denial
    if (error) {
      const denied = NextResponse.redirect(buildErrorRedirect(baseUrl, error));
      denied.cookies.delete('strava_oauth_state');
      return denied;
    }

    if (!state || !storedState || state !== storedState) {
      const invalidState = NextResponse.redirect(buildErrorRedirect(baseUrl, 'invalid_state'));
      invalidState.cookies.delete('strava_oauth_state');
      return invalidState;
    }

    if (!code) {
      return NextResponse.json(
        { error: 'No authorization code provided' },
        { status: 400 }
      );
    }

    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Strava client credentials not configured' },
        { status: 500 }
      );
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${baseUrl}/api/auth/strava/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.json(
        { 
          error: 'Failed to exchange authorization code',
          status: tokenResponse.status
        },
        { status: 400 }
      );
    }

    const oauthData: StravaOAuthResponse = await tokenResponse.json();
    
    // Convert Unix timestamp to Date
    const expiresAt = new Date(oauthData.expires_at * 1000);

    // Prepare tokens object
    const tokens: StravaTokens = {
      accessToken: oauthData.access_token,
      refreshToken: oauthData.refresh_token,
      expiresAt,
      scopes: oauthData.scope,
    };

    // Prepare user profile
    const profile: StravaProfile = {
      id: oauthData.athlete.id,
      email: '', // Strava doesn't provide email in OAuth response
      firstname: oauthData.athlete.firstname || '',
      lastname: oauthData.athlete.lastname || '',
      username: oauthData.athlete.username || '',
      city: oauthData.athlete.city || '',
      state: oauthData.athlete.state || '',
      country: oauthData.athlete.country || '',
      sex: oauthData.athlete.sex || undefined,
      profilePictureUrl: oauthData.athlete.profile || '',
    };

    // Save user and tokens to database
    await stravaUserService.upsertUserWithTokens(profile, tokens);

    // Redirect to success page
    const successUrl = `${baseUrl}?strava_connected=true&athlete_id=${profile.id}`;
    const successResponse = NextResponse.redirect(successUrl);
    successResponse.cookies.delete('strava_oauth_state');
    return successResponse;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Internal server error during OAuth callback',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
