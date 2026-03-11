import { NextResponse } from 'next/server';
import { sql } from '@/lib/db/db';

// Public endpoint — returns Juan's latest fitness snapshot for the chatbot
// No auth needed — only aggregated/non-sensitive stats
export async function GET() {
  try {
    // Latest recovery score
    const recovery = await sql`
      SELECT
        r.recovery_score,
        r.hrv_rmssd_milli,
        r.resting_heart_rate,
        TO_CHAR(c.start_time, 'Mon DD') AS date
      FROM whoop_recovery r
      JOIN whoop_cycles c ON r.cycle_id = c.id
      WHERE r.recovery_score IS NOT NULL
      ORDER BY c.start_time DESC
      LIMIT 1
    `;

    // Latest sleep
    const sleep = await sql`
      SELECT
        sleep_performance_percentage,
        ROUND(total_in_bed_time_ms / 3600000.0, 1) AS hours_in_bed,
        TO_CHAR(start_time, 'Mon DD') AS date
      FROM whoop_sleep
      WHERE sleep_performance_percentage IS NOT NULL
        AND is_nap = false
      ORDER BY start_time DESC
      LIMIT 1
    `;

    // Latest strain
    const strain = await sql`
      SELECT
        strain,
        TO_CHAR(start_time, 'Mon DD') AS date
      FROM whoop_cycles
      WHERE strain IS NOT NULL
      ORDER BY start_time DESC
      LIMIT 1
    `;

    // 7-day avg recovery
    const avgRecovery = await sql`
      SELECT ROUND(AVG(r.recovery_score)) AS avg_recovery
      FROM whoop_recovery r
      JOIN whoop_cycles c ON r.cycle_id = c.id
      WHERE r.recovery_score IS NOT NULL
        AND c.start_time >= NOW() - INTERVAL '7 days'
    `;

    // Latest Strava run
    const latestRun = await sql`
      SELECT
        name,
        ROUND(distance / 1000.0, 1) AS km,
        TO_CHAR(start_date, 'Mon DD') AS date,
        ROUND(elapsed_time / 60.0) AS minutes
      FROM strava_activities
      WHERE type = 'Run'
      ORDER BY start_date DESC
      LIMIT 1
    `;

    const r = recovery.rows[0];
    const s = sleep.rows[0];
    const st = strain.rows[0];
    const avg = avgRecovery.rows[0];
    const run = latestRun.rows[0];

    // Build a natural language snapshot
    const lines: string[] = [];

    if (r) lines.push(`Recovery: ${r.recovery_score}% (${r.date}) | HRV: ${Math.round(r.hrv_rmssd_milli)}ms | RHR: ${r.resting_heart_rate}bpm`);
    if (s) lines.push(`Sleep: ${s.sleep_performance_percentage}% performance, ${s.hours_in_bed}h in bed (${s.date})`);
    if (st) lines.push(`Strain: ${parseFloat(st.strain).toFixed(1)} (${st.date})`);
    if (avg?.avg_recovery) lines.push(`7-day avg recovery: ${avg.avg_recovery}%`);
    if (run) lines.push(`Last run: ${run.km}km in ${run.minutes}min (${run.date}) — ${run.name}`);

    return NextResponse.json({
      ok: true,
      snapshot: lines.join('\n'),
      data: { recovery: r, sleep: s, strain: st, avgRecovery: avg?.avg_recovery, latestRun: run },
    });
  } catch (err) {
    console.error('chatbot context error:', err);
    return NextResponse.json({ ok: false, snapshot: '', data: {} });
  }
}
