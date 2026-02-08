// 📂 src/app/api/ai-trainer/history/route.ts
/**
 * AI Trainer History API Route (Real Database Connection)
 * 
 * This endpoint fetches real evaluation history from your PostgreSQL database.
 * Connects to the same database as your FastAPI backend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { requireAdminAccess } from '@/lib/security/route-auth';

// Database connection using your actual Neon PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminAccess(request, {
      secrets: [process.env.CRON_SECRET],
      allowQuerySecret: false,
    });
    if (access.response) {
      return access.response;
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const user_id = searchParams.get('user_id') || 'trainer-user';

    const client = await pool.connect();
    
    try {
      // Fetch real evaluation history from your database
      const evaluationsResult = await client.query(`
        SELECT 
          id,
          user_id,
          evaluation_data,
          analysis_period_days,
          confidence_score,
          created_at,
          updated_at
        FROM ai_trainer_evaluations 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `, [user_id, limit]);

      // Also fetch evaluation cycles data
      const cyclesResult = await client.query(`
        SELECT 
          id,
          start_time,
          end_time,
          total_questions,
          success_count,
          success_rate,
          failure_analysis,
          created_at
        FROM evaluation_cycles 
        ORDER BY created_at DESC 
        LIMIT $1
      `, [limit]);

      // Fetch recent query history for additional context
      const queryHistoryResult = await client.query(`
        SELECT 
          id,
          user_question,
          was_successful,
          latency_ms,
          created_at,
          user_friendly_answer
        FROM query_history 
        ORDER BY created_at DESC 
        LIMIT $1
      `, [Math.min(limit * 2, 20)]);

      return NextResponse.json({
        status: 'success',
        data: {
          evaluations: evaluationsResult.rows,
          cycles: cyclesResult.rows,
          recent_queries: queryHistoryResult.rows,
          total_evaluations: evaluationsResult.rows.length,
          database_connected: true
        },
        timestamp: new Date().toISOString(),
        source: 'nextjs-real-database'
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('AI Trainer history database error:', error);
    
    return NextResponse.json({
      status: 'error',
      error: 'Failed to fetch evaluation history',
      message: error instanceof Error ? error.message : 'Database connection error',
      timestamp: new Date().toISOString(),
      source: 'nextjs-real-database'
    }, { 
      status: 500 
    });
  }
}
