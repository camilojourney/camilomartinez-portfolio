import { Metadata } from 'next'
import { getServerAuth } from "@/lib/auth-server"
import { AuthButtons } from "@/components/features/auth/AuthButtons"
import { RecoveryChart } from "@/components/features/whoop/RecoveryChart"
import LiquidNav from '@/components/shared/liquid-nav'
import Footer from '@/components/shared/footer'
import { baseUrl } from '@/lib/site'

export const metadata: Metadata = {
    title: 'Live Health Data',
    description: 'Real-time fitness analytics from WHOOP — recovery scores, HRV trends, and resting heart rate, visualized live.',
    openGraph: {
        title: 'Live Health Data | Juan Camilo Martinez',
        description: 'Real-time fitness analytics from WHOOP — recovery, HRV, and resting heart rate.',
        url: `${baseUrl}/live-data`,
        images: [{ url: `${baseUrl}/og?title=${encodeURIComponent('Live Health Data')}` }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Live Health Data | Juan Camilo Martinez',
        description: 'Real-time fitness analytics from WHOOP — recovery, HRV, and resting heart rate.',
    },
}

async function getWhoopData(accessToken: string): Promise<any> {
    try {
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

export default async function LiveDataPage() {
    const session = await getServerAuth()
    let whoopData: any = null
    let dataError: string | null = null

    const sessionWithToken = session as typeof session & { accessToken?: string; error?: string }

    if (sessionWithToken?.accessToken && !sessionWithToken.error) {
        whoopData = await getWhoopData(sessionWithToken.accessToken)
        if (whoopData?.error) {
            dataError = whoopData.error
            whoopData = null
        }
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            <LiquidNav currentPage="my-data" />

            {/* Animated Background — matches contact/about/projects pattern */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/20 to-cyan-900/10 animate-gradient-xy"></div>
                <div className="absolute top-0 left-0 w-full h-full opacity-20">
                    <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                    <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
                    <div className="absolute top-2/3 left-1/5 w-64 h-64 bg-purple-500/8 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
                </div>
            </div>

            {/* Main Content */}
            <div className="pt-32 md:pt-40 px-4 md:px-6 pb-20">
                <div className="max-w-5xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-16">
                        <p className="hero-stagger hero-stagger-1 text-sm font-medium tracking-[0.25em] uppercase text-white/40 mb-4">
                            Live Analytics
                        </p>
                        <h1 className="hero-stagger hero-stagger-2 text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent leading-tight">
                            Health Data
                        </h1>
                        <div className="hero-stagger hero-stagger-3 w-24 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent mx-auto mb-8"></div>
                        <p className="hero-stagger hero-stagger-4 text-lg md:text-xl text-white/60 leading-relaxed max-w-2xl mx-auto">
                            Real-time recovery analytics from WHOOP — connect your account to see live HRV, recovery scores, and resting heart rate.
                        </p>
                    </div>

                    {/* Auth Section */}
                    <div className="hero-stagger hero-stagger-5 text-center mb-12">
                        <AuthButtons />
                    </div>

                    {/* Unauthenticated State */}
                    {!session && (
                        <div className="liquid-glass-card backdrop-blur-lg bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 md:p-12 text-center max-w-2xl mx-auto">
                            <svg className="w-16 h-16 text-cyan-400/50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-white mb-2">Connect Your WHOOP Account</h3>
                            <p className="text-white/60 leading-relaxed">
                                Sign in with WHOOP to see your live recovery data visualized with interactive charts.
                            </p>
                        </div>
                    )}

                    {/* Error State */}
                    {dataError && (
                        <div className="liquid-glass-card backdrop-blur-lg bg-red-500/10 border border-red-400/20 rounded-2xl p-6 mb-8 max-w-2xl mx-auto">
                            <div className="flex items-center gap-3 text-red-300">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <span className="font-medium">Error: {dataError}</span>
                            </div>
                        </div>
                    )}

                    {/* Data Visualization — Authenticated with data */}
                    {whoopData && whoopData.records && whoopData.records.length > 0 && (
                        <div className="space-y-8">
                            {/* Recovery Chart */}
                            <RecoveryChart data={whoopData.records} />

                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="liquid-glass-card backdrop-blur-lg bg-green-500/10 border border-green-400/20 rounded-2xl p-6 stat-card-hover">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-3 h-3 bg-green-400 rounded-full shadow-lg" style={{ boxShadow: '0 0 8px rgba(34,197,94,0.4)' }}></div>
                                        <span className="text-green-300 font-medium text-sm">Latest Recovery</span>
                                    </div>
                                    <div className="text-3xl font-bold text-white mb-1">
                                        {whoopData.records[0]?.score?.recovery_score || 'N/A'}%
                                    </div>
                                    <div className="text-white/50 text-sm">
                                        {new Date(whoopData.records[0]?.created_at).toLocaleDateString()}
                                    </div>
                                </div>

                                <div className="liquid-glass-card backdrop-blur-lg bg-cyan-500/10 border border-cyan-400/20 rounded-2xl p-6 stat-card-hover">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-3 h-3 bg-cyan-400 rounded-full shadow-lg" style={{ boxShadow: '0 0 8px rgba(34,211,238,0.4)' }}></div>
                                        <span className="text-cyan-300 font-medium text-sm">Avg HRV</span>
                                    </div>
                                    <div className="text-3xl font-bold text-white mb-1">
                                        {Math.round(whoopData.records.reduce((sum: number, record: any) => sum + (record.score.hrv_rmssd_ms || 0), 0) / whoopData.records.length) || 'N/A'} ms
                                    </div>
                                    <div className="text-white/50 text-sm">7-day average</div>
                                </div>

                                <div className="liquid-glass-card backdrop-blur-lg bg-purple-500/10 border border-purple-400/20 rounded-2xl p-6 stat-card-hover">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-3 h-3 bg-purple-400 rounded-full shadow-lg" style={{ boxShadow: '0 0 8px rgba(192,132,252,0.4)' }}></div>
                                        <span className="text-purple-300 font-medium text-sm">Avg RHR</span>
                                    </div>
                                    <div className="text-3xl font-bold text-white mb-1">
                                        {Math.round(whoopData.records.reduce((sum: number, record: any) => sum + (record.score.resting_heart_rate || 0), 0) / whoopData.records.length) || 'N/A'} bpm
                                    </div>
                                    <div className="text-white/50 text-sm">7-day average</div>
                                </div>
                            </div>

                            {/* Dashboard CTA */}
                            <div className="liquid-glass-card backdrop-blur-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/15 rounded-2xl p-8 text-center">
                                <h2 className="text-xl font-semibold text-white mb-3">
                                    Track Your Performance Over Time
                                </h2>
                                <p className="text-white/60 mb-6 max-w-lg mx-auto">
                                    Explore the full fitness dashboard with historical trends, strain analysis, and sleep insights.
                                </p>
                                <a
                                    href="/apps/fitness-dashboard"
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-300 px-6 py-3 rounded-xl hover:from-cyan-500/30 hover:to-blue-500/30 transition-all duration-200 font-medium"
                                >
                                    Open Fitness Dashboard
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </a>
                            </div>

                            {/* Raw Data Toggle */}
                            <details className="liquid-glass-card backdrop-blur-lg bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                                <summary className="p-6 cursor-pointer hover:bg-white/[0.03] transition-colors">
                                    <span className="text-white font-medium">View Raw API Data</span>
                                    <span className="text-white/40 text-sm ml-2">(for developers)</span>
                                </summary>
                                <div className="border-t border-white/[0.08] p-6 bg-black/20">
                                    <pre className="text-xs text-white/70 whitespace-pre-wrap overflow-x-auto font-mono">
                                        {JSON.stringify(whoopData, null, 2)}
                                    </pre>
                                </div>
                            </details>
                        </div>
                    )}

                    {/* Authenticated but no data */}
                    {whoopData && (!whoopData.records || whoopData.records.length === 0) && (
                        <div className="liquid-glass-card backdrop-blur-lg bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 md:p-12 text-center max-w-2xl mx-auto">
                            <svg className="w-16 h-16 text-cyan-400/50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-white mb-2">No Recovery Data Available</h3>
                            <p className="text-white/60 leading-relaxed">
                                Your WHOOP account is connected, but no recovery data was found. Make sure you have recovery data in your WHOOP app.
                            </p>
                        </div>
                    )}

                    {/* Chart Loading Skeleton — shown when authenticated but data is still loading */}
                    {session && !whoopData && !dataError && (
                        <div className="space-y-8">
                            {/* Chart skeleton */}
                            <div className="liquid-glass-card backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-2 h-2 rounded-full bg-cyan-400/30 animate-pulse"></div>
                                    <div className="h-5 w-48 bg-white/[0.06] rounded-lg animate-pulse"></div>
                                </div>
                                <div className="h-80 flex items-end gap-3 px-4">
                                    {[65, 45, 80, 55, 70, 40, 75].map((h, i) => (
                                        <div
                                            key={i}
                                            className="flex-1 bg-white/[0.04] rounded-t-md animate-pulse"
                                            style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }}
                                        ></div>
                                    ))}
                                </div>
                            </div>

                            {/* Stats skeleton */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="liquid-glass-card backdrop-blur-lg bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-3 h-3 bg-white/[0.1] rounded-full animate-pulse"></div>
                                            <div className="h-3 w-24 bg-white/[0.06] rounded animate-pulse"></div>
                                        </div>
                                        <div className="h-8 w-20 bg-white/[0.06] rounded-lg animate-pulse mb-2"></div>
                                        <div className="h-3 w-16 bg-white/[0.04] rounded animate-pulse"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    )
}
