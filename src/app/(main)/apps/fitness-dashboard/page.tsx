import { analyticsService } from '@/lib/api/config';
import { Card } from '@/components/ui/Card';
import { ActivityHeatmap } from '@/components/features/whoop/ActivityHeatmap';
import { StrainVsRecoveryChart } from '@/components/features/whoop/StrainVsRecoveryChart';
import { TrainingAnalytics } from '@/components/features/whoop/TrainingAnalytics';
import LiquidNav from '@/components/shared/liquid-nav';
import Link from 'next/link';

// Configure Incremental Static Regeneration (ISR) with 6-hour revalidation
export const dynamic = 'auto';
export const dynamicParams = true;
export const revalidate = 21600; // Revalidate every 6 hours (21600 seconds)

import { DashboardStrainData, DashboardMonthlyStrainData, DashboardStrainRecoveryData, DashboardWorkoutData } from '@/types/whoop';

async function getStrainData(): Promise<DashboardStrainData[]> {
    try {
        const response = await analyticsService.getStrainData() as any;
        
        // Extract strain data from /api/view-data response
        const strainData = response?.strain || [];
        
        console.log('Strain Data from API:', strainData.length, 'records');
        console.log('Sample data:', strainData.slice(0, 3));
        
        // Convert to expected format
        return strainData.map((item: any) => ({
            formatted_date: item.formatted_date,
            strain: parseFloat(item.strain) || 0
        }));
    } catch (error) {
        console.error('Error fetching strain data:', error);
        return [];
    }
}

async function getMonthlyStrainData(): Promise<DashboardMonthlyStrainData[]> {
    try {
        const response = await analyticsService.getMonthlyStrainData() as any;
        
        // Extract and aggregate monthly data from strain data
        const strainData = response?.strain || [];
        
        if (!strainData.length) {
            console.log('No strain data for monthly aggregation');
            return [];
        }
        
        // Group by month and calculate averages
        const monthlyMap = new Map();
        
        strainData.forEach((item: any) => {
            const date = new Date(item.formatted_date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyMap.has(monthKey)) {
                monthlyMap.set(monthKey, { total: 0, count: 0 });
            }
            
            const month = monthlyMap.get(monthKey);
            month.total += parseFloat(item.strain) || 0;
            month.count += 1;
        });
        
        const monthlyData = Array.from(monthlyMap.entries()).map(([month, data]) => ({
            month,
            average_strain: Math.round((data.total / data.count) * 100) / 100,
            days_count: data.count
        }));
        
        console.log('Monthly Strain Data processed:', monthlyData.length, 'months');
        return monthlyData;
    } catch (error) {
        console.error('Error fetching monthly strain data:', error);
        return [];
    }
}

async function getStrainRecoveryData(): Promise<DashboardStrainRecoveryData[]> {
    try {
        const response = await analyticsService.getStrainRecoveryData() as any;
        
        // Extract cycles and recovery data
        const cycles = response?.recent?.cycles || [];
        const recovery = response?.recent?.recovery || [];
        
        // Create a map of recovery by cycle_id for easy lookup
        const recoveryMap = new Map();
        recovery.forEach((r: any) => {
            recoveryMap.set(r.cycle_id, parseFloat(r.recovery_percentage) || 0);
        });
        
        // Sort cycles by date to ensure proper order
        const sortedCycles = cycles
            .filter((cycle: any) => cycle.strain != null)
            .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        
        // Match each day's recovery with PREVIOUS day's strain
        const strainRecoveryData: DashboardStrainRecoveryData[] = [];
        
        for (let i = 1; i < sortedCycles.length; i++) {
            const currentCycle = sortedCycles[i];
            const previousCycle = sortedCycles[i - 1];
            
            const currentRecovery = recoveryMap.get(currentCycle.id);
            const previousStrain = parseFloat(previousCycle.strain) || 0;
            
            if (currentRecovery > 0 && previousStrain > 0) {
                strainRecoveryData.push({
                    strain_date: currentCycle.formatted_date, // Date for the recovery measurement
                    strain: previousStrain, // Previous day's strain
                    recovery_score: currentRecovery // Current day's recovery
                });
            }
        }
        
        console.log('Strain vs Recovery Data (previous day correlation):', strainRecoveryData.length, 'records');
        console.log('Sample correlation data:', strainRecoveryData.slice(0, 3));
        return strainRecoveryData;
    } catch (error) {
        console.error('Error fetching strain vs recovery data:', error);
        return [];
    }
}

async function getWorkoutData(): Promise<DashboardWorkoutData[]> {
    try {
        const response = await analyticsService.getWorkoutData() as any;

        // Extract workout data from /api/view-data response
        const workouts = response?.recent?.workouts || [];

        if (workouts?.length) {
            const workoutData = workouts.map((workout: any) => ({
                id: workout.id,
                sport_name: workout.sport_name || 'Workout',
                start_time: workout.start_time,
                end_time: workout.end_time
            }));

            console.log('Workout data found:', workoutData.length, 'workouts');
            return workoutData;
        }

        console.log('No workout data found');
        return [];
    } catch (error) {
        console.error('Error fetching workout data:', error);
        return []; // Return empty array on error
    }
}

interface MonthlyTrainingDaysData {
    month: string; // "YYYY-MM" format
    trainingDays: number;
    daysInMonth: number;
}

async function getMonthlyTrainingDays(): Promise<MonthlyTrainingDaysData[]> {
    try {
        const response = await analyticsService.getWorkoutData() as any;

        // Extract workout data from /api/view-data response
        const workouts = response?.recent?.workouts || [];

        if (!workouts?.length) {
            console.log('No workout data for monthly training days');
            return [];
        }

        // Filter to only relevant workout types
        const relevantWorkouts = workouts.filter((workout: any) => {
            const sportName = workout.sport_name?.toLowerCase();
            return sportName === 'weightlifting' ||
                   sportName === 'weightlifting_msk' ||
                   sportName === 'running' ||
                   sportName === 'boxing';
        });

        // Group workouts by month and count unique days
        const monthlyMap = new Map<string, Set<string>>();

        relevantWorkouts.forEach((workout: any) => {
            const startTime = new Date(workout.start_time);

            // Get the timezone offset from the workout or assume NY time
            const timezoneOffset = workout.timezone_offset || '-05:00';

            // Apply timezone offset to get local date
            const offsetHours = parseInt(timezoneOffset.split(':')[0]);
            const offsetMinutes = parseInt(timezoneOffset.split(':')[1]);
            const localTime = new Date(startTime.getTime() + (offsetHours * 60 + offsetMinutes) * 60 * 1000);

            const monthKey = `${localTime.getFullYear()}-${String(localTime.getMonth() + 1).padStart(2, '0')}`;
            const dayKey = localTime.toISOString().split('T')[0]; // YYYY-MM-DD

            if (!monthlyMap.has(monthKey)) {
                monthlyMap.set(monthKey, new Set());
            }
            monthlyMap.get(monthKey)!.add(dayKey);
        });

        // Convert to array with days in month calculation
        const monthlyTrainingDays: MonthlyTrainingDaysData[] = [];

        monthlyMap.forEach((days, monthKey) => {
            const [year, month] = monthKey.split('-').map(Number);
            const daysInMonth = new Date(year, month, 0).getDate();

            monthlyTrainingDays.push({
                month: monthKey,
                trainingDays: days.size,
                daysInMonth
            });
        });

        // Sort by month chronologically
        monthlyTrainingDays.sort((a, b) => a.month.localeCompare(b.month));

        console.log('Monthly training days processed:', monthlyTrainingDays.length, 'months');
        console.log('Sample data:', monthlyTrainingDays.slice(0, 3));

        return monthlyTrainingDays;
    } catch (error) {
        console.error('Error fetching monthly training days:', error);
        return [];
    }
}


export default async function MyDataPage() {
    const strainData = await getStrainData();
    const monthlyStrainData = await getMonthlyStrainData();
    const strainRecoveryData = await getStrainRecoveryData();
    const workoutData = await getWorkoutData();
    const monthlyTrainingDays = await getMonthlyTrainingDays();

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
                        {/* Link to project page at top */}

                        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent leading-tight">
                            My Data Dashboard
                        </h1>
                        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-full px-8 py-4 mb-8">
                            <span className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></span>
                            <span className="text-cyan-300 font-semibold text-lg tracking-wide">Live Data Pipeline</span>
                        </div>
                        <p className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto leading-relaxed">
                            Real-time insights into my health and performance. This dashboard showcases{' '}
                            <span className="text-cyan-400 font-semibold">data engineering</span>,{' '}
                            <span className="text-blue-400 font-semibold">API integration</span>, and{' '}
                            <span className="text-purple-400 font-semibold">interactive visualization</span>.
                        </p>
                    </div>

                    {!strainData || !strainData.length ? (
                        <Card className="p-12 text-center border-white/10">
                            <div className="text-white/60 mb-8">
                                <svg className="w-20 h-20 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <h3 className="text-2xl font-semibold mb-4 text-white">Building Your Performance Story</h3>
                                <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
                                    No strain data found in the database yet. This dashboard will automatically update
                                    as new strain data is added to the system.
                                </p>
                            </div>
                        </Card>
                    ) : (
                        <div className="space-y-20">
                            {/* Component 1: WHOOP Activity Heatmap */}
                            <Card className="p-8 border-white/10 hover:border-cyan-400/30 transition-all duration-300">
                                <div className="mb-8 text-center">
                                    <div className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-full px-6 py-3 mb-6">
                                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                                        <span className="text-cyan-300 font-semibold tracking-wide">Am I consistent with my workouts?</span>
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                                        My Strain Journey
                                    </h2>
                                    <div className="space-y-4 text-white/70 text-lg max-w-3xl mx-auto leading-relaxed mb-6">
                                        <p>
I need the peak strain to be changed for a percentage of the weeks on the current week or current year in which I had an aggregation of strain more than 10, which is the goal.                                             Movement goes beyond counting steps — it's about <span className="font-bold text-white">real effort</span>. WHOOP's strain score combines <span className="font-bold text-white">heart rate and activity</span> to show how hard you actually push.
                                        </p>
                                        <p>
                                            Each month, I aim for an <span className="font-bold text-white">average strain of 10</span> — that sweet spot between progress and burnout. <span className="text-yellow-400 font-semibold">The yellow dotted line</span> marks my North Star for daily movement.
                                        </p>
                                        <p className="text-white/60 text-base italic">
                                            Below: Each square = one day. Brighter greens = higher strain (max: 21).
                                        </p>
                                 
                                        <p className="text-cyan-400 font-semibold text-center">
                                            Skills: React Visualization · Real-time Data Processing · SQL Aggregation · Goal Tracking
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Daily Heatmap with integrated Monthly Chart */}
                                <ActivityHeatmap data={strainData} monthlyData={monthlyStrainData} />
                            </Card>

                            {/* Component 2: Strain vs. Recovery */}
                            <Card className="p-8 border-white/10 hover:border-cyan-400/30 transition-all duration-300">
                                <div className="mb-8 text-center">
                                    <div className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-full px-6 py-3 mb-6">
                                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                                        <span className="text-cyan-300 font-semibold tracking-wide">How does training impact recovery?</span>
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                                        Strain vs. Recovery: The Core Performance Loop
                                    </h2>
                                    <p className="text-white/70 text-lg max-w-3xl mx-auto leading-relaxed">
                                        Each dot represents <span className="font-bold text-white">one day</span>, showing how <span className="font-bold text-cyan-400">training intensity</span> impacts <span className="font-bold text-blue-400">recovery capacity</span>. The trend line reveals the fundamental relationship between <span className="font-bold text-white">effort and restoration</span>.
                                    </p>
                                </div>
                                <StrainVsRecoveryChart data={strainRecoveryData} />
                            </Card>

                            {/* Component 3: Training Analytics - Description Outside */}
                            <div className="mb-4 text-center">
                                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-full px-6 py-3 mb-4">
                                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                                    <span className="text-purple-300 font-semibold tracking-wide">How do I distribute my training time?</span>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white">
                                    Training Analytics
                                </h2>
                                <p className="text-white/70 text-lg max-w-3xl mx-auto leading-relaxed mb-0">
                                    Time-series analysis showing <span className="font-bold text-purple-400">training distribution</span> across different sports and workout types. Each bar reveals <span className="font-bold text-white">session counts</span> and <span className="font-bold text-pink-400">total hours</span> of activity.
                                </p>
                            </div>
                            <Card className="p-8 border-white/10 hover:border-purple-400/30 transition-all duration-300">
                                <TrainingAnalytics workoutData={workoutData} monthlyTrainingDays={monthlyTrainingDays} />
                            </Card>

                            {/* Call to Action - Read how I built this */}
                            <Card className="border-white/10 bg-gradient-to-br from-cyan-500/15 to-blue-500/10 border-cyan-400/30 p-8 md:p-10 text-center space-y-4">
                                <h3 className="text-2xl md:text-3xl font-semibold text-white">Want to see how this was built?</h3>
                                <p className="text-white/70 text-lg">Dive into the technical architecture, challenges solved, and the data pipeline powering this dashboard.</p>
                                <Link
                                    href="/projects/fitness-dashboard"
                                    className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/20 px-6 py-3 text-white font-medium transition-all duration-300 hover:scale-105 hover:border-cyan-300/60 hover:bg-cyan-500/30 hover:text-cyan-100"
                                >
                                    <span>Read the case study</span>
                                    <span aria-hidden className="text-lg">→</span>
                                </Link>
                            </Card>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
