// 📂 src/app/api/cron/astoria-update/route.ts
/**
 * Weekly Astoria Conquest map update cron job
 * Triggered every Monday at 1:30 PM to update the progress map
 */

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { requestMatchesAnySecret } from '@/lib/security/route-auth';

const execAsync = promisify(exec);

export const maxDuration = 300; // 5 minutes timeout for Vercel Pro

export async function POST(request: NextRequest) {
  try {
    const expected = process.env.ASTORIA_CRON_SECRET || process.env.CRON_SECRET;

    if (process.env.NODE_ENV !== 'development') {
      if (!expected) {
        return NextResponse.json({ error: 'ASTORIA_CRON_SECRET or CRON_SECRET must be configured' }, { status: 500 });
      }

      const authorized = requestMatchesAnySecret(request, [expected], { allowQuerySecret: true });
      if (!authorized) {
        console.error('❌ Unauthorized Astoria update cron request');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Dry run: validate wiring without heavy work
    const url = new URL(request.url);
    const dryRun = url.searchParams.get('dryRun') === 'true';
    if (dryRun) {
      return NextResponse.json({
        ok: true,
        endpoint: 'astoria-update',
        dryRun: true,
        schedule: 'Every Monday at 1:30 PM',
        timestamp: new Date().toISOString()
      });
    }

    console.log('🗺️ Starting Astoria Conquest map update cron job...');
    const startTime = new Date();

    // Get the project root directory
    const projectRoot = process.cwd();
    const scriptPath = path.join(projectRoot, 'backend', 'app', 'scripts', 'astoria', 'update_progress.py');

    // Check if we're in a production environment where Python might not be available
    if (process.env.VERCEL === '1' || process.env.RENDER === '1') {
      // On Vercel/Render, call the external Python worker via webhook
      const workerUrl = process.env.ASTORIA_WORKER_URL;
      const workerSecret = process.env.WORKER_WEBHOOK_SECRET;

      if (!workerUrl || !workerSecret) {
        console.error('❌ Missing ASTORIA_WORKER_URL or WORKER_WEBHOOK_SECRET env vars');
        return NextResponse.json({
          success: false,
          type: 'astoria-update',
          error: 'Worker configuration missing',
          hint: 'Set ASTORIA_WORKER_URL and WORKER_WEBHOOK_SECRET in environment variables',
          timestamp: new Date().toISOString()
        }, { status: 503 });
      }

      console.log(`📡 Calling external worker at ${workerUrl}...`);

      const webhookResponse = await fetch(`${workerUrl}/webhook/astoria-update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${workerSecret}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          triggeredBy: 'vercel-cron',
          timestamp: new Date().toISOString()
        })
      });

      const endTime = new Date();
      const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;

      if (!webhookResponse.ok) {
        const errorData = await webhookResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Worker webhook failed:', errorData);

        return NextResponse.json({
          success: false,
          type: 'astoria-update',
          error: 'Worker webhook failed',
          details: errorData,
          timestamp: endTime.toISOString(),
          durationSeconds
        }, { status: 500 });
      }

      const result = await webhookResponse.json();
      console.log(`✅ Astoria map update completed via worker in ${durationSeconds}s`);

      return NextResponse.json({
        success: true,
        type: 'astoria-update',
        workerResponse: result,
        scheduledBy: 'vercel-cron',
        updatedAt: endTime.toISOString(),
        durationSeconds
      });
    }

    // For local/self-hosted environments, run the Python script
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

    const endTime = new Date();
    const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000;

    console.log(`✅ Astoria map update completed in ${durationSeconds}s`);
    console.log('Script output:', stdout);

    if (stderr) {
      console.warn('Script warnings:', stderr);
    }

    return NextResponse.json({
      success: true,
      type: 'astoria-update',
      output: stdout,
      warnings: stderr || null,
      scheduledBy: 'vercel-cron',
      updatedAt: endTime.toISOString(),
      durationSeconds
    });

  } catch (error) {
    console.error('❌ Astoria map update cron job failed:', error);

    return NextResponse.json({
      success: false,
      type: 'astoria-update',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      failedAt: new Date().toISOString(),
      scheduledBy: 'vercel-cron'
    }, { status: 500 });
  }
}

// GET endpoint for manual testing and status checking
export async function GET() {
  try {
    return NextResponse.json({
      status: 'Astoria Conquest update cron endpoint is active',
      schedule: 'Every Monday at 1:30 PM (30 13 * * 1)',
      note: 'This endpoint requires a Python environment to run the map generation script',
      alternatives: {
        vercel: 'Not recommended (no Python support)',
        render: 'Recommended - Use Render.com background workers',
        railway: 'Recommended - Use Railway.app cron jobs',
        selfHosted: 'Works if Python 3 is available'
      },
      environment: process.env.NODE_ENV,
      isVercel: process.env.VERCEL === '1',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
