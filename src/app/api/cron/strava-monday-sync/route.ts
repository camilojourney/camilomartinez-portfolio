// 📂 src/app/api/cron/strava-monday-sync/route.ts
/**
 * Unified Monday sync cron job
 * Combines Strava weekly sync + Astoria map update into a single cron endpoint
 * Triggered every Monday at 1 PM
 *
 * This unified approach reduces Vercel's cron job count while maintaining all functionality.
 */

import { NextRequest, NextResponse } from 'next/server';
import { StravaDataSyncCoordinator } from '@/lib/services/strava-data-sync';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export const maxDuration = 300; // 5 minutes timeout for Vercel Pro

interface StravaSyncResult {
  success: boolean;
  totalUsers: number;
  totalActivitiesImported: number;
  totalErrors: number;
  durationSeconds: number;
  results?: any[];
  error?: string;
}

interface AstoriaUpdateResult {
  success: boolean;
  durationSeconds: number;
  output?: string;
  workerResponse?: any;
  error?: string;
}

interface MondaySyncResponse {
  success: boolean;
  strava: StravaSyncResult;
  astoria: AstoriaUpdateResult;
  totalDurationSeconds: number;
  syncedAt: string;
  scheduledBy: string;
}

export async function POST(request: NextRequest) {
  const overallStartTime = new Date();

  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret') || url.searchParams.get('token');
    const expected = process.env.CRON_SECRET;

    // For development, allow bypass if no secret is set
    if (process.env.NODE_ENV !== 'development' && (authHeader !== `Bearer ${expected}` && secret !== expected)) {
      console.error('❌ Unauthorized Monday sync cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Dry run: validate wiring without heavy work
    const dryRun = url.searchParams.get('dryRun') === 'true';
    if (dryRun) {
      return NextResponse.json({
        ok: true,
        endpoint: 'strava-monday-sync',
        dryRun: true,
        schedule: 'Every Monday at 1 PM',
        includes: ['strava-weekly-sync', 'astoria-update'],
        timestamp: new Date().toISOString()
      });
    }

    console.log('🗓️ Starting unified Monday sync cron job...');
    console.log('📋 Tasks: 1) Strava weekly sync, 2) Astoria map update');

    // ============================================
    // TASK 1: STRAVA WEEKLY SYNC
    // ============================================
    console.log('\n📊 [1/2] Starting Strava weekly sync...');
    const stravaStartTime = new Date();
    let stravaResult: StravaSyncResult;

    try {
      const syncCoordinator = new StravaDataSyncCoordinator();
      const results = await syncCoordinator.runWeeklySyncForAllUsers();

      const stravaEndTime = new Date();
      const stravaDuration = (stravaEndTime.getTime() - stravaStartTime.getTime()) / 1000;

      stravaResult = {
        success: true,
        totalUsers: results.length,
        totalActivitiesImported: results.reduce((sum, r) => sum + r.successfulImports, 0),
        totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
        durationSeconds: stravaDuration,
        results: results
      };

      console.log(`✅ Strava sync completed in ${stravaDuration}s`);
      console.log(`   - Users synced: ${stravaResult.totalUsers}`);
      console.log(`   - Activities imported: ${stravaResult.totalActivitiesImported}`);
      console.log(`   - Errors: ${stravaResult.totalErrors}`);

    } catch (stravaError) {
      const stravaEndTime = new Date();
      const stravaDuration = (stravaEndTime.getTime() - stravaStartTime.getTime()) / 1000;

      stravaResult = {
        success: false,
        totalUsers: 0,
        totalActivitiesImported: 0,
        totalErrors: 1,
        durationSeconds: stravaDuration,
        error: stravaError instanceof Error ? stravaError.message : 'Unknown error'
      };

      console.error(`❌ Strava sync failed:`, stravaError);
    }

    // ============================================
    // TASK 2: ASTORIA MAP UPDATE
    // ============================================
    console.log('\n🗺️ [2/2] Starting Astoria Conquest map update...');
    const astoriaStartTime = new Date();
    let astoriaResult: AstoriaUpdateResult;

    try {
      // Check if we're in production (Vercel/Render)
      if (process.env.VERCEL === '1' || process.env.RENDER === '1') {
        // Production: Call external Python worker via webhook
        const workerUrl = process.env.ASTORIA_WORKER_URL;
        const workerSecret = process.env.WORKER_WEBHOOK_SECRET;

        if (!workerUrl || !workerSecret) {
          throw new Error('Missing ASTORIA_WORKER_URL or WORKER_WEBHOOK_SECRET env vars');
        }

        console.log(`📡 Calling external worker at ${workerUrl}...`);

        const webhookResponse = await fetch(`${workerUrl}/webhook/astoria-update`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${workerSecret}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            triggeredBy: 'strava-monday-sync-cron',
            timestamp: new Date().toISOString()
          })
        });

        if (!webhookResponse.ok) {
          const errorData = await webhookResponse.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(`Worker webhook failed: ${JSON.stringify(errorData)}`);
        }

        const workerData = await webhookResponse.json();
        const astoriaEndTime = new Date();
        const astoriaDuration = (astoriaEndTime.getTime() - astoriaStartTime.getTime()) / 1000;

        astoriaResult = {
          success: true,
          durationSeconds: astoriaDuration,
          workerResponse: workerData
        };

        console.log(`✅ Astoria map update completed via worker in ${astoriaDuration}s`);

      } else {
        // Local/self-hosted: Run Python script directly
        const projectRoot = process.cwd();
        const scriptPath = path.join(projectRoot, 'backend', 'app', 'scripts', 'astoria', 'update_progress.py');

        const { stdout, stderr } = await execAsync(
          `cd ${projectRoot}/backend && python3 ${scriptPath}`,
          {
            timeout: 300000, // 5 minutes
            env: {
              ...process.env,
              PYTHONUNBUFFERED: '1'
            }
          }
        );

        const astoriaEndTime = new Date();
        const astoriaDuration = (astoriaEndTime.getTime() - astoriaStartTime.getTime()) / 1000;

        astoriaResult = {
          success: true,
          durationSeconds: astoriaDuration,
          output: stdout
        };

        console.log(`✅ Astoria map update completed locally in ${astoriaDuration}s`);
        if (stderr) {
          console.warn('Script warnings:', stderr);
        }
      }

    } catch (astoriaError) {
      const astoriaEndTime = new Date();
      const astoriaDuration = (astoriaEndTime.getTime() - astoriaStartTime.getTime()) / 1000;

      astoriaResult = {
        success: false,
        durationSeconds: astoriaDuration,
        error: astoriaError instanceof Error ? astoriaError.message : 'Unknown error'
      };

      console.error(`❌ Astoria map update failed:`, astoriaError);
    }

    // ============================================
    // FINAL RESULTS
    // ============================================
    const overallEndTime = new Date();
    const totalDuration = (overallEndTime.getTime() - overallStartTime.getTime()) / 1000;

    const overallSuccess = stravaResult.success && astoriaResult.success;

    const response: MondaySyncResponse = {
      success: overallSuccess,
      strava: stravaResult,
      astoria: astoriaResult,
      totalDurationSeconds: totalDuration,
      syncedAt: overallEndTime.toISOString(),
      scheduledBy: 'vercel-cron'
    };

    console.log(`\n${overallSuccess ? '✅' : '⚠️'} Monday sync completed in ${totalDuration}s`);
    console.log('📊 Summary:');
    console.log(`   - Strava: ${stravaResult.success ? '✅' : '❌'} (${stravaResult.durationSeconds}s)`);
    console.log(`   - Astoria: ${astoriaResult.success ? '✅' : '❌'} (${astoriaResult.durationSeconds}s)`);

    return NextResponse.json(response, {
      status: overallSuccess ? 200 : 207 // 207 = Multi-Status (partial success)
    });

  } catch (error) {
    const overallEndTime = new Date();
    const totalDuration = (overallEndTime.getTime() - overallStartTime.getTime()) / 1000;

    console.error('❌ Monday sync cron job failed:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      totalDurationSeconds: totalDuration,
      failedAt: overallEndTime.toISOString(),
      scheduledBy: 'vercel-cron'
    }, { status: 500 });
  }
}

// GET endpoint for manual testing and status checking
export async function GET() {
  try {
    return NextResponse.json({
      status: 'Strava Monday sync cron endpoint is active',
      schedule: 'Every Monday at 1 PM (0 13 * * 1)',
      tasks: [
        {
          name: 'Strava Weekly Sync',
          description: 'Syncs new running activities from Strava for all users',
          duration: 'Typically 10-30 seconds'
        },
        {
          name: 'Astoria Conquest Map Update',
          description: 'Updates progress map with latest coverage data',
          duration: 'Typically 5-15 seconds (production: calls worker webhook)'
        }
      ],
      endpoints: {
        cronEndpoint: 'POST /api/cron/strava-monday-sync (requires CRON_SECRET)',
        manualStravaSync: 'POST /api/strava/sync/weekly (requires authentication)',
        stravaSyncStatus: 'GET /api/strava/sync-status'
      },
      environment: process.env.NODE_ENV,
      isProduction: process.env.VERCEL === '1',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
