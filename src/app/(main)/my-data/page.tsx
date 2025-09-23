export default async function MyDataPage() {
    // Fetch all data in parallel
    const [
        strainData,
        monthlyStrainData,
        strainRecoveryData,
        workoutData,
        workoutTimeData
    ] = await Promise.all([
        getStrainData(),
        getMonthlyStrainData(),
        getStrainRecoveryData(),
        getWorkoutData(),
        getWorkoutTimes()
    ]);
async function getStrainData() {
    try {
        const result = await sql`
            SELECT
                TO_CHAR(start_time, 'YYYY-MM-DD') AS formatted_date,
                strain::decimal as strain
            FROM whoop_cycles
            WHERE strain IS NOT NULL
            ORDER BY start_time DESC
        `;
        
        // Ensure proper data serialization for client components
        const processedData = result.rows.map(row => ({
            formatted_date: String(row.formatted_date),
            strain: parseFloat(String(row.strain))
        }));
        
        console.log('Strain Data from DB:', processedData.length, 'records');
        console.log('Sample data:', processedData.slice(0, 3));
        return processedData;
    } catch (error) {
        console.error('Error fetching strain data:', error);
        return [];
    }
}

async function getMonthlyStrainData() {
    try {
        const result = await sql`
            SELECT
                TO_CHAR(start_time, 'YYYY-MM') AS month,
                AVG(strain::decimal) as average_strain,
                COUNT(*) as days_count
            FROM whoop_cycles
            WHERE strain IS NOT NULL
            GROUP BY TO_CHAR(start_time, 'YYYY-MM')
            ORDER BY month DESC
        `;
        
        // Ensure proper data serialization for client components
        const processedData = result.rows.map(row => ({
            month: String(row.month),
            average_strain: parseFloat(String(row.average_strain)),
            days_count: parseInt(String(row.days_count))
        }));
        
        console.log('Monthly Strain Data from DB:', processedData.length, 'records');
        console.log('Sample monthly data:', processedData.slice(0, 3));
        return processedData;
    } catch (error) {
        console.error('Error fetching monthly strain data:', error);
        return [];
    }
}

async function getStrainRecoveryData() {
    try {
        const result = await sql`
            SELECT
                c1.start_time::date as strain_date,
                c1.strain,
                r2.recovery_percentage as recovery_score
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
                AND r2.recovery_percentage IS NOT NULL
                AND r2.recovery_percentage > 0
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

async function getWorkoutTimes() {
    try {
        // Use TO_CHAR to format the date directly in SQL to avoid JS Date object issues
        const result = await sql`
            SELECT
                TO_CHAR(DATE(start_time + (timezone_offset || ' hours')::interval), 'YYYY-MM-DD') AS workout_date,
                TO_CHAR(MIN(start_time + (timezone_offset || ' hours')::interval), 'HH24:MI') AS first_workout_time
            FROM whoop_workouts
            WHERE sport_name IN ('running', 'weightlifting', 'boxing', 'weightlifting_msk')
            GROUP BY workout_date
            ORDER BY workout_date;
        `;
        
        console.log('Raw DB result:', JSON.stringify(result.rows.slice(0, 3)));
        
        // Process the data for the chart
        const processedData = result.rows.map(row => {
            // Convert time to minutes for comparison
            const [hours, minutes] = row.first_workout_time.split(':').map(Number);
            const timeAsMinutes = hours * 60 + minutes;
            
            // Use the formatted string date directly
            return {
                date: row.workout_date, // Already formatted as YYYY-MM-DD string by SQL
                time: row.first_workout_time,
                timeAsMinutes
            };
        });
        
        console.log('Workout times data:', processedData.length, 'records');
        console.log('Sample workout times:', JSON.stringify(processedData.slice(0, 3)));
        
        return processedData;
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
                            <span className="text-cyan-300 font-semibold text-lg tracking-wide">Live Fitness Data Pipeline</span>
                        </div>
                        <p className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto leading-relaxed">
                            Real-time insights from my fitness journey. This dashboard showcases{' '}
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
                            {/* Daily Fetch Control - First Component */}
                            <DailyFetchControl />

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
                                        <p>
                                            <span className="text-green-400 font-semibold">Green dots</span> mark the months I hit my goal, while <span className="text-red-400 font-semibold">red dots</span> remind me when life got in the way. The heatmap below reveals the daily story—each square representing a day of effort, consistency, and the pursuit of movement.
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
                                        <p>
                                            <span className="text-amber-400 font-semibold">The 8:15 AM Commitment:</span> As a self-proclaimed night owl, mornings have always been my greatest challenge. Yet the science is clear—early workouts set the foundation for better productivity, improved mood, and enhanced cognitive function throughout the day.
                                        </p>
                                        <p>
                                            In January 2025, I made a life-changing commitment: start every workout before 8:15 AM. This isn't just about fitness—it's a complete lifestyle redesign that requires discipline with evening routines, nutrition timing, and sleep consistency.
                                            <span className="text-yellow-400 font-semibold"> The yellow dotted line marks my 8:15 AM target</span>, separating success from failure each day.
                                        </p>
                                        <p>
                                            Each dot below represents my first workout of the day. <span className="text-green-400 font-semibold">Green dots</span> celebrate the mornings I won the battle against my pillow, while <span className="text-red-400 font-semibold">red dots</span> reveal when I surrendered to sleep. The vertical lines connect each workout to its date, creating a visual story of my journey toward becoming a morning athlete.
                                        </p>
                                        <p className="text-amber-400 font-semibold text-center">
                                            Skills Demonstrated: Time-Series Visualization, Habit Formation Analytics, Goal Progress Tracking
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Enhanced debugging */}
                                <div className="bg-black/20 p-4 mb-4 rounded text-white">
                                    <p className="font-bold">Debug Information:</p>
                                    <p>workoutTimeData length: {workoutTimeData.length}</p>
                                    {workoutTimeData.length > 0 && (
                                        <>
                                            <p>First record: {JSON.stringify(workoutTimeData[0])}</p>
                                            <p>Last record: {JSON.stringify(workoutTimeData[workoutTimeData.length - 1])}</p>
                                        </>
                                    )}
                                </div>
                                
                                {/* Try direct rendering with inline styles */}
                                <div className="border-2 border-amber-500 p-4 rounded-lg mb-4">
                                    <h3 className="text-xl font-bold text-center text-white mb-2">Simple Workout Time Display</h3>
                                    {workoutTimeData && workoutTimeData.length > 0 ? (
                                        <div className="max-h-60 overflow-y-auto">
                                            <table className="w-full text-sm text-white">
                                                <thead>
                                                    <tr>
                                                        <th className="text-left p-2 border-b border-amber-500/30">Date</th>
                                                        <th className="text-left p-2 border-b border-amber-500/30">Time</th>
                                                        <th className="text-left p-2 border-b border-amber-500/30">Before 8:15?</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {workoutTimeData.slice(0, 10).map((item, index) => (
                                                        <tr key={index} className="border-b border-amber-500/10">
                                                            <td className="p-2">{item.date}</td>
                                                            <td className="p-2">{item.time}</td>
                                                            <td className="p-2">
                                                                {item.timeAsMinutes <= 495 ? (
                                                                    <span className="text-green-400">✓</span>
                                                                ) : (
                                                                    <span className="text-red-400">✗</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {workoutTimeData.length > 10 && (
                                                <p className="text-center text-xs mt-2 text-gray-400">
                                                    Showing 10 of {workoutTimeData.length} records
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-center text-white/70">No workout time data available</p>
                                    )}
                                </div>
                                
                                {/* Diagnostic component */}
                                <div className="border-2 border-yellow-500 p-4 rounded-lg mb-4">
                                    <h3 className="text-xl font-bold text-center text-white mb-2">Diagnostic Chart</h3>
                                    <DiagnosticChart 
                                        data={workoutTimeData} 
                                        title="Workout Time Data Diagnostic" 
                                    />
                                </div>
                                
                                {/* Client-side wrapper component */}
                                <div className="border-2 border-green-500 p-4 rounded-lg mb-4">
                                    <h3 className="text-xl font-bold text-center text-white mb-2">Client Workout Time Chart</h3>
                                    <ClientWorkoutTimeChart 
                                        data={workoutTimeData} 
                                        goalTime="08:15" 
                                        debugMode={true}
                                    />
                                </div>
                                
                                {/* Original server component */}
                                <div className="border-2 border-blue-500 p-4 rounded-lg">
                                    <h3 className="text-xl font-bold text-center text-white mb-2">Server WorkoutTimeChart</h3>
                                    {workoutTimeData.length > 0 ? (
                                        <WorkoutTimeChart data={workoutTimeData} goalTime="08:15" />
                                    ) : (
                                        <div className="text-center p-4 text-white/60">No workout time data available for chart.</div>
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
