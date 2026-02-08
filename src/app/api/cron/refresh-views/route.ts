import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getErrorMessage } from '@/lib/utils/errors';
import { requestMatchesAnySecret } from '@/lib/security/route-auth';

const connectionString = process.env.POSTGRES_URL_NONPRISMA;

// Reuse a single pool across invocations to avoid exhausting connections in serverless environments.
const pool = connectionString ? new Pool({ connectionString }) : null;

/**
 * API endpoint triggered by external cron jobs to refresh all materialized views.
 * For safety, requests must include an Authorization header when CRON_SECRET_KEY is configured.
 */
export async function GET(req: NextRequest) {
  try {
    if (!pool) {
      console.error('Missing POSTGRES_URL_NONPRISMA environment variable for refresh-views cron.');
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection string is not configured.',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    const secret = process.env.CRON_SECRET_KEY || process.env.CRON_SECRET;
    if (process.env.NODE_ENV !== 'development' && !secret) {
      return NextResponse.json({ error: 'CRON_SECRET_KEY or CRON_SECRET must be configured' }, { status: 500 });
    }

    if (secret && !requestMatchesAnySecret(req, [secret], { allowQuerySecret: false })) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await pool.connect();
    try {
      await client.query('SELECT refresh_all_materialized_views();');
    } finally {
      client.release();
    }

    console.log('Materialized views refreshed successfully.');
    return NextResponse.json({ success: true, refreshedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error refreshing materialized views:', error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
