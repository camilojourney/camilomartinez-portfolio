// Use lazy-loaded auth to prevent NextAuth initialization issues in dev mode
import { getServerAuth } from "@/lib/auth-server"
import { AuthButtons } from "@/components/features/auth/AuthButtons"
import { RecoveryChart } from "@/components/features/whoop/RecoveryChart"
import PageShell from '@/components/shared/page-shell'

async function getWhoopData(accessToken: string): Promise<any> {
    try {
        // Fetch the last 7 days of recovery data using v2 API
        const response = await fetch('https://api.prod.whoop.com/developer/v2/recovery?limit=7', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })

        if (!response.ok) {
            console.error('WHOOP API Error:', response.status, response.statusText)
            return { error: `Failed to fetch WHOOP data: ${response.status}` }
        }

        return await response.json()
    } catch (error) {
        console.error('WHOOP API Fetch Error:', error)
        return { error: 'Network error connecting to WHOOP' }
    }
}

function average(records: any[], pick: (r: any) => number | undefined): number | null {
    if (!records.length) return null
    const value = Math.round(records.reduce((sum, r) => sum + (pick(r) || 0), 0) / records.length)
    return Number.isFinite(value) && value > 0 ? value : null
}

export default async function LiveDataPage() {
    const session = await getServerAuth()
    let whoopData: any = null

    // Cast session to include accessToken property
    const sessionWithToken = session as typeof session & { accessToken?: string; error?: string }
    let dataError: string | null = session && (!sessionWithToken?.accessToken || sessionWithToken.error)
        ? 'Your WHOOP session has expired. Disconnect and reconnect your WHOOP account.'
        : null

    if (sessionWithToken?.accessToken && !sessionWithToken.error) {
        whoopData = await getWhoopData(sessionWithToken.accessToken)
        if (whoopData?.error) {
            dataError = whoopData.error
            whoopData = null
        }
    }

    const records: any[] = whoopData?.records ?? []
    const latestRecovery = records[0]?.score?.recovery_score
    const avgHrv = average(records, (r) => r.score?.hrv_rmssd_ms)
    const avgRhr = average(records, (r) => r.score?.resting_heart_rate)

    return (
        <PageShell currentPage="apps" maxWidth="wide">
            <header className="rise-in border-b border-line pb-10 md:pb-14">
                <h1 className="display">Live WHOOP data demo</h1>
                <p className="lede mt-6">
                    A live demonstration of integrating real-time fitness data from the WHOOP API. Connect your WHOOP
                    account to see your actual recovery data visualized in real time.
                </p>
                <div className="mt-8">
                    <AuthButtons />
                </div>
            </header>

            <div className="space-y-10 py-10 md:py-14">
                {!session && (
                    <div className="panel panel-pad max-w-2xl">
                        <h2 className="title-sm">Connect your WHOOP account</h2>
                        <p className="body-muted mt-2">
                            Click the button above to securely connect your WHOOP account and see your live recovery data
                            visualized below.
                        </p>
                    </div>
                )}

                {dataError && (
                    <p role="alert" className="max-w-2xl rounded-md border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
                        Error: {dataError}
                    </p>
                )}

                {records.length > 0 && (
                    <>
                        <RecoveryChart data={records} />

                        <dl className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
                            {[
                                { label: 'Latest recovery', value: latestRecovery != null ? `${latestRecovery}%` : 'N/A', note: new Date(records[0]?.created_at).toLocaleDateString() },
                                { label: 'Avg HRV', value: avgHrv != null ? `${avgHrv} ms` : 'N/A', note: '7-day average' },
                                { label: 'Avg RHR', value: avgRhr != null ? `${avgRhr} bpm` : 'N/A', note: '7-day average' },
                            ].map((s) => (
                                <div key={s.label} className="bg-surface p-6">
                                    <dt className="caption">{s.label}</dt>
                                    <dd className="mt-2 font-serif text-4xl text-ink tabular-nums">{s.value}</dd>
                                    <dd className="caption mt-1">{s.note}</dd>
                                </div>
                            ))}
                        </dl>

                        <details className="panel overflow-hidden">
                            <summary className="cursor-pointer px-6 py-4 text-sm font-medium text-ink hover:bg-surface-2">
                                View raw API data <span className="text-muted">(for developers)</span>
                            </summary>
                            <pre className="overflow-x-auto border-t border-line bg-page p-6 font-mono text-xs text-muted">
                                {JSON.stringify(whoopData, null, 2)}
                            </pre>
                        </details>
                    </>
                )}

                {session && (
                    <section className={records.length > 0 ? 'border-t border-line pt-10' : ''} aria-labelledby="perf-heading">
                        <h2 id="perf-heading" className="title-md">Want to Track Your Performance Over Time?</h2>
                        <p className="body-muted mt-2 max-w-lg">
                            Check out the comprehensive performance dashboard with historical charts and insights.
                        </p>
                        <a href="/apps/fitness-dashboard" className="btn-primary mt-5">
                            View My Performance Dashboard →
                        </a>
                    </section>
                )}

                {session && (
                    <section className="border-t border-line pt-10" aria-labelledby="analytics-heading">
                        <h2 id="analytics-heading" className="title-md">Advanced Analytics Dashboard</h2>
                        <p className="body-muted mt-2">
                            These charts use stored data from your WHOOP account to show insights about strain, sleep performance, recovery, and workout patterns.
                        </p>
                        <p className="mt-6 text-ink">📊 Charts Available in Fitness Dashboard</p>
                        <p className="body-muted mt-2">Visit the Fitness Dashboard to see your beautiful performance charts</p>
                        <a href="/apps/fitness-dashboard" className="btn-primary mt-5">
                            Open Fitness Dashboard →
                        </a>
                    </section>
                )}

                {session && (
                    <section className="border-t border-line pt-10" aria-labelledby="workout-heading">
                        <h2 id="workout-heading" className="title-md">Workout Analytics</h2>
                        <p className="body-muted mt-2">
                            Analyze your workout patterns over time with detailed breakdowns by sport type.
                        </p>
                    </section>
                )}

                {whoopData && records.length === 0 && (
                    <div className="panel panel-pad max-w-2xl" role="status">
                        <h2 className="title-sm">No recovery data available</h2>
                        <p className="body-muted mt-2">
                            Your WHOOP account is connected, but no recovery data was found. Make sure you have recovery data in
                            your WHOOP app.
                        </p>
                    </div>
                )}
            </div>
        </PageShell>
    )
}
