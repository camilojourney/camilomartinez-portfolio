#!/usr/bin/env node
// Lightweight local smoke test for cron endpoints with dryRun

const fs = require('fs')

const BASE = process.env.NEXTAUTH_URL || 'http://localhost:3000'
let SECRET = process.env.CRON_SECRET

// Best-effort load from .env if not set
if (!SECRET && fs.existsSync('.env')) {
  try {
    const lines = fs.readFileSync('.env', 'utf8').split(/\r?\n/)
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx === -1) continue
      const key = trimmed.slice(0, idx).trim()
      let val = trimmed.slice(idx + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (!(key in process.env)) process.env[key] = val
    }
    SECRET = process.env.CRON_SECRET
  } catch {}
}

if (!SECRET) {
  console.error('CRON_SECRET not set in environment or .env')
  process.exit(1)
}

async function ping(path) {
  const url = new URL(path, BASE)
  url.searchParams.set('secret', SECRET)
  url.searchParams.set('dryRun', 'true')
  const started = Date.now()
  const res = await fetch(url.toString(), { method: 'GET' })
  const ms = Date.now() - started
  let body = null
  try { body = await res.json() } catch {}
  return { path: url.pathname, status: res.status, ok: res.ok, ms, body }
}

async function main() {
  const endpoints = [
    '/api/health',
    '/api/cron/daily-data-fetch',
    '/api/cron/refresh-tokens',
    '/api/cron/strava-sync',
    '/api/cron/daily-whoop-sync',
  ]
  const results = []
  for (const p of endpoints) {
    try {
      const r = await ping(p)
      results.push(r)
    } catch (err) {
      results.push({ path: p, status: 0, ok: false, error: err instanceof Error ? err.message : String(err) })
    }
  }
  console.table(results.map(r => ({ path: r.path, status: r.status, ok: r.ok, ms: r.ms || '-', note: r.body?.endpoint || r.body?.checks ? 'ok' : '' })))
  const failures = results.filter(r => !r.ok)
  if (failures.length) process.exit(2)
}

main()
