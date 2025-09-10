// 📂 src/app/api/auth/strava/callback/route.ts
/**
 * Strava OAuth Callback Endpoint
 * Handles the authorization code exchange for access tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { stravaUserService } from '@/lib/db/strava-database';
import { StravaOAuthResponse, StravaTokens, StravaProfile } from '@/types/strava-auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Handle authorization denial
    if (error) {
      console.log(`❌ Strava authorization denied: ${error}`);
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      return NextResponse.redirect(`${baseUrl}?strava_error=${error}`);
    }

    if (!code) {
      console.error('❌ No authorization code provided in callback');
      return NextResponse.json(
        { error: 'No authorization code provided' },
        { status: 400 }
      );
    }

    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('❌ Strava client credentials not configured');
      console.error(`Client ID present: ${!!clientId}`);
      console.error(`Client Secret present: ${!!clientSecret}`);
      return NextResponse.json(
        { error: 'Strava client credentials not configured' },
        { status: 500 }
      );
    }

    console.log(`🔄 Exchanging Strava authorization code for tokens...`);
    console.log(`🔧 Using Client ID: ${clientId}`);
    console.log(`🔧 Authorization code: ${code.substring(0, 10)}...`);

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
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('❌ Token exchange failed:', errorData);
      console.error(`❌ Response status: ${tokenResponse.status}`);
      console.error(`❌ Response headers:`, tokenResponse.headers);
      return NextResponse.json(
        { 
          error: 'Failed to exchange authorization code', 
          details: errorData,
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

    console.log(`✅ Received Strava OAuth data for athlete ${profile.id} (${profile.firstname} ${profile.lastname})`);

    // Save user and tokens to database
    await stravaUserService.upsertUserWithTokens(profile, tokens);

    console.log(`💾 Saved Strava user data for athlete ${profile.id}`);

    // Redirect to success page
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}?strava_connected=true&athlete_id=${profile.id}`;
    return NextResponse.redirect(successUrl);

  } catch (error) {
    console.error('❌ Error in Strava OAuth callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error details:', errorMessage);
    
    return NextResponse.json(
      { 
        error: 'Internal server error during OAuth callback',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
