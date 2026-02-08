// 📂 src/app/api/auth/strava/debug/route.ts
/**
 * Strava Debug Endpoint
 * Helps troubleshoot OAuth configuration issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/security/route-auth';

export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, {
      secrets: [process.env.CRON_SECRET, process.env.STRAVA_CRON_SECRET],
      allowQuerySecret: false,
    });
    if (access.response) {
      return access.response;
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const clientId = process.env.STRAVA_CLIENT_ID;
    const hasClientSecret = !!process.env.STRAVA_CLIENT_SECRET;

    return NextResponse.json({
      message: 'Strava OAuth Debug Information',
      configuration: {
        baseUrl,
        clientId,
        hasClientSecret,
        authorizationUrl: `${baseUrl}/api/auth/strava/authorize`,
        callbackUrl: `${baseUrl}/api/auth/strava/callback`,
      },
      stravaUrls: {
        authorize: `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(`${baseUrl}/api/auth/strava/callback`)}&scope=read,activity:read_all,profile:read_all&approval_prompt=auto`,
        tokenExchange: 'https://www.strava.com/oauth/token',
      },
      troubleshooting: {
        steps: [
          '1. Verify your Strava app settings at https://www.strava.com/settings/api',
          `2. Ensure Authorization Callback Domain is set to: localhost:3000`,
          `3. Verify the callback URL matches: ${baseUrl}/api/auth/strava/callback`,
          '4. Check that both STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET are set',
          '5. Try the authorization URL manually',
        ],
        commonIssues: [
          'Callback URL mismatch between app settings and environment',
          'Incorrect client credentials',
          'App not approved for public access',
          'Missing required scopes',
        ],
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Debug endpoint error', details: errorMessage },
      { status: 500 }
    );
  }
}
