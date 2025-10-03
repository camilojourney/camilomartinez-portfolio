import { analyticsService } from '@/lib/api/config';
import { Card } from '@/components/ui/Card';
import { ActivityHeatmap } from '@/components/features/whoop/ActivityHeatmap';
import { StrainVsRecoveryChart } from '@/components/features/whoop/StrainVsRecoveryChart';
import { ActivityDistributionChart } from '@/components/features/whoop/ActivityDistributionChart';
import WorkoutTimeChart from '@/components/features/whoop/WorkoutTimeChart';

// Configure Incremental Static Regeneration (ISR) with 6-hour revalidation
export const dynamic = 'auto';
export const dynamicParams = true;
export const revalidate = 21600; // Revalidate every 6 hours (21600 seconds)

import { DashboardStrainData, DashboardMonthlyStrainData, DashboardStrainRecoveryData, DashboardWorkoutData, DashboardWorkoutTimeData } from '@/types/whoop';

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

async function getWorkoutTimes(): Promise<DashboardWorkoutTimeData[]> {
    try {
        const response = await analyticsService.getWorkoutTimes() as any;
        
        // Extract workout data and convert to time format
        const workouts = response?.recent?.workouts || [];
        
        // Function to standardize workout type names
        const standardizeWorkoutType = (sportName: string): string => {
            const lowercaseName = sportName.toLowerCase();
            
            // Group weightlifting variations
            if (lowercaseName.includes('weightlifting') || lowercaseName === 'weightlifting_msk') {
                return 'Weightlifting';
            }
            
            // Keep specific types as-is
            switch (lowercaseName) {
                case 'running':
                    return 'Running';
                case 'cycling':
                    return 'Cycling';
                case 'boxing':
                    return 'Boxing';
                default:
                    return 'Other';
            }
        };
        
        const workoutTimes = workouts.map((workout: any) => {
            const startTime = new Date(workout.start_time);
            const hours = startTime.getHours();
            const minutes = startTime.getMinutes();
            
            return {
                date: startTime.toISOString().split('T')[0], // YYYY-MM-DD format
                time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
                timeAsMinutes: hours * 60 + minutes,
                workoutType: standardizeWorkoutType(workout.sport_name || 'unknown')
            };
        });
        
        console.log('Workout times data processed:', workoutTimes.length, 'records');
        console.log('Sample workout times:', JSON.stringify(workoutTimes.slice(0, 3)));
        
        return workoutTimes;
    } catch (error) {
        console.error('Error fetching workout times:', error);
        return [];
    }
}

export default async function MyDataPage() {
    const strainData = await getStrainData();
    const monthlyStrainData = await getMonthlyStrainData();
    const strainRecoveryData = await getStrainRecoveryData();
    const workoutData = await getWorkoutData();
    const workoutTimeData = await getWorkoutTimes();

    return (
        <div className="min-h-screen relative overflow-hidden">
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
                        <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent leading-tight">
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
                                            <span className="text-cyan-400 font-semibold">The 10 Strain Challenge:</span> Every month, I set myself a goal to maintain an average strain of at least 10. But this isn't just about numbers—it's about keeping my body in motion and staying committed to daily movement.
                                        </p>
                                        <p>
                                            A strain of 10 represents that sweet spot where I'm pushing my body enough to see progress, but not so hard that I burn out. It means I'm consistently challenging myself through workouts, runs, and active recovery. 
                                            <span className="text-yellow-400 font-semibold"> The yellow dotted line shows this target</span>—my North Star for staying active.
                                        </p>
                                 
                                        <p className="text-cyan-400 font-semibold text-center">
                                            Skills Demonstrated: React Visualization, Real-time Data Processing, SQL Aggregation, Goal Tracking
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Daily Heatmap with integrated Monthly Chart */}
                                <ActivityHeatmap data={strainData} monthlyData={monthlyStrainData} />
                            </Card>

                            {/* Morning Workout Challenge Chart */}
                            <Card className="p-8 border-white/10 hover:border-amber-400/30 transition-all duration-300">
                                <div className="mb-8 text-center">
                                    <div className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 rounded-full px-6 py-3 mb-6">
                                        <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
                                        <span className="text-amber-300 font-semibold tracking-wide">Am I winning my early morning battle?</span>
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                                        The Morning Workout Challenge
                                    </h2>
                                    <div className="space-y-4 text-white/70 text-lg max-w-3xl mx-auto leading-relaxed mb-6">
                                        <h2 className="text-4xl font-bold text-center text-white mb-6">
                                            Win The Morning, Win The Day
                                        </h2>
                                    </div>
                                </div>
                                

                                

                                
                                {/* Workout Time Chart Component */}
                                <div className="border border-amber-500/30 bg-black/20 rounded-lg p-6">
                                    {workoutTimeData.length > 0 ? (
                                        <WorkoutTimeChart data={workoutTimeData} goalTime="08:30" />
                                    ) : (
                                        <div className="text-center p-8 text-white/60">
                                            <div className="text-amber-400 text-3xl mb-3">⏰</div>
                                            <p className="text-white/70 text-lg">No workout time data available.</p>
                                            <p className="text-white/50 text-sm mt-2">Check that your database has workout records.</p>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Component 2: The Astoria Conquest */}
                            <Card className="p-8 border-white/10 hover:border-green-400/30 transition-all duration-300">
                                <div className="mb-8 text-center">
                                    <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500/20 to-teal-500/20 border border-green-400/30 rounded-full px-6 py-3 mb-6">
                                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                        <span className="text-green-300 font-semibold tracking-wide">How close am I to conquering Astoria?</span>
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                                        The Astoria Conquest
                                    </h2>
                                    <p className="text-white/70 text-lg max-w-3xl mx-auto leading-relaxed">
                                        Live geospatial goal tracking my mission to run every street in Astoria, Queens. Interactive map with real-time progress updates.
                                        <span className="block mt-2 text-green-400 font-semibold">Astoria Conquest: 78% Complete • 45.2 miles remaining</span>
                                        <span className="block mt-1 text-green-300 text-sm">Skills: Geospatial Data Processing, Mapbox/Leaflet.js, Advanced API Integration</span>
                                    </p>
                                </div>
                                <StrainVsRecoveryChart data={strainRecoveryData} />
                            </Card>

                            {/* Component 3: Other Key Charts */}
                            <Card className="p-8 border-white/10 hover:border-purple-400/30 transition-all duration-300">
                                <div className="mb-8 text-center">
                                    <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-full px-6 py-3 mb-6">
                                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                                        <span className="text-purple-300 font-semibold tracking-wide">How do I distribute my training time?</span>
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                                        Training Analytics
                                    </h2>
                                    <p className="text-white/70 text-lg max-w-3xl mx-auto leading-relaxed">
                                        Time-series analysis showing training distribution across different sports and workout types.
                                        <span className="block mt-2 text-purple-400 font-semibold">Sleep Performance vs. Daily Recovery • Workout Type Distribution</span>
                                        <span className="block mt-1 text-purple-300 text-sm">Skills: Time-series Analysis, Data Storytelling, Advanced Visualizations</span>
                                    </p>
                                </div>
                                <ActivityDistributionChart data={workoutData} />
                            </Card>
                            

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
