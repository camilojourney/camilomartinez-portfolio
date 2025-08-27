import { auth } from "@/lib/auth"
import { AuthButtons } from "@/components/features/auth/AuthButtons"
import { RecoveryChart } from "@/components/features/whoop/RecoveryChart"
import LiquidPage from '@/components/shared/liquid-page'

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

import { Session } from "next-auth"

export default async function LiveDataPage() {
    const session = await auth()
    let whoopData: any = null
    let dataError: string | null = null

    // Cast session to include accessToken property
    const sessionWithToken = session as typeof session & { accessToken?: string; error?: string }
    
    if (sessionWithToken?.accessToken && !sessionWithToken.error) {
        whoopData = await getWhoopData(sessionWithToken.accessToken)
        if (whoopData?.error) {
            dataError = whoopData.error
            whoopData = null
        }
    }

    return (
        <LiquidPage currentPage="about" backgroundVariant="cool">
            {/* Main content card */}
            <section className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-8 md:p-12 max-w-6xl w-full shadow-2xl shadow-black/20">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-extralight text-white mb-6 drop-shadow-lg">
                        Live WHOOP Data Demo
                    </h1>
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-orange-400/60 to-transparent mx-auto mb-8"></div>
                    <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-3xl mx-auto font-light">
                        This is a live demonstration of integrating real-time fitness data from the WHOOP API.
                        Connect your WHOOP account to see your actual recovery data visualized in real-time.
                    </p>
                </div>

                {/* Auth Section */}
                <div className="text-center mb-12">
                    <AuthButtons />
                </div>

                {/* Data Visualization Section */}
                {!session && (
                    <div className="liquid-glass-card backdrop-blur-lg bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 text-center">
                        <svg className="w-16 h-16 text-orange-400/50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-white mb-2">Connect Your WHOOP Account</h3>
                        <p className="text-white/60 leading-relaxed">
                            Click the button above to securely connect your WHOOP account and see your live recovery data visualized below.
                        </p>
                    </div>
                )}

                {dataError && (
                    <div className="liquid-glass-card backdrop-blur-lg bg-red-500/10 border border-red-400/20 rounded-2xl p-6 mb-8">
                        <div className="flex items-center gap-3 text-red-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <span className="font-medium">Error: {dataError}</span>
                        </div>
                    </div>
                )}

                {whoopData && whoopData.records && whoopData.records.length > 0 && (
                    <div className="space-y-8">
                        {/* Recovery Chart */}
                        <RecoveryChart data={whoopData.records} />

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="liquid-glass-card backdrop-blur-lg bg-green-500/10 border border-green-400/20 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                    <span className="text-green-300 font-medium text-sm">Latest Recovery</span>
                                </div>
                                <div className="text-2xl font-bold text-white mb-1">
                                    {whoopData.records[0]?.score?.recovery_score || 'N/A'}%
                                </div>
                                <div className="text-white/60 text-sm">
                                    {new Date(whoopData.records[0]?.created_at).toLocaleDateString()}
                                </div>
                            </div>

                            <div className="liquid-glass-card backdrop-blur-lg bg-blue-500/10 border border-blue-400/20 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                                    <span className="text-blue-300 font-medium text-sm">Avg HRV</span>
                                </div>
                                <div className="text-2xl font-bold text-white mb-1">
                                    {Math.round(whoopData.records.reduce((sum: number, record: any) => sum + (record.score.hrv_rmssd_milli || 0), 0) / whoopData.records.length) || 'N/A'} ms
                                </div>
                                <div className="text-white/60 text-sm">7-day average</div>
                            </div>

                            <div className="liquid-glass-card backdrop-blur-lg bg-purple-500/10 border border-purple-400/20 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                                    <span className="text-purple-300 font-medium text-sm">Avg RHR</span>
                                </div>
                                <div className="text-2xl font-bold text-white mb-1">
                                    {Math.round(whoopData.records.reduce((sum: number, record: any) => sum + (record.score.resting_heart_rate || 0), 0) / whoopData.records.length) || 'N/A'} bpm
                                </div>
                                <div className="text-white/60 text-sm">7-day average</div>
                            </div>
                        </div>

                        {/* Raw Data Toggle */}
                        <details className="liquid-glass-card backdrop-blur-lg bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                            <summary className="p-6 cursor-pointer hover:bg-white/[0.03] transition-colors">
                                <span className="text-white font-medium">View Raw API Data</span>
                                <span className="text-white/60 text-sm ml-2">(for developers)</span>
                            </summary>
                            <div className="border-t border-white/[0.08] p-6 bg-black/20">
                                <pre className="text-xs text-white/80 whitespace-pre-wrap overflow-x-auto">
                                    {JSON.stringify(whoopData, null, 2)}
                                </pre>
                            </div>
                        </details>
                    </div>
                )}

                {/* Advanced Analytics Section - Always show if user is authenticated */}
                {session && (
                    <div className="mt-12 space-y-8">
                        {/* Personal Dashboard Link */}
                        <div className="liquid-glass-card backdrop-blur-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-400/20 rounded-2xl p-8 text-center">
                            <h2 className="text-2xl font-semibold text-white mb-4">
                                Want to Track Your Performance Over Time?
                            </h2>
                            <p className="text-white/70 mb-6">
                                Check out the comprehensive performance dashboard with historical charts and insights.
                            </p>
                            <a
                                href="/my-stats"
                                className="inline-block bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 text-purple-300 px-6 py-3 rounded-lg hover:bg-purple-500/30 transition-colors"
                            >
                                View My Performance Dashboard →
                            </a>
                        </div>

                        {/* Strain vs Sleep Chart */}
                        <div className="liquid-glass-card backdrop-blur-lg bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8">
                            <h2 className="text-2xl font-semibold text-white mb-6 text-center">
                                Advanced Analytics Dashboard
                            </h2>
                            <p className="text-white/70 text-center mb-8">
                                These charts use stored data from your WHOOP account to show insights about strain, sleep performance, recovery, and workout patterns.
                            </p>
                            <div className="text-center py-12">
                                <div className="text-white/60 text-lg mb-4">📊 Charts Available in My Stats</div>
                                <div className="text-white/40 mb-6">Visit the My Stats page to see your beautiful performance charts</div>
                                <a
                                    href="/my-stats"
                                    className="inline-block bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 text-purple-300 px-6 py-3 rounded-lg hover:bg-purple-500/30 transition-colors"
                                >
                                    View My Stats Dashboard →
                                </a>
                            </div>
                        </div>

                        {/* Workout Analytics */}
                        <div className="liquid-glass-card backdrop-blur-lg bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8">
                            <h2 className="text-2xl font-semibold text-white mb-6 text-center">
                                Workout Analytics
                            </h2>
                            <p className="text-white/70 text-center mb-8">
                                Analyze your workout patterns over time with detailed breakdowns by sport type.
                            </p>

                            {/* Workout Count Chart */}
                            <div className="mb-12">
                                {/* Workout Count Chart removed */}
                            </div>

                            {/* Workout Hours Chart */}
                            <div>
                                {/* Workout Hours Chart removed */}
                            </div>
                        </div>
                    </div>
                )}

                {whoopData && (!whoopData.records || whoopData.records.length === 0) && (
                    <div className="liquid-glass-card backdrop-blur-lg bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 text-center">
                        <svg className="w-16 h-16 text-cyan-400/50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-white mb-2">No Recovery Data Available</h3>
                        <p className="text-white/60 leading-relaxed">
                            Your WHOOP account is connected, but no recovery data was found. Make sure you have recovery data in your WHOOP app.
                        </p>
                    </div>
                )}
            </section>
        </LiquidPage>
    )
}
