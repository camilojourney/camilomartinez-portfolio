import { NextResponse } from 'next/server'
import { sql } from '@/lib/db/db'

function bool(v: any) { return !!v }

export async function GET() {
  const startedAt = Date.now()
  const env = {
    AUTH_SECRET: bool(process.env.AUTH_SECRET),
    CRON_SECRET: bool(process.env.CRON_SECRET),
    POSTGRES_URL: bool(process.env.POSTGRES_URL || process.env.DATABASE_URL),
    WHOOP_CLIENT_ID: bool(process.env.WHOOP_CLIENT_ID),
    WHOOP_CLIENT_SECRET: bool(process.env.WHOOP_CLIENT_SECRET),
    STRAVA_CLIENT_ID: bool(process.env.STRAVA_CLIENT_ID),
    STRAVA_CLIENT_SECRET: bool(process.env.STRAVA_CLIENT_SECRET),
  }

  const checks: any = {
    uptimeMs: 0,
    db: { ok: false },
    postgis: { ok: false },
  }

  // DB connectivity check
  try {
    const r = await sql`SELECT 1 as ok`;
    checks.db = { ok: r?.rows?.[0]?.ok === 1 }
  } catch (err) {
    checks.db = { ok: false, error: err instanceof Error ? err.message : String(err) }
  }

  // PostGIS check (optional)
  try {
    const r = await sql`SELECT PostGIS_Version() as version`;
    checks.postgis = { ok: !!r?.rows?.[0]?.version, version: r?.rows?.[0]?.version || null }
  } catch (_err) {
    checks.postgis = { ok: false }
  }

  checks.uptimeMs = Date.now() - startedAt

  const ok = env.AUTH_SECRET && env.CRON_SECRET && env.POSTGRES_URL && checks.db.ok

  return NextResponse.json({
    ok,
    env,
    checks,
    timestamp: new Date().toISOString(),
  }, { status: ok ? 200 : 500 })
}

