'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import LiquidPage from '../components/liquid-page';
import { RecoveryChart } from '../components/RecoveryChart';

interface WhoopData {
    cycles?: any[];
    sleep?: any[];
    recovery?: any[];
    workouts?: any[];
    summary?: {
        totalCycles: number;
        totalSleep: number;
        totalRecovery: number;
        totalWorkouts: number;
        dateRange: {
            earliest: string;
            latest: string;
        };
    };
}

export default function MyStats() {
    const { data: session, status } = useSession();
    const [whoopData, setWhoopData] = useState<WhoopData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (session) {
            fetchWhoopData();
        }
    }, [session]);

    const fetchWhoopData = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/view-data');
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch data');
            }

            setWhoopData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const calculateAverages = () => {
        if (!whoopData) return null;

        const recoveryScores = whoopData.recovery?.map(r => r.score.recovery_score).filter(s => s != null) || [];
        const sleepEfficiency = whoopData.sleep?.map(s => s.score.sleep_efficiency_percentage).filter(s => s != null) || [];
        const strainScores = whoopData.cycles?.map(c => c.score.strain).filter(s => s != null) || [];

        return {
            avgRecovery: recoveryScores.length ? Math.round(recoveryScores.reduce((a, b) => a + b, 0) / recoveryScores.length) : 0,
            avgSleepEfficiency: sleepEfficiency.length ? Math.round(sleepEfficiency.reduce((a, b) => a + b, 0) / sleepEfficiency.length) : 0,
            avgStrain: strainScores.length ? (strainScores.reduce((a, b) => a + b, 0) / strainScores.length).toFixed(1) : '0.0',
        };
    };

    const getScoreColor = (score: number, type: 'recovery' | 'sleep' | 'strain') => {
        if (type === 'recovery') {
            if (score >= 67) return 'text-green-400';
            if (score >= 34) return 'text-yellow-400';
            return 'text-red-400';
        }
        if (type === 'sleep') {
            if (score >= 85) return 'text-green-400';
            if (score >= 70) return 'text-yellow-400';
            return 'text-red-400';
        }
        if (type === 'strain') {
            const numScore = parseFloat(score.toString());
            if (numScore >= 15) return 'text-red-400';
            if (numScore >= 10) return 'text-yellow-400';
            return 'text-green-400';
        }
        return 'text-white';
    };

    if (status === 'loading') {
        return (
            <LiquidPage backgroundVariant="purple">
                <div className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-12 max-w-md text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                    <p className="text-white/80 font-light">Loading...</p>
                </div>
            </LiquidPage>
        );
    }

    if (!session) {
        return (
            <LiquidPage backgroundVariant="purple">
                <div className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-12 max-w-2xl text-center">
                    <div className="mb-6">
                        <h1 className="text-4xl font-extralight text-white mb-4">My Stats</h1>
                        <div className="w-24 h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent mx-auto mb-6"></div>
                    </div>
                    <p className="text-white/70 font-light text-lg mb-8">
                        Please sign in to view your WHOOP analytics and performance data.
                    </p>
                    <a
                        href="/whoop-dashboard"
                        className="group liquid-glass-primary backdrop-blur-xl bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-400/30 text-white font-medium py-4 px-8 rounded-2xl hover:from-purple-400/30 hover:to-violet-400/30 hover:border-purple-300/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25"
                    >
                        <span className="flex items-center justify-center gap-3">
                            🏃‍♂️ Go to WHOOP Dashboard
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                            </svg>
                        </span>
                    </a>
                </div>
            </LiquidPage>
        );
    }

    const averages = calculateAverages();

    return (
        <LiquidPage backgroundVariant="purple">
            <div className="max-w-7xl w-full">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-6xl font-extralight tracking-tight text-white drop-shadow-lg mb-4">
                        My Stats
                    </h1>
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent mx-auto mb-6"></div>
                    <p className="text-xl text-purple-300/90 font-light tracking-wide">
                        Personal Performance Analytics
                    </p>
                </div>

                {loading ? (
                    <div className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                        <p className="text-white/80 font-light">Loading your WHOOP data...</p>
                    </div>
                ) : error ? (
                    <div className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-12 text-center">
                        <div className="text-red-400 mb-6">
                            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="text-xl font-medium mb-2">Unable to Load Data</h3>
                            <p className="text-red-300/80 font-light">{error}</p>
                        </div>
                        <div className="space-y-4">
                            <button
                                onClick={fetchWhoopData}
                                className="liquid-glass-primary backdrop-blur-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 text-white font-medium py-3 px-6 rounded-2xl hover:from-blue-400/30 hover:to-cyan-400/30 hover:border-blue-300/50 transition-all duration-300"
                            >
                                🔄 Retry
                            </button>
                            <p className="text-white/60 font-light text-sm">
                                or visit the{' '}
                                <a href="/whoop-dashboard" className="text-cyan-400 hover:text-cyan-300 underline">
                                    WHOOP Dashboard
                                </a>{' '}
                                to collect data first
                            </p>
                        </div>
                    </div>
                ) : !whoopData || (!whoopData.recovery?.length && !whoopData.sleep?.length && !whoopData.cycles?.length) ? (
                    <div className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-12 text-center">
                        <div className="text-white/60 mb-6">
                            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <h3 className="text-xl font-medium mb-2 text-white">No Data Available</h3>
                            <p className="text-white/70 font-light mb-8">
                                It looks like you haven't collected any WHOOP data yet. Get started by running a data collection first.
                            </p>
                        </div>
                        <a
                            href="/whoop-dashboard"
                            className="group liquid-glass-primary backdrop-blur-xl bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-400/30 text-white font-medium py-4 px-8 rounded-2xl hover:from-purple-400/30 hover:to-violet-400/30 hover:border-purple-300/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25"
                        >
                            <span className="flex items-center justify-center gap-3">
                                📊 Start Data Collection
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                </svg>
                            </span>
                        </a>
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        {whoopData.summary && (
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <div className="liquid-glass-card backdrop-blur-xl bg-blue-500/[0.1] border border-blue-400/[0.2] rounded-2xl p-6">
                                    <h3 className="font-medium text-blue-300 mb-2 flex items-center gap-2">
                                        🔄 Total Cycles
                                    </h3>
                                    <p className="text-3xl font-light text-white mb-1">{whoopData.summary.totalCycles}</p>
                                    <p className="text-blue-200/60 text-sm font-light">Recovery cycles tracked</p>
                                </div>

                                <div className="liquid-glass-card backdrop-blur-xl bg-purple-500/[0.1] border border-purple-400/[0.2] rounded-2xl p-6">
                                    <h3 className="font-medium text-purple-300 mb-2 flex items-center gap-2">
                                        😴 Sleep Sessions
                                    </h3>
                                    <p className="text-3xl font-light text-white mb-1">{whoopData.summary.totalSleep}</p>
                                    <p className="text-purple-200/60 text-sm font-light">Sleep records collected</p>
                                </div>

                                <div className="liquid-glass-card backdrop-blur-xl bg-green-500/[0.1] border border-green-400/[0.2] rounded-2xl p-6">
                                    <h3 className="font-medium text-green-300 mb-2 flex items-center gap-2">
                                        💪 Recovery Scores
                                    </h3>
                                    <p className="text-3xl font-light text-white mb-1">{whoopData.summary.totalRecovery}</p>
                                    <p className="text-green-200/60 text-sm font-light">Daily recovery data</p>
                                </div>

                                <div className="liquid-glass-card backdrop-blur-xl bg-red-500/[0.1] border border-red-400/[0.2] rounded-2xl p-6">
                                    <h3 className="font-medium text-red-300 mb-2 flex items-center gap-2">
                                        🏋️ Workouts
                                    </h3>
                                    <p className="text-3xl font-light text-white mb-1">{whoopData.summary.totalWorkouts}</p>
                                    <p className="text-red-200/60 text-sm font-light">Training sessions logged</p>
                                </div>
                            </div>
                        )}

                        {/* Averages */}
                        {averages && (
                            <div className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-8 mb-8">
                                <h2 className="text-2xl font-light text-white mb-6 flex items-center gap-3">
                                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                                    Performance Averages
                                </h2>
                                <div className="grid md:grid-cols-3 gap-8">
                                    <div className="text-center">
                                        <div className="mb-4">
                                            <span className={`text-5xl font-extralight ${getScoreColor(averages.avgRecovery, 'recovery')}`}>
                                                {averages.avgRecovery}%
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-medium text-white mb-2">Average Recovery</h3>
                                        <p className="text-white/60 font-light text-sm">
                                            Your readiness to perform
                                        </p>
                                    </div>

                                    <div className="text-center">
                                        <div className="mb-4">
                                            <span className={`text-5xl font-extralight ${getScoreColor(averages.avgSleepEfficiency, 'sleep')}`}>
                                                {averages.avgSleepEfficiency}%
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-medium text-white mb-2">Sleep Efficiency</h3>
                                        <p className="text-white/60 font-light text-sm">
                                            Quality of your sleep
                                        </p>
                                    </div>

                                    <div className="text-center">
                                        <div className="mb-4">
                                            <span className={`text-5xl font-extralight ${getScoreColor(parseFloat(averages.avgStrain), 'strain')}`}>
                                                {averages.avgStrain}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-medium text-white mb-2">Average Strain</h3>
                                        <p className="text-white/60 font-light text-sm">
                                            Daily exertion level
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recovery Chart */}
                        {whoopData.recovery && whoopData.recovery.length > 0 && (
                            <div className="mb-8">
                                <RecoveryChart data={whoopData.recovery.slice(-14)} />
                            </div>
                        )}

                        {/* Data Range Info */}
                        {whoopData.summary?.dateRange && (
                            <div className="liquid-glass-card backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 text-center">
                                <h3 className="font-medium text-white mb-4">Data Range</h3>
                                <p className="text-white/70 font-light">
                                    From{' '}
                                    <span className="text-cyan-400 font-medium">
                                        {new Date(whoopData.summary.dateRange.earliest).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                    {' '}to{' '}
                                    <span className="text-cyan-400 font-medium">
                                        {new Date(whoopData.summary.dateRange.latest).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </LiquidPage>
    );
}
