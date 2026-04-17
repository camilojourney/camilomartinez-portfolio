'use client'

import { Card } from '@/components/ui/Card';
import { ActivityHeatmap } from '@/components/features/whoop/ActivityHeatmap';
import { StrainVsRecoveryChart } from '@/components/features/whoop/StrainVsRecoveryChart';
import { TrainingAnalytics } from '@/components/features/whoop/TrainingAnalytics';
import LiquidNav from '@/components/shared/liquid-nav';
import ScrollReveal from '@/components/shared/scroll-reveal';
import TextReveal from '@/components/shared/text-reveal';
import MagneticButton from '@/components/shared/magnetic-button';
import { DashboardStrainData, DashboardMonthlyStrainData, DashboardStrainRecoveryData, DashboardWorkoutData } from '@/types/whoop';

interface MonthlyTrainingDaysData {
    month: string;
    trainingDays: number;
    daysInMonth: number;
}

interface FitnessDashboardClientProps {
    strainData: DashboardStrainData[];
    monthlyStrainData: DashboardMonthlyStrainData[];
    strainRecoveryData: DashboardStrainRecoveryData[];
    workoutData: DashboardWorkoutData[];
    monthlyTrainingDays: MonthlyTrainingDaysData[];
    isLoading?: boolean;
    errorMessage?: string;
}

function DashboardStateCard({
    eyebrow,
    title,
    description,
    tone = 'neutral',
}: {
    eyebrow: string;
    title: string;
    description: string;
    tone?: 'neutral' | 'error' | 'loading';
}) {
    const toneStyles = {
        neutral: {
            badge: 'from-cyan-500/20 to-blue-500/20 border-cyan-400/30 text-cyan-300',
            icon: 'text-muted-foreground',
        },
        error: {
            badge: 'from-rose-500/20 to-orange-500/20 border-rose-400/30 text-rose-200',
            icon: 'text-rose-200',
        },
        loading: {
            badge: 'from-amber-500/20 to-yellow-500/20 border-amber-400/30 text-amber-200',
            icon: 'text-amber-100',
        },
    } as const;

    const currentTone = toneStyles[tone];

    return (
        <ScrollReveal>
            <Card className="p-12 text-center border-white/10 bg-white/[0.03]">
                <div className={`inline-flex items-center gap-3 rounded-full border px-6 py-3 mb-8 bg-gradient-to-r ${currentTone.badge}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${tone === 'error' ? 'bg-rose-300' : tone === 'loading' ? 'bg-amber-300 animate-pulse' : 'bg-cyan-300'}`}></span>
                    <span className="font-semibold tracking-wide">{eyebrow}</span>
                </div>
                <div className={`${currentTone.icon} mb-8`}>
                    <svg className="w-20 h-20 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {tone === 'error' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 18c-.77 1.333.192 3 1.732 3z" />
                        ) : tone === 'loading' ? (
                            <>
                                <circle cx="12" cy="12" r="9" strokeWidth={1}></circle>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7v5l3 3" />
                            </>
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        )}
                    </svg>
                    <h3 className="text-2xl font-semibold mb-4 text-foreground">{title}</h3>
                    <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
                        {description}
                    </p>
                </div>
            </Card>
        </ScrollReveal>
    );
}

export default function FitnessDashboardClient({
    strainData,
    monthlyStrainData,
    strainRecoveryData,
    workoutData,
    monthlyTrainingDays,
    isLoading = false,
    errorMessage,
}: FitnessDashboardClientProps) {
    const hasAnyDashboardData = (
        strainData.length > 0 ||
        monthlyStrainData.length > 0 ||
        strainRecoveryData.length > 0 ||
        workoutData.length > 0 ||
        monthlyTrainingDays.length > 0
    );

    const missingSections: string[] = [];
    if (hasAnyDashboardData && strainRecoveryData.length === 0) {
        missingSections.push('recovery correlation');
    }
    if (hasAnyDashboardData && workoutData.length === 0) {
        missingSections.push('training distribution');
    }
    if (hasAnyDashboardData && monthlyTrainingDays.length === 0) {
        missingSections.push('monthly consistency');
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Navigation */}
            <LiquidNav currentPage="apps" />

            {/* Animated Background */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/30 animate-gradient-xy"></div>
                <div className="absolute top-0 left-0 w-full h-full opacity-20">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
                </div>
            </div>

            {/* Main Content */}
            <div className="pt-32 md:pt-40 px-4 md:px-6 pb-20">
                <div className="max-w-7xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-20">
                        <TextReveal
                            as="h1"
                            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent leading-tight"
                            delay={0.1}
                        >
                            My Data Dashboard
                        </TextReveal>
                        <ScrollReveal delay={0.3}>
                            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-full px-8 py-4 mb-8">
                                <span className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></span>
                                <span className="text-cyan-300 font-semibold text-lg tracking-wide">Live Data Pipeline</span>
                            </div>
                        </ScrollReveal>
                        <ScrollReveal delay={0.4}>
                            <p className="text-xl md:text-2xl text-foreground max-w-4xl mx-auto leading-relaxed">
                                Real-time insights into my health and performance. This dashboard showcases{' '}
                                <span className="text-cyan-400 font-semibold">data engineering</span>,{' '}
                                <span className="text-blue-400 font-semibold">API integration</span>, and{' '}
                                <span className="text-purple-400 font-semibold">interactive visualization</span>.
                            </p>
                        </ScrollReveal>
                    </div>

                    {isLoading ? (
                        <DashboardStateCard
                            eyebrow="Loading Dashboard"
                            title="Preparing the latest performance data"
                            description="The dashboard is querying workout, strain, and recovery records now. Charts will appear as soon as the server finishes assembling the dataset."
                            tone="loading"
                        />
                    ) : errorMessage ? (
                        <DashboardStateCard
                            eyebrow="Data Pipeline Issue"
                            title="The dashboard could not load"
                            description={errorMessage}
                            tone="error"
                        />
                    ) : !hasAnyDashboardData ? (
                        <DashboardStateCard
                            eyebrow="Waiting For First Sync"
                            title="Building Your Performance Story"
                            description="No fitness data is available yet. Once new WHOOP or Strava records land in the database, this dashboard will populate automatically."
                        />
                    ) : (
                        <div className="space-y-20">
                            {missingSections.length > 0 && (
                                <ScrollReveal>
                                    <Card className="border-amber-400/20 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-6">
                                        <div className="flex flex-col gap-2 text-left md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200/90">Partial Dataset</p>
                                                <p className="mt-2 text-lg text-foreground">
                                                    Some sections are waiting on more synced records.
                                                </p>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Missing: {missingSections.join(', ')}.
                                            </p>
                                        </div>
                                    </Card>
                                </ScrollReveal>
                            )}

                            {/* Component 1: WHOOP Activity Heatmap */}
                            <ScrollReveal>
                                <Card className="p-8 border-white/10 hover:border-cyan-400/30 transition-all duration-300">
                                    <div className="mb-8 text-center">
                                        <ScrollReveal delay={0.1}>
                                            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-full px-6 py-3 mb-6">
                                                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                                                <span className="text-cyan-300 font-semibold tracking-wide">Am I consistent with my workouts?</span>
                                            </div>
                                        </ScrollReveal>
                                        <TextReveal
                                            as="h2"
                                            className="text-3xl md:text-4xl font-bold mb-4 text-foreground"
                                            delay={0.2}
                                        >
                                            My Strain Journey
                                        </TextReveal>
                                        <ScrollReveal delay={0.3}>
                                            <div className="space-y-4 text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed mb-6">
                                                <p>
                                                    Movement goes beyond counting steps -- it is about <span className="font-bold text-foreground">real effort</span>. WHOOP&apos;s strain score combines <span className="font-bold text-foreground">heart rate and activity</span> to show how hard you actually push.
                                                </p>
                                                <p>
                                                    Each month, I aim for an <span className="font-bold text-foreground">average strain of 10</span> -- that sweet spot between progress and burnout. <span className="text-yellow-400 font-semibold">The yellow dotted line</span> marks my North Star for daily movement.
                                                </p>
                                                <p className="text-muted-foreground text-base italic">
                                                    Below: Each square = one day. Brighter greens = higher strain (max: 21).
                                                </p>
                                                <p className="text-cyan-400 font-semibold text-center">
                                                    Skills: React Visualization · Real-time Data Processing · SQL Aggregation · Goal Tracking
                                                </p>
                                            </div>
                                        </ScrollReveal>
                                    </div>

                                    {/* Daily Heatmap with integrated Monthly Chart */}
                                    <ScrollReveal delay={0.4}>
                                        <ActivityHeatmap data={strainData} monthlyData={monthlyStrainData} />
                                    </ScrollReveal>
                                </Card>
                            </ScrollReveal>

                            {/* Component 2: Strain vs. Recovery */}
                            <ScrollReveal>
                                <Card className="p-8 border-white/10 hover:border-cyan-400/30 transition-all duration-300">
                                    <div className="mb-8 text-center">
                                        <ScrollReveal delay={0.1}>
                                            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-full px-6 py-3 mb-6">
                                                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                                                <span className="text-cyan-300 font-semibold tracking-wide">How does training impact recovery?</span>
                                            </div>
                                        </ScrollReveal>
                                        <TextReveal
                                            as="h2"
                                            className="text-3xl md:text-4xl font-bold mb-4 text-foreground"
                                            delay={0.2}
                                        >
                                            Strain vs. Recovery: The Core Performance Loop
                                        </TextReveal>
                                        <ScrollReveal delay={0.3}>
                                            <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
                                                Each dot represents <span className="font-bold text-foreground">one day</span>, showing how <span className="font-bold text-cyan-400">training intensity</span> impacts <span className="font-bold text-blue-400">recovery capacity</span>. The trend line reveals the fundamental relationship between <span className="font-bold text-foreground">effort and restoration</span>.
                                            </p>
                                        </ScrollReveal>
                                    </div>
                                    <ScrollReveal delay={0.4}>
                                        <StrainVsRecoveryChart data={strainRecoveryData} />
                                    </ScrollReveal>
                                </Card>
                            </ScrollReveal>

                            {/* Component 3: Training Analytics */}
                            <ScrollReveal>
                                <div className="mb-4 text-center">
                                    <ScrollReveal delay={0.1}>
                                        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-full px-6 py-3 mb-4">
                                            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                                            <span className="text-purple-300 font-semibold tracking-wide">How do I distribute my training time?</span>
                                        </div>
                                    </ScrollReveal>
                                    <TextReveal
                                        as="h2"
                                        className="text-3xl md:text-4xl font-bold mb-3 text-foreground"
                                        delay={0.2}
                                    >
                                        Training Analytics
                                    </TextReveal>
                                    <ScrollReveal delay={0.3}>
                                        <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed mb-0">
                                            Time-series analysis showing <span className="font-bold text-purple-400">training distribution</span> across different sports and workout types. Each bar reveals <span className="font-bold text-foreground">session counts</span> and <span className="font-bold text-pink-400">total hours</span> of activity.
                                        </p>
                                    </ScrollReveal>
                                </div>
                                <ScrollReveal delay={0.4}>
                                    <Card className="p-8 border-white/10 hover:border-purple-400/30 transition-all duration-300">
                                        <TrainingAnalytics workoutData={workoutData} monthlyTrainingDays={monthlyTrainingDays} />
                                    </Card>
                                </ScrollReveal>
                            </ScrollReveal>

                            {/* Call to Action */}
                            <ScrollReveal>
                                <Card className="border-white/10 bg-gradient-to-br from-cyan-500/15 to-blue-500/10 border-cyan-400/30 p-8 md:p-10 text-center space-y-4">
                                    <h3 className="text-2xl md:text-3xl font-semibold text-foreground">Want to see how this was built?</h3>
                                    <p className="text-muted-foreground text-lg">Dive into the technical architecture, challenges solved, and the data pipeline powering this dashboard.</p>
                                    <MagneticButton
                                        as="a"
                                        href="/projects/fitness-dashboard"
                                        className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/20 px-6 py-3 text-foreground font-medium transition-all duration-300 hover:scale-105 hover:border-cyan-300/60 hover:bg-cyan-500/30 hover:text-cyan-100"
                                    >
                                        <span>Read the case study</span>
                                        <span aria-hidden className="text-lg">&#8594;</span>
                                    </MagneticButton>
                                </Card>
                            </ScrollReveal>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
