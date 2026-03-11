import { NextResponse } from 'next/server';
import { sql } from '@/lib/db/db';

// Public endpoint — returns Juan's latest fitness snapshot for the chatbot
// Queries aggregated views and fitness tables directly from Neon
export async function GET() {
  try {
    // Latest recovery (correct column names from whoop_recovery)
    const recovery = await sql`
      SELECT
        r.recovery_percentage,
        r.hrv_rmssd_ms,
        r.resting_heart_rate_bpm,
        TO_CHAR(c.start_time AT TIME ZONE 'America/New_York', 'Mon DD') AS date
      FROM whoop_recovery r
      JOIN whoop_cycles c ON r.cycle_id = c.id
      WHERE r.recovery_percentage IS NOT NULL
      ORDER BY c.start_time DESC
      LIMIT 1
    `;

    // Latest sleep
    const sleep = await sql`
      SELECT
        sleep_performance_percentage,
        sleep_efficiency_percentage,
        ROUND(total_in_bed_time_ms / 3600000.0, 1) AS hours_in_bed,
        ROUND(total_slow_wave_sleep_time_ms / 3600000.0, 2) AS sws_hours,
        ROUND(total_rem_sleep_time_ms / 3600000.0, 2) AS rem_hours,
        TO_CHAR(start_time AT TIME ZONE 'America/New_York', 'Mon DD') AS date
      FROM whoop_sleep
      WHERE sleep_performance_percentage IS NOT NULL
        AND is_nap = false
      ORDER BY start_time DESC
      LIMIT 1
    `;

    // Latest strain (whoop_cycles)
    const strain = await sql`
      SELECT
        strain,
        avg_heart_rate_bpm,
        max_heart_rate_bpm,
        kilojoule,
        TO_CHAR(start_time AT TIME ZONE 'America/New_York', 'Mon DD') AS date
      FROM whoop_cycles
      WHERE strain IS NOT NULL
      ORDER BY start_time DESC
      LIMIT 1
    `;

    // Latest Strava run (correct column names)
    const run = await sql`
      SELECT
        name,
        sport_type,
        ROUND((distance_meters / 1000.0)::numeric, 1) AS km,
        ROUND((elapsed_time_seconds / 60.0)::numeric) AS minutes,
        TO_CHAR(start_date AT TIME ZONE 'America/New_York', 'Mon DD') AS date,
        total_elevation_gain
      FROM strava_runs
      WHERE sport_type IN ('Run', 'TrailRun', 'Walk')
      ORDER BY start_date DESC
      LIMIT 1
    `;

    // Latest week from weekly_habits_summary
    const weekly = await sql`
      SELECT
        meditation_count,
        workout_count,
        ROUND(avg_wake_hour::numeric, 1) AS avg_wake_hour,
        ROUND(avg_sleep_start_hour::numeric, 1) AS avg_sleep_start_hour,
        TO_CHAR(week_start_date, 'Mon DD') AS week_start
      FROM weekly_habits_summary
      ORDER BY week_start_date DESC
      LIMIT 1
    `;

    // 7-day avg recovery
    const avgRecovery = await sql`
      SELECT ROUND(AVG(r.recovery_percentage)) AS avg_recovery
      FROM whoop_recovery r
      JOIN whoop_cycles c ON r.cycle_id = c.id
      WHERE r.recovery_percentage IS NOT NULL
        AND c.start_time >= NOW() - INTERVAL '7 days'
    `;

    const r = recovery.rows[0];
    const s = sleep.rows[0];
    const st = strain.rows[0];
    const ru = run.rows[0];
    const w = weekly.rows[0];
    const avg = avgRecovery.rows[0];

    const lines: string[] = [];

    if (r) lines.push(`Recovery: ${r.recovery_percentage}% (${r.date}) | HRV: ${Math.round(Number(r.hrv_rmssd_ms))}ms | RHR: ${r.resting_heart_rate_bpm}bpm`);
    if (avg?.avg_recovery) lines.push(`7-day avg recovery: ${avg.avg_recovery}%`);
    if (s) lines.push(`Sleep: ${s.sleep_performance_percentage}% performance, ${s.hours_in_bed}h in bed, ${s.sws_hours}h deep, ${s.rem_hours}h REM (${s.date})`);
    if (st) lines.push(`Strain: ${Number(st.strain).toFixed(1)} | Avg HR: ${st.avg_heart_rate_bpm}bpm | Max: ${st.max_heart_rate_bpm}bpm (${st.date})`);
    if (ru) lines.push(`Last ${ru.sport_type}: ${ru.km}km in ${ru.minutes}min, ${ru.total_elevation_gain}m gain (${ru.date}) — ${ru.name}`);
    if (w) lines.push(`This week: ${w.workout_count} workouts, ${w.meditation_count} meditations | Avg wake: ${w.avg_wake_hour}h | Avg sleep: ${w.avg_sleep_start_hour}h (week of ${w.week_start})`);

    return NextResponse.json({
      ok: true,
      snapshot: lines.join('\n'),
      data: { recovery: r, sleep: s, strain: st, run: ru, weekly: w, avgRecovery: avg?.avg_recovery },
    });
  } catch (err) {
    console.error('chatbot context error:', err);
    return NextResponse.json({ ok: false, snapshot: '', data: {}, error: String(err) });
  }
}
