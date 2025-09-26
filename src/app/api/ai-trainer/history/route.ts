import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

interface CycleHistory {
  id: number;
  start_time: string;
  success_rate: number;
  total_questions: number;
  success_count: number;
  duration_seconds: number | null;
  status: string;
}

interface LatestCycle {
  id: number;
  success_rate: number;
  failure_analysis: string | null;
  total_questions: number;
  success_count: number;
  start_time: string;
  end_time: string | null;
  status: string;
}

export async function GET() {
  try {
    // Get evaluation cycle history for chart
    const historyResult = await sql`
      SELECT 
        id,
        start_time,
        end_time,
        success_rate,
        total_questions,
        success_count,
        failure_analysis,
        EXTRACT(EPOCH FROM (end_time - start_time)) as duration_seconds,
        CASE 
          WHEN end_time IS NULL THEN 'running'
          WHEN success_rate >= 0.9 THEN 'completed'
          ELSE 'failed'
        END as status
      FROM evaluation_cycles
      ORDER BY start_time DESC
      LIMIT 30
    `;

    // Get the latest cycle for detailed analysis
    const latestResult = await sql`
      SELECT 
        id,
        start_time,
        end_time,
        success_rate,
        failure_analysis,
        total_questions,
        success_count,
        CASE 
          WHEN end_time IS NULL THEN 'running'
          WHEN success_rate >= 0.9 THEN 'completed'
          ELSE 'failed'
        END as status
      FROM evaluation_cycles
      ORDER BY start_time DESC
      LIMIT 1
    `;

    const history: CycleHistory[] = historyResult.rows.map(row => ({
      id: row.id,
      start_time: row.start_time,
      success_rate: parseFloat(row.success_rate || '0'),
      total_questions: row.total_questions || 0,
      success_count: row.success_count || 0,
      duration_seconds: row.duration_seconds,
      status: row.status
    }));

    const latest: LatestCycle | null = latestResult.rows.length > 0 ? {
      id: latestResult.rows[0].id,
      success_rate: parseFloat(latestResult.rows[0].success_rate || '0'),
      failure_analysis: latestResult.rows[0].failure_analysis,
      total_questions: latestResult.rows[0].total_questions || 0,
      success_count: latestResult.rows[0].success_count || 0,
      start_time: latestResult.rows[0].start_time,
      end_time: latestResult.rows[0].end_time,
      status: latestResult.rows[0].status
    } : null;

    // Check if there's a currently running cycle
    const runningResult = await sql`
      SELECT COUNT(*) as running_count
      FROM evaluation_cycles
      WHERE end_time IS NULL
    `;

    const isRunning = parseInt(runningResult.rows[0].running_count) > 0;

    return NextResponse.json({
      success: true,
      data: {
        history: history.reverse(), // Reverse to show chronological order in chart
        latest,
        isRunning,
        totalCycles: history.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('💥 Failed to get AI Trainer history:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve evaluation history',
        details: error.message 
      },
      { status: 500 }
    );
  }
}