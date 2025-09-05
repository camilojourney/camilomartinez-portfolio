import { NextRequest, NextResponse } from 'next/server'

function baseUrl() {
  const url = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'
  return url.startsWith('http') ? url : `https://${url}`
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET
    if (!secret) {
      return NextResponse.json({ ok: false, error: 'CRON_SECRET not configured' }, { status: 500 })
    }

    const body = await request.json().catch(() => ({}))
    const dryRun = body?.dryRun === true

    const url = new URL('/api/cron/daily-data-fetch', baseUrl())
    url.searchParams.set('secret', secret)
    if (dryRun) url.searchParams.set('dryRun', 'true')

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'x-cron-secret': secret },
    })

    const text = await res.text()
    let data: any
    try { data = JSON.parse(text) } catch { data = { raw: text } }

    return NextResponse.json({ status: res.status, ok: res.ok, data })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

