'use client'

import { AuthButtons } from "@/components/features/auth/AuthButtons"
import { RecoveryChart } from "@/components/features/whoop/RecoveryChart"
import ScrollReveal from '@/components/shared/scroll-reveal'
import TextReveal from '@/components/shared/text-reveal'
import MagneticButton from '@/components/shared/magnetic-button'

interface LiveDataClientProps {
    session: any
    whoopData: any
    dataError: string | null
}

export default function LiveDataClient({ session, whoopData, dataError }: LiveDataClientProps) {
    return (
        <section className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-8 md:p-12 max-w-6xl w-full shadow-2xl shadow-black/20">
            {/* Header */}
            <div className="text-center mb-12">
                <TextReveal
                    as="h1"
                    className="text-4xl md:text-5xl font-extralight text-white mb-6 drop-shadow-lg"
                    delay={0.1}
                >
                    Live WHOOP Data Demo
                </TextReveal>
                <ScrollReveal delay={0.2}>
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-orange-400/60 to-transparent mx-auto mb-8"></div>
                </ScrollReveal>
                <ScrollReveal delay={0.3}>
                    <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-3xl mx-auto font-light">
                        This is a live demonstration of integrating real-time fitness data from the WHOOP API.
                        Connect your WHOOP account to see your actual recovery data visualized in real-time.
                    </p>
                </ScrollReveal>
            </div>

            {/* Auth Section */}
            <ScrollReveal delay={0.4}>
                <div className="text-center mb-12">
                    <AuthButtons />
                </div>
            </ScrollReveal>

            {/* Data Visualization Section */}
            {!session && (
                <ScrollReveal delay={0.5}>
                    <div className="liquid-glass-card backdrop-blur-lg bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 text-center">
                        <svg className="w-16 h-16 text-orange-400/50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-white mb-2">Connect Your WHOOP Account</h3>
                        <p className="text-white/60 leading-relaxed">
                            Click the button above to securely connect your WHOOP account and see your live recovery data visualized below.
                        </p>
                    </div>
                </ScrollReveal>
            )}

            {dataError && (
                <ScrollReveal>
                    <div className="liquid-glass-card backdrop-blur-lg bg-red-500/10 border border-red-400/20 rounded-2xl p-6 mb-8">
                        <div className="flex items-center gap-3 text-red-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <span className="font-medium">Error: {dataError}</span>
                        </div>
                    </div>
                </ScrollReveal>
            )}

            {whoopData && whoopData.records && whoopData.records.length > 0 && (
                <div className="space-y-8">
                    {/* Recovery Chart */}
                    <ScrollReveal delay={0.2}>
                        <RecoveryChart data={whoopData.records} />
                    </ScrollReveal>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ScrollReveal delay={0.3} staggerIndex={0}>
                            <div className="liquid-glass-card backdrop-blur-lg bg-green-500/10 border border-green-400/20 rounded-2xl p-6 stat-card-hover">
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
                        </ScrollReveal>

                        <ScrollReveal delay={0.3} staggerIndex={1}>
                            <div className="liquid-glass-card backdrop-blur-lg bg-blue-500/10 border border-blue-400/20 rounded-2xl p-6 stat-card-hover">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                                    <span className="text-blue-300 font-medium text-sm">Avg HRV</span>
                                </div>
                                <div className="text-2xl font-bold text-white mb-1">
                                    {Math.round(whoopData.records.reduce((sum: number, record: any) => sum + (record.score.hrv_rmssd_ms || 0), 0) / whoopData.records.length) || 'N/A'} ms
                                </div>
                                <div className="text-white/60 text-sm">7-day average</div>
                            </div>
                        </ScrollReveal>

                        <ScrollReveal delay={0.3} staggerIndex={2}>
                            <div className="liquid-glass-card backdrop-blur-lg bg-purple-500/10 border border-purple-400/20 rounded-2xl p-6 stat-card-hover">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                                    <span className="text-purple-300 font-medium text-sm">Avg RHR</span>
                                </div>
                                <div className="text-2xl font-bold text-white mb-1">
                                    {Math.round(whoopData.records.reduce((sum: number, record: any) => sum + (record.score.resting_heart_rate || 0), 0) / whoopData.records.length) || 'N/A'} bpm
                                </div>
                                <div className="text-white/60 text-sm">7-day average</div>
                            </div>
                        </ScrollReveal>
                    </div>

                    {/* Raw Data Toggle */}
                    <ScrollReveal delay={0.5}>
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
                    </ScrollReveal>
                </div>
            )}

            {/* Advanced Analytics Section - Always show if user is authenticated */}
            {session && (
                <div className="mt-12 space-y-8">
                    {/* Personal Dashboard Link */}
                    <ScrollReveal>
                        <div className="liquid-glass-card backdrop-blur-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-400/20 rounded-2xl p-8 text-center">
                            <h2 className="text-2xl font-semibold text-white mb-4">
                                Want to Track Your Performance Over Time?
                            </h2>
                            <p className="text-white/70 mb-6">
                                Check out the comprehensive performance dashboard with historical charts and insights.
                            </p>
                            <MagneticButton
                                as="a"
                                href="/apps/fitness-dashboard"
                                className="inline-block bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 text-purple-300 px-6 py-3 rounded-lg hover:bg-purple-500/30 transition-colors"
                            >
                                View My Performance Dashboard
                            </MagneticButton>
                        </div>
                    </ScrollReveal>

                    {/* Strain vs Sleep Chart */}
                    <ScrollReveal delay={0.15}>
                        <div className="liquid-glass-card backdrop-blur-lg bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8">
                            <h2 className="text-2xl font-semibold text-white mb-6 text-center">
                                Advanced Analytics Dashboard
                            </h2>
                            <p className="text-white/70 text-center mb-8">
                                These charts use stored data from your WHOOP account to show insights about strain, sleep performance, recovery, and workout patterns.
                            </p>
                            <div className="text-center py-12">
                                <div className="text-white/60 text-lg mb-4">Charts Available in Fitness Dashboard</div>
                                <div className="text-white/40 mb-6">Visit the Fitness Dashboard to see your beautiful performance charts</div>
                                <MagneticButton
                                    as="a"
                                    href="/apps/fitness-dashboard"
                                    className="inline-block bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 text-purple-300 px-6 py-3 rounded-lg hover:bg-purple-500/30 transition-colors"
                                >
                                    Open Fitness Dashboard
                                </MagneticButton>
                            </div>
                        </div>
                    </ScrollReveal>

                    {/* Workout Analytics */}
                    <ScrollReveal delay={0.2}>
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
                    </ScrollReveal>
                </div>
            )}

            {whoopData && (!whoopData.records || whoopData.records.length === 0) && (
                <ScrollReveal>
                    <div className="liquid-glass-card backdrop-blur-lg bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 text-center">
                        <svg className="w-16 h-16 text-cyan-400/50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-white mb-2">No Recovery Data Available</h3>
                        <p className="text-white/60 leading-relaxed">
                            Your WHOOP account is connected, but no recovery data was found. Make sure you have recovery data in your WHOOP app.
                        </p>
                    </div>
                </ScrollReveal>
            )}
        </section>
    )
}
