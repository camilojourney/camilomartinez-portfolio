'use client'

import Link from 'next/link';
import { ActivityHeatmap } from '@/components/features/whoop/ActivityHeatmap';
import { StrainVsRecoveryChart } from '@/components/features/whoop/StrainVsRecoveryChart';
import { TrainingAnalytics } from '@/components/features/whoop/TrainingAnalytics';
import PageShell from '@/components/shared/page-shell';
import ScrollReveal from '@/components/shared/scroll-reveal';
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
    const statusClass = tone === 'error' ? 'status-danger' : tone === 'loading' ? 'status-warn' : '';

    return (
        <div className="panel panel-pad max-w-2xl" role={tone === 'error' ? 'alert' : 'status'} aria-busy={tone === 'loading'}>
            <span className={`status ${statusClass}`}>{eyebrow}</span>
            <h2 className="title-md mt-3">{title}</h2>
            <p className="body-muted mt-3">{description}</p>
        </div>
    );
}

function SectionHeader({ question, title, children }: { question: string; title: string; children: React.ReactNode }) {
    return (
        <div className="grid gap-4 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-4">
                <p className="caption">{question}</p>
                <h2 className="title-lg mt-2">{title}</h2>
            </div>
            <div className="body-muted space-y-3 md:col-span-8 [&_strong]:font-semibold [&_strong]:text-ink">{children}</div>
        </div>
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
        <PageShell currentPage="apps" maxWidth="full">
            <header className="rise-in grid gap-8 border-b border-line pb-10 md:grid-cols-12 md:gap-12 md:pb-14">
                <div className="md:col-span-8">
                    <span className="status status-live">Live data pipeline</span>
                    <h1 className="display mt-3">My data dashboard</h1>
                    <p className="lede mt-6">
                        Real-time insights into my health and performance. This dashboard showcases{' '}
                        <em>data engineering</em>, API integration, and interactive visualization.
                    </p>
                </div>
                <dl className="facts self-end md:col-span-4">
                    <dt>Sources</dt>
                    <dd>WHOOP API, Strava webhooks</dd>
                    <dt>Refresh</dt>
                    <dd>Every 6 hours</dd>
                    <dt>Case study</dt>
                    <dd>
                        <Link href="/projects/fitness-dashboard" className="link mobile-link-target">
                            How this was built
                        </Link>
                    </dd>
                </dl>
            </header>

            <div className="py-10 md:py-14">
                {isLoading ? (
                    <DashboardStateCard
                        eyebrow="Loading dashboard"
                        title="Preparing the latest performance data"
                        description="The dashboard is querying workout, strain, and recovery records now. Charts will appear as soon as the server finishes assembling the dataset."
                        tone="loading"
                    />
                ) : errorMessage ? (
                    <DashboardStateCard
                        eyebrow="Data pipeline issue"
                        title="The dashboard could not load"
                        description={errorMessage}
                        tone="error"
                    />
                ) : !hasAnyDashboardData ? (
                    <DashboardStateCard
                        eyebrow="Waiting for first sync"
                        title="Building your performance story"
                        description="No fitness data is available yet. Once new WHOOP or Strava records land in the database, this dashboard will populate automatically."
                    />
                ) : (
                    <div className="space-y-16 md:space-y-24">
                        {missingSections.length > 0 && (
                            <p className="status status-warn text-ink" role="status">
                                Partial dataset. Some sections are waiting on more synced records: {missingSections.join(', ')}.
                            </p>
                        )}

                        {/* Component 1: WHOOP Activity Heatmap */}
                        <ScrollReveal>
                            <section aria-labelledby="strain-heading">
                                <SectionHeader question="Am I consistent with my workouts?" title="My strain journey">
                                    <p>
                                        Movement goes beyond counting steps. It is about <strong>real effort</strong>. WHOOP&apos;s strain
                                        score combines <strong>heart rate and activity</strong> to show how hard you actually push.
                                    </p>
                                    <p>
                                        Each month, I aim for an <strong>average strain of 10</strong>, the sweet spot between progress and
                                        burnout. The dotted line marks my target for daily movement.
                                    </p>
                                    <p className="caption">
                                        Below: each square is one day. Higher strain increases the contrast of each green cell (max 21).
                                    </p>
                                    <p className="font-semibold text-accent">
                                        Skills: React Visualization · Real-time Data Processing · SQL Aggregation · Goal Tracking
                                    </p>
                                </SectionHeader>
                                <div className="mt-8">
                                    <ActivityHeatmap data={strainData} monthlyData={monthlyStrainData} />
                                </div>
                            </section>
                        </ScrollReveal>

                        {/* Component 2: Strain vs. Recovery */}
                        <ScrollReveal>
                            <section className="border-t border-line pt-16 md:pt-24" aria-labelledby="recovery-heading">
                                <SectionHeader question="How does training impact recovery?" title="Strain vs. recovery">
                                    <p>
                                        Each dot represents <strong>one day</strong>, showing how training intensity impacts recovery
                                        capacity. The trend line reveals the fundamental relationship between{' '}
                                        <strong>effort and restoration</strong>.
                                    </p>
                                </SectionHeader>
                                <div className="mt-8">
                                    <StrainVsRecoveryChart data={strainRecoveryData} />
                                </div>
                            </section>
                        </ScrollReveal>

                        {/* Component 3: Training Analytics */}
                        <ScrollReveal>
                            <section className="border-t border-line pt-16 md:pt-24" aria-labelledby="training-heading">
                                <SectionHeader question="How do I distribute my training time?" title="Training analytics">
                                    <p>
                                        Time-series analysis showing training distribution across different sports and workout types.
                                        Each bar reveals <strong>session counts</strong> and <strong>total hours</strong> of activity.
                                    </p>
                                </SectionHeader>
                                <div className="panel panel-pad mt-8">
                                    <TrainingAnalytics workoutData={workoutData} monthlyTrainingDays={monthlyTrainingDays} />
                                </div>
                            </section>
                        </ScrollReveal>

                        {/* Call to Action */}
                        <section className="border-t border-line pt-12 md:pt-16" aria-labelledby="cta-heading">
                            <h2 id="cta-heading" className="title-lg">Want to see how this was built?</h2>
                            <p className="body-muted mt-3 max-w-xl">
                                Dive into the technical architecture, challenges solved, and the data pipeline powering this dashboard.
                            </p>
                            <Link href="/projects/fitness-dashboard" className="btn-primary mt-6">
                                Read the case study
                            </Link>
                        </section>
                    </div>
                )}
            </div>
        </PageShell>
    );
}
