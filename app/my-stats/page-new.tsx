import { sql } from '@vercel/postgres';
import LiquidPage from '../components/liquid-page';
import { ActivityHeatmap } from '../../components/ActivityHeatmap';

async function getStrainData() {
    try {
        const result = await sql`
            SELECT start_time, strain
            FROM whoop_cycles
            WHERE strain IS NOT NULL
            ORDER BY start_time DESC
        `;
        return result.rows as Array<{ start_time: string; strain: number }>;
    } catch (error) {
        console.error('Error fetching strain data:', error);
        return [];
    }
}

export default async function MyStats() {
    const strainData = await getStrainData();

    return (
        <LiquidPage backgroundVariant="purple">
            <div className="max-w-7xl w-full">
                {/* Hero Section - Data Storytelling Introduction */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-extralight tracking-tight text-white drop-shadow-lg mb-6">
                        Personal Performance Dashboard
                    </h1>
                    <div className="w-32 h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent mx-auto mb-8"></div>
                    <div className="max-w-4xl mx-auto">
                        <p className="text-xl text-purple-300/90 font-light tracking-wide leading-relaxed mb-6">
                            A data-driven story of athletic commitment and personal optimization
                        </p>
                        <p className="text-lg text-white/70 font-light leading-relaxed">
                            Each visualization below answers a specific question about my training patterns,
                            recovery trends, and performance insights—demonstrating both technical prowess
                            and meaningful data interpretation.
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
                        {/* Tier 1: The Essential Showcase - Annual Strain Heatmap */}
                        <div className="mb-16">
                            <div className="mb-8 text-center">
                                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-full px-6 py-3 mb-4">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    <span className="text-green-300 font-medium text-sm tracking-wide">TIER 1: ESSENTIAL SHOWCASE</span>
                                </div>
                                <h2 className="text-2xl font-light text-white/90 mb-3">
                                    "How consistent is my training dedication?"
                                </h2>
                                <p className="text-white/60 font-light text-lg max-w-3xl mx-auto leading-relaxed">
                                    This heatmap demonstrates long-term commitment to fitness—a visual proof of work ethic
                                    that's instantly recognizable to recruiters and speaks to character beyond technical skills.
                                </p>
                            </div>
                            <ActivityHeatmap data={strainData} />
                        </div>

                        {/* Coming Soon: Advanced Analytics */}
                        <div className="liquid-glass-card backdrop-blur-2xl bg-white/[0.04] border border-white/[0.08] rounded-3xl p-12 text-center">
                            <div className="mb-8">
                                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-full px-6 py-3 mb-6">
                                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                                    <span className="text-cyan-300 font-medium text-sm tracking-wide">COMING SOON</span>
                                </div>
                                <h3 className="text-3xl font-light text-white mb-4">Advanced Performance Analytics</h3>
                                <p className="text-white/70 font-light text-lg leading-relaxed max-w-4xl mx-auto mb-8">
                                    Additional tier-1 visualizations are in development, including strain vs. recovery correlation analysis,
                                    sleep efficiency trends, and activity performance patterns. Each will follow the same data storytelling
                                    approach—asking specific questions and providing clear, actionable insights.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6 text-left">
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                                    <div className="text-cyan-400 mb-3">📊</div>
                                    <h4 className="text-white font-medium mb-2">Strain vs Recovery</h4>
                                    <p className="text-white/60 text-sm font-light">
                                        "How well do I balance training intensity with recovery needs?"
                                    </p>
                                </div>
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                                    <div className="text-purple-400 mb-3">😴</div>
                                    <h4 className="text-white font-medium mb-2">Sleep Optimization</h4>
                                    <p className="text-white/60 text-sm font-light">
                                        "What sleep patterns optimize my performance and recovery?"
                                    </p>
                                </div>
                                <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                                    <div className="text-green-400 mb-3">🏃‍♂️</div>
                                    <h4 className="text-white font-medium mb-2">Training Periodization</h4>
                                    <p className="text-white/60 text-sm font-light">
                                        "How do my training cycles align with performance peaks?"
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </LiquidPage>
    );
}
