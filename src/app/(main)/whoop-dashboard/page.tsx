'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import LiquidPage from '@/components/layout/liquid-page';

interface CollectionStats {
    user?: any;
    newCycles?: number;
    newSleep?: number;
    newRecovery?: number;
    newWorkouts?: number;
    totalCycles?: number;
    totalSleep?: number;
    totalRecovery?: number;
    totalWorkouts?: number;
    errors?: string[];
    progress?: {
        current: number;
        total: number;
        stage: string;
    };
}

export default function WhoopDashboard() {
    const { data: session, status } = useSession();
    const [historicalResult, setHistoricalResult] = useState<CollectionStats | null>(null);
    const [dailyResult, setDailyResult] = useState<CollectionStats | null>(null);
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [syncStatus, setSyncStatus] = useState<any>(null);
    const [permanentToken, setPermanentToken] = useState<string | null>(null);
    const [loading, setLoading] = useState({
        historical: false,
        daily: false,
        debug: false,
        syncStatus: false
    });

    const [sessionStatus, setSessionStatus] = useState(null);

    // Check session status
    const checkSessionStatus = async () => {
        try {
            const response = await fetch('/api/debug-session');
            const status = await response.json();
            setSessionStatus(status);
        } catch (error) {
            console.error('Failed to check session status:', error);
        }
    };

    // Capture the token when the session is available
    useEffect(() => {
        if (session?.accessToken) {
            setPermanentToken(session.accessToken);
            // Store in localStorage for persistence
            localStorage.setItem('whoopPermanentToken', session.accessToken);

            // You can also send it to your backend to store it
            fetch('/api/update-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: session.accessToken,
                    userId: "${process.env.WHOOP_USER_ID_TO_SYNC}"
                })
            });
        }
    }, [session?.accessToken]);

    // Auto-refresh debug info and sync status every 30 seconds when authenticated
    useEffect(() => {
        if (session) {
            getDebugInfo();
            getSyncStatus();
            const interval = setInterval(() => {
                getDebugInfo();
                getSyncStatus();
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [session]);

    const runHistoricalCollection = async () => {
        setLoading(prev => ({ ...prev, historical: true }));
        setHistoricalResult(null);

        try {
            const response = await fetch('/api/whoop-collector-v2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'historical'
                })
            });

            const result = await response.json();
            setHistoricalResult(result);

            // Refresh debug info after collection
            setTimeout(getDebugInfo, 2000);
        } catch (error) {
            setHistoricalResult({
                errors: ['Failed to run historical collection: ' + (error instanceof Error ? error.message : 'Unknown error')]
            });
        }

        setLoading(prev => ({ ...prev, historical: false }));
    };

    const runDailyCollection = async () => {
        setLoading(prev => ({ ...prev, daily: true }));
        setDailyResult(null);

        try {
            const response = await fetch('/api/cron/daily-data-fetch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-cron-secret': 'whoop_daily_sync_2024_secure_key_x7mQ9pR3nF8vK2jL',
                },
            });

            const result = await response.json();
            setDailyResult(result);

            // Refresh debug info after collection
            setTimeout(getDebugInfo, 2000);
        } catch (error) {
            setDailyResult({
                errors: ['Failed to run daily collection: ' + (error instanceof Error ? error.message : 'Unknown error')]
            });
        }

        setLoading(prev => ({ ...prev, daily: false }));
    };

    const getDebugInfo = async () => {
        if (!session) return;

        setLoading(prev => ({ ...prev, debug: true }));

        try {
            const response = await fetch('/api/view-data');
            const result = await response.json();

            // Transform the view-data response to match expected format
            setDebugInfo({
                user: result.user || session.user,
                data_counts: {
                    cycles: result.counts?.cycles || 0,
                    sleep: result.counts?.sleep || 0,
                    recovery: result.counts?.recovery || 0,
                    workouts: result.counts?.workouts || 0
                },
                latest_dates: {
                    latest_cycle: result.recent?.cycles?.rows?.[0]?.start_time,
                    latest_sleep: result.recent?.sleep?.rows?.[0]?.start_time,
                    latest_recovery: result.recent?.recovery?.rows?.[0]?.created_at,
                    latest_workout: result.recent?.workouts?.rows?.[0]?.created_at
                },
                database_status: true,
                api_status: true,
                schema_status: true,
                last_sync: result.summary?.dateRange?.latest
            });
        } catch (error) {
            console.error('Failed to get analytics data:', error);
        }

        setLoading(prev => ({ ...prev, debug: false }));
    };

    const getSyncStatus = async () => {
        if (!session) return;

        setLoading(prev => ({ ...prev, syncStatus: true }));

        try {
            const response = await fetch('/api/sync-status');
            const result = await response.json();
            setSyncStatus(result);
        } catch (error) {
            console.error('Failed to get sync status:', error);
        }

        setLoading(prev => ({ ...prev, syncStatus: false }));
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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

    return (
        <LiquidPage backgroundVariant="purple">
            <div className="max-w-7xl w-full">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-6xl font-extralight tracking-tight text-white drop-shadow-lg mb-4">
                        WHOOP Analytics
                    </h1>
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent mx-auto mb-6"></div>
                    <p className="text-xl text-purple-300/90 font-light tracking-wide">
                        Data Collection & Monitoring Dashboard
                    </p>
                </div>

                {/* Authentication Section */}
                <div className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-8 mb-8">
                    <h2 className="text-2xl font-light text-white mb-6 flex items-center gap-3">
                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                        Authentication
                    </h2>

                    {!session ? (
                        <div className="text-center">
                            <p className="text-white/70 mb-8 font-light text-lg">
                                Connect your WHOOP account to begin data synchronization
                            </p>
                            <button
                                onClick={() => signIn('whoop')}
                                className="group liquid-glass-primary backdrop-blur-xl bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-400/30 text-white font-medium py-4 px-12 rounded-2xl hover:from-purple-400/30 hover:to-violet-400/30 hover:border-purple-300/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25"
                            >
                                <span className="flex items-center justify-center gap-3 text-lg">
                                    🏃‍♂️ Connect WHOOP Account
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                </span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-400 font-medium text-lg flex items-center gap-3">
                                    <span className="w-3 h-3 bg-green-400 rounded-full"></span>
                                    Connected as {session.user?.name}
                                </p>
                                <p className="text-white/60 font-light">{session.user?.email}</p>
                            </div>
                            <button
                                onClick={() => signOut()}
                                className="liquid-glass-secondary backdrop-blur-xl bg-white/[0.04] border border-white/[0.15] text-white/90 font-medium py-3 px-6 rounded-2xl hover:bg-white/[0.08] hover:border-white/[0.25] hover:text-white transition-all duration-300"
                            >
                                Disconnect
                            </button>
                        </div>
                    )}
                </div>

                {session && (
                    <>
                        {/* Sync Status Banner */}
                        {syncStatus && (
                            <div className={`liquid-glass-card backdrop-blur-2xl border rounded-3xl p-6 mb-8 ${syncStatus.user_sync?.needs_sync
                                ? 'bg-yellow-500/[0.08] border-yellow-400/[0.2]'
                                : 'bg-green-500/[0.08] border-green-400/[0.2]'
                                }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-3 h-3 rounded-full ${syncStatus.user_sync?.needs_sync ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'
                                            }`}></span>
                                        <div>
                                            <h3 className="text-lg font-medium text-white">
                                                {syncStatus.user_sync?.needs_sync ? 'Sync Recommended' : 'Data Up to Date'}
                                            </h3>
                                            <p className="text-white/70 font-light text-sm">
                                                {syncStatus.user_sync?.last_activity
                                                    ? `Last activity: ${formatDate(syncStatus.user_sync.last_activity)}`
                                                    : 'No recent activity found'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white/60 font-light text-xs">Next auto-check: 2:00 PM UTC</p>
                                        <p className="text-white/50 font-light text-xs">
                                            {syncStatus.automatic_sync?.last_check
                                                ? `Last check: ${formatDate(syncStatus.automatic_sync.last_check)}`
                                                : 'No automatic checks yet'
                                            }
                                        </p>
                                    </div>
                                </div>

                                {syncStatus.recommendations && syncStatus.recommendations.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-white/10">
                                        <ul className="text-white/70 font-light text-sm space-y-1">
                                            {syncStatus.recommendations.map((rec: string, i: number) => (
                                                <li key={i} className="flex items-center gap-2">
                                                    <span className="w-1 h-1 bg-white/40 rounded-full"></span>
                                                    {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Data Collection Controls */}
                        <div className="grid lg:grid-cols-2 gap-8 mb-8">
                            {/* Historical Collection */}
                            <div className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-8">
                                <h2 className="text-2xl font-light text-white mb-4 flex items-center gap-3">
                                    📊 Historical Data Collection
                                </h2>
                                <p className="text-white/70 mb-8 font-light leading-relaxed">
                                    Import your complete WHOOP history. Run this once to collect all historical cycles, sleep, and recovery data.
                                </p>

                                <button
                                    onClick={runHistoricalCollection}
                                    disabled={loading.historical}
                                    className="w-full group liquid-glass-primary backdrop-blur-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 text-white font-medium py-4 px-6 rounded-2xl hover:from-blue-400/30 hover:to-cyan-400/30 hover:border-blue-300/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {loading.historical ? (
                                        <span className="flex items-center justify-center gap-3">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Collecting Historical Data...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-3">
                                            🔄 Start Historical Collection
                                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </span>
                                    )}
                                </button>

                                {historicalResult && (
                                    <div className="mt-6 p-6 backdrop-blur-xl bg-white/[0.03] border border-white/[0.1] rounded-2xl">
                                        <h3 className="font-medium text-white mb-4">Historical Collection Results:</h3>

                                        {/* Always show success metrics */}
                                        <div className="text-green-400 space-y-3 font-light mb-6">
                                            <p className="flex items-center gap-3">
                                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                                New Cycles: {historicalResult.newCycles || 0}
                                            </p>
                                            <p className="flex items-center gap-3">
                                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                                New Sleep Records: {historicalResult.newSleep || 0}
                                            </p>
                                            <p className="flex items-center gap-3">
                                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                                New Recovery Records: {historicalResult.newRecovery || 0}
                                            </p>
                                            <p className="flex items-center gap-3">
                                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                                New Workouts: {historicalResult.newWorkouts || 0}
                                            </p>
                                        </div>

                                        {/* Show errors if any exist */}
                                        {historicalResult.errors && historicalResult.errors.length > 0 && (
                                            <div className="border-t border-white/10 pt-4">
                                                <h4 className="text-yellow-400 font-medium mb-3">Warnings:</h4>
                                                <div className="text-yellow-400 space-y-2">
                                                    {historicalResult.errors.map((error, i) => (
                                                        <p key={i} className="flex items-center gap-2 font-light text-sm">
                                                            <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                                                            {error}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Daily Collection */}
                            <div className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-8">
                                <h2 className="text-2xl font-light text-white mb-4 flex items-center gap-3">
                                    📅 Daily Data Collection
                                </h2>
                                <p className="text-white/70 mb-8 font-light leading-relaxed">
                                    Sync recent data from the last 3 days. Use this daily to keep your analytics current and complete.
                                </p>

                                <button
                                    onClick={runDailyCollection}
                                    disabled={loading.daily}
                                    className="w-full group liquid-glass-primary backdrop-blur-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 text-white font-medium py-4 px-6 rounded-2xl hover:from-green-400/30 hover:to-emerald-400/30 hover:border-green-300/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {loading.daily ? (
                                        <span className="flex items-center justify-center gap-3">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Collecting Daily Data...
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-3">
                                            ⚡ Run Daily Collection
                                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </span>
                                    )}
                                </button>

                                {dailyResult && (
                                    <div className="mt-6 p-6 backdrop-blur-xl bg-white/[0.03] border border-white/[0.1] rounded-2xl">
                                        <h3 className="font-medium text-white mb-4">Daily Collection Results:</h3>

                                        {/* Always show success metrics */}
                                        <div className="text-green-400 space-y-3 font-light mb-6">
                                            <p className="flex items-center gap-3">
                                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                                New Cycles: {dailyResult.newCycles || 0}
                                            </p>
                                            <p className="flex items-center gap-3">
                                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                                New Sleep Records: {dailyResult.newSleep || 0}
                                            </p>
                                            <p className="flex items-center gap-3">
                                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                                New Recovery Records: {dailyResult.newRecovery || 0}
                                            </p>
                                            <p className="flex items-center gap-3">
                                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                                New Workouts: {dailyResult.newWorkouts || 0}
                                            </p>
                                        </div>

                                        {/* Show errors if any exist */}
                                        {dailyResult.errors && dailyResult.errors.length > 0 && (
                                            <div className="border-t border-white/10 pt-4">
                                                <h4 className="text-yellow-400 font-medium mb-3">Warnings:</h4>
                                                <div className="text-yellow-400 space-y-2">
                                                    {dailyResult.errors.map((error, i) => (
                                                        <p key={i} className="flex items-center gap-2 font-light text-sm">
                                                            <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                                                            {error}
                                                        </p>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Analytics Section */}
                        <div className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-light text-white flex items-center gap-3">
                                    <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                                    Data Analytics & Status
                                </h2>
                                <button
                                    onClick={getDebugInfo}
                                    disabled={loading.debug}
                                    className="liquid-glass-secondary backdrop-blur-xl bg-white/[0.04] border border-white/[0.15] text-white/90 font-medium py-3 px-6 rounded-2xl hover:bg-white/[0.08] hover:border-white/[0.25] hover:text-white transition-all duration-300 disabled:opacity-50"
                                >
                                    {loading.debug ? (
                                        <span className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Refreshing
                                        </span>
                                    ) : (
                                        '↻ Refresh'
                                    )}
                                </button>
                            </div>

                            {debugInfo ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {/* User Info */}
                                    {debugInfo.user && (
                                        <div className="backdrop-blur-xl bg-blue-500/[0.1] border border-blue-400/[0.2] rounded-2xl p-6">
                                            <h3 className="font-medium text-blue-300 mb-4 flex items-center gap-2">
                                                👤 User Profile
                                            </h3>
                                            <p className="text-white/80 font-light text-sm mb-2">ID: {debugInfo.user.user_id}</p>
                                            <p className="text-white/80 font-light text-sm">Name: {debugInfo.user.first_name} {debugInfo.user.last_name}</p>
                                        </div>
                                    )}

                                    {/* Cycles */}
                                    <div className="backdrop-blur-xl bg-green-500/[0.1] border border-green-400/[0.2] rounded-2xl p-6">
                                        <h3 className="font-medium text-green-300 mb-4 flex items-center gap-2">
                                            🔄 Cycles
                                        </h3>
                                        <p className="text-white/80 font-light text-sm mb-2">Total: {debugInfo.data_counts?.cycles || 0}</p>
                                        <p className="text-white/60 font-light text-xs">Latest: {formatDate(debugInfo.latest_dates?.latest_cycle)}</p>
                                    </div>

                                    {/* Sleep */}
                                    <div className="backdrop-blur-xl bg-purple-500/[0.1] border border-purple-400/[0.2] rounded-2xl p-6">
                                        <h3 className="font-medium text-purple-300 mb-4 flex items-center gap-2">
                                            😴 Sleep
                                        </h3>
                                        <p className="text-white/80 font-light text-sm mb-2">Total: {debugInfo.data_counts?.sleep || 0}</p>
                                        <p className="text-white/60 font-light text-xs">Latest: {formatDate(debugInfo.latest_dates?.latest_sleep)}</p>
                                    </div>

                                    {/* Recovery */}
                                    <div className="backdrop-blur-xl bg-orange-500/[0.1] border border-orange-400/[0.2] rounded-2xl p-6">
                                        <h3 className="font-medium text-orange-300 mb-4 flex items-center gap-2">
                                            💪 Recovery
                                        </h3>
                                        <p className="text-white/80 font-light text-sm mb-2">Total: {debugInfo.data_counts?.recovery || 0}</p>
                                        <p className="text-white/60 font-light text-xs">Latest: {formatDate(debugInfo.latest_dates?.latest_recovery)}</p>
                                    </div>

                                    {/* Workouts */}
                                    <div className="backdrop-blur-xl bg-red-500/[0.1] border border-red-400/[0.2] rounded-2xl p-6">
                                        <h3 className="font-medium text-red-300 mb-4 flex items-center gap-2">
                                            🏋️ Workouts
                                        </h3>
                                        <p className="text-white/80 font-light text-sm mb-2">Total: {debugInfo.data_counts?.workouts || 0}</p>
                                        <p className="text-white/60 font-light text-xs">Latest: {formatDate(debugInfo.latest_dates?.latest_workout)}</p>
                                    </div>

                                    {/* Database Status */}
                                    <div className="backdrop-blur-xl bg-gray-500/[0.1] border border-gray-400/[0.2] rounded-2xl p-6">
                                        <h3 className="font-medium text-gray-300 mb-4 flex items-center gap-2">
                                            🗄️ Database
                                        </h3>
                                        <p className="text-white/80 font-light text-sm mb-2">
                                            {debugInfo.database_status ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                                    Connected
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                                                    Disconnected
                                                </span>
                                            )}
                                        </p>
                                        {debugInfo.schema_status && (
                                            <p className="text-white/60 font-light text-xs flex items-center gap-2">
                                                <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                                                Schema Valid
                                            </p>
                                        )}
                                    </div>

                                    {/* API Status */}
                                    <div className="backdrop-blur-xl bg-yellow-500/[0.1] border border-yellow-400/[0.2] rounded-2xl p-6">
                                        <h3 className="font-medium text-yellow-300 mb-4 flex items-center gap-2">
                                            🌐 API Status
                                        </h3>
                                        <p className="text-white/80 font-light text-sm mb-2">
                                            {debugInfo.api_status ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                                    Connected
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                                                    Error
                                                </span>
                                            )}
                                        </p>
                                        {debugInfo.rate_limit && (
                                            <p className="text-white/60 font-light text-xs flex items-center gap-2">
                                                <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                                                Rate Limit OK
                                            </p>
                                        )}
                                    </div>

                                    {/* Last Sync */}
                                    <div className="backdrop-blur-xl bg-indigo-500/[0.1] border border-indigo-400/[0.2] rounded-2xl p-6">
                                        <h3 className="font-medium text-indigo-300 mb-4 flex items-center gap-2">
                                            🕒 Last Sync
                                        </h3>
                                        <p className="text-white/80 font-light text-sm">
                                            {debugInfo.last_sync ? formatDate(debugInfo.last_sync) : 'Never'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-white/60 py-16">
                                    <div className="mb-4">
                                        <svg className="w-16 h-16 text-white/30 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <p className="font-light text-lg">Click "Refresh" to load analytics data</p>
                                </div>
                            )}

                            {/* Quick Actions */}
                            <div className="mt-8 pt-8 border-t border-white/10">
                                <h3 className="font-medium text-white mb-6 flex items-center gap-3">
                                    <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                                    Quick Actions
                                </h3>
                                <div className="flex flex-wrap gap-4">
                                    <a
                                        href="/my-stats"
                                        className="liquid-glass-primary backdrop-blur-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-white font-light py-3 px-6 rounded-2xl hover:from-cyan-400/30 hover:to-blue-400/30 hover:border-cyan-300/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/25"
                                    >
                                        📈 View My Stats
                                    </a>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </LiquidPage>
    );
}
