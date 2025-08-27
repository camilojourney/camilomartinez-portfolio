import { sql } from '@/lib/db/db';
import LiquidPage from '@/components/shared/liquid-page';
import { ActivityHeatmap } from '@/components/features/whoop/ActivityHeatmap';
import { StrainVsRecoveryChart } from '@/components/features/whoop/StrainVsRecoveryChart';
import { ActivityDistributionChart } from '@/components/features/whoop/ActivityDistributionChart';

async function getStrainData() {
    try {
        const result = await sql`
            SELECT
                TO_CHAR(start_time, 'YYYY-MM-DD') AS formatted_date,
                strain
            FROM whoop_cycles
            WHERE strain IS NOT NULL
            ORDER BY start_time DESC
        `;
        console.log('Strain Data from DB:', result.rows);
        return result.rows as Array<{
            formatted_date: string;
            strain: number | string;
        }>;
    } catch (error) {
        console.error('Error fetching strain data:', error);
        return [];
    }
}

async function getStrainRecoveryData() {
    try {
        const result = await sql`
            SELECT
                c1.start_time::date as strain_date,
                c1.strain,
                r2.recovery_score
            FROM whoop_cycles c1
            -- Join with the next day's recovery score
            INNER JOIN whoop_recovery r2 ON
                -- Match recovery records that occurred after this cycle
                r2.cycle_id IN (
                    SELECT c2.id
                    FROM whoop_cycles c2
                    WHERE c2.start_time::date = (c1.start_time::date + interval '1 day')
                )
            WHERE
                c1.strain IS NOT NULL
                AND c1.strain > 0
                AND r2.recovery_score IS NOT NULL
                AND r2.recovery_score > 0
            ORDER BY c1.start_time DESC
        `;
        return result.rows as Array<{
            strain_date: string;
            strain: number;
            recovery_score: number;
        }>;
    } catch (error) {
        console.error('Error fetching strain vs recovery data:', error);
        return [];
    }
}

async function getWorkoutData() {
    try {
        const result = await sql`
            SELECT
                id,
                sport_name,
                start_time,
                end_time
            FROM whoop_workouts
            WHERE
                start_time >= DATE_TRUNC('year', CURRENT_DATE)
                AND end_time > start_time  -- Ensure valid duration
                AND (
                    sport_name = 'weightlifting'
                    OR sport_name = 'weightlifting_msk'
                    OR sport_name = 'running'
                    OR sport_name = 'boxing'
                )
            ORDER BY start_time ASC
        `;

        if (result.rows.length > 0) {
            // Explicitly cast the result rows to the expected type
            return result.rows.map(row => ({
                id: row.id as string,
                sport_name: row.sport_name as string,
                start_time: row.start_time as string,
                end_time: row.end_time as string
            }));
        }

        // If no data found, return empty array
        console.log('No workout data found');
        return [];
    } catch (error) {
        console.error('Error fetching workout data:', error);
        return []; // Return empty array on error
    }
}

export default async function MyStats() {
    const strainData = await getStrainData();
    const strainRecoveryData = await getStrainRecoveryData();
    const workoutData = await getWorkoutData();

    return (
        <LiquidPage backgroundVariant="purple">
            <div className="max-w-7xl w-full">
                {/* Hero Section - Simple Introduction */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-extralight tracking-tight text-white drop-shadow-lg mb-6">
                        My Fitness Journey
                    </h1>
                    <div className="w-32 h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent mx-auto mb-8"></div>
                    <div className="max-w-4xl mx-auto">
                        <p className="text-lg text-white/70 font-light leading-relaxed">
                            Tracking my daily activity and recovery to build better habits and understand my body.
                            Here's what the data says about my fitness journey so far.
                        </p>
                    </div>
                </div>

                {!strainData || !strainData.length ? (
                    <div className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-12 text-center">
                        <div className="text-white/60 mb-8">
                            <svg className="w-20 h-20 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <h3 className="text-2xl font-light mb-4 text-white">Building Your Performance Story</h3>
                            <p className="text-white/70 font-light text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
                                No strain data found in the database yet. This dashboard will automatically update
                                as new strain data is added to the system.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Consistency Question */}
                        <div className="mb-16">
                            <div className="mb-8 text-center">
                                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-full px-6 py-3 mb-4">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    <span className="text-green-300 font-medium text-sm tracking-wide">Am I consistent with my workouts?</span>
                                </div>
                                <h2 className="text-2xl font-light text-white/90 mb-3">
                                    My Commitment: Consistency Over Intensity
                                </h2>
                                <p className="text-white/60 font-light text-lg max-w-3xl mx-auto leading-relaxed">
                                    My goal is to achieve a daily Strain score of at least 10. This calendar tracks my commitment to building a strong foundation of health through daily, sustainable effort.
                                </p>
                            </div>
                            <ActivityHeatmap data={strainData} />
                        </div>

                        {/* Recovery Question */}
                        {/* Recovery Question */}
                        <div className="mb-16">
                            <div className="mb-8 text-center">
                                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-full px-6 py-3 mb-4">
                                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                                    <span className="text-cyan-300 font-medium text-sm tracking-wide">How does today's workout affect tomorrow's recovery?</span>
                                </div>
                                <h2 className="text-2xl font-light text-white/90 mb-3">
                                    The strain-recovery relationship
                                </h2>
                                <p className="text-white/60 font-light text-lg max-w-3xl mx-auto leading-relaxed">
                                    This chart shows how my training effort today impacts my body's recovery score the next morning,
                                    helping me find the right balance between pushing my limits and proper recovery.
                                </p>
                            </div>
                            <StrainVsRecoveryChart data={strainRecoveryData} />
                        </div>

                        {/* Activity Distribution */}
                        <div className="mb-16">
                            <div className="mb-8 text-center">
                                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 border border-purple-400/30 rounded-full px-6 py-3 mb-4">
                                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                                    <span className="text-purple-300 font-medium text-sm tracking-wide">How do I distribute my training time?</span>
                                </div>
                                <h2 className="text-2xl font-light text-white/90 mb-3">
                                    Training Hours by Sport Type
                                </h2>
                                <p className="text-white/60 font-light text-lg max-w-3xl mx-auto leading-relaxed">
                                    This visualization shows how I distribute my training hours across different sports,
                                    helping me maintain balance in my fitness routine and track my time investment.
                                </p>
                            </div>
                            <ActivityDistributionChart data={workoutData} />
                        </div>
                    </>
                )}
            </div>
        </LiquidPage>
    );
}
