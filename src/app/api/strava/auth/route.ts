// 📂 src/app/api/strava/auth/route.ts
/**
 * Strava OAuth authentication endpoint
 * Handles the OAuth flow for connecting user's Strava account
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * GET endpoint - Redirect to secure Strava OAuth handler
 */
export async function GET(request: NextRequest) {
  const url = new URL('/api/auth/strava/authorize', request.url);
  return NextResponse.redirect(url);
}

/**
 * POST endpoint - Disabled for security reasons
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Endpoint deprecated',
      message: 'Use /api/auth/strava/authorize and /api/auth/strava/callback for OAuth.',
    },
    { status: 410 }
  );
}

/**
 * DELETE endpoint - Disabled for security reasons
 */
export async function DELETE() {
  return NextResponse.json(
    {
      error: 'Endpoint deprecated',
      message: 'Token revocation should be handled through a server-authenticated integration endpoint.',
    },
    { status: 410 }
  );
}
