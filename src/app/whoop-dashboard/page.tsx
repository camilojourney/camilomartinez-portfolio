'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import LiquidNav from '@/components/shared/liquid-nav';
import { ApiClient, analyticsService, integrationService } from '@/lib/api/config';

export const dynamic = 'force-dynamic';

// Custom hook to safely use next-auth/react only on client
function useAuthClient() {
    const [authState, setAuthState] = useState<{
        session: any;
        status: 'loading' | 'authenticated' | 'unauthenticated';
    }>({ session: null, status: 'loading' });
    const [authModule, setAuthModule] = useState<any>(null);

    useEffect(() => {
        // Dynamically import next-auth/react only on client
        import('next-auth/react').then((mod) => {
            setAuthModule(mod);
        });
    }, []);

    // Update session state when authModule is loaded
    useEffect(() => {
        if (!authModule) return;

        const { getSession } = authModule;

        const updateSession = async () => {
            try {
                const session = await getSession();
                setAuthState({
                    session,
                    status: session ? 'authenticated' : 'unauthenticated'
                });
            } catch {
                setAuthState({ session: null, status: 'unauthenticated' });
            }
        };

        updateSession();

        // Re-check session periodically
        const interval = setInterval(updateSession, 60000);
        return () => clearInterval(interval);
    }, [authModule]);

    const signIn = useCallback(async (provider?: string) => {
        if (authModule) {
            await authModule.signIn(provider);
        }
    }, [authModule]);

    const signOut = useCallback(async () => {
        if (authModule) {
            await authModule.signOut();
        }
    }, [authModule]);

    return { ...authState, signIn, signOut };
}

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
    totalUsers?: number;
    successfulUsers?: number;
    failedUsers?: number;
    errors?: string[];
    progress?: {
        current: number;
        total: number;
        stage: string;
    };
}

interface ViewDataResponse {
    success: boolean;
    counts: {
        users?: number;
        cycles?: number;
        sleep?: number;
        recovery?: number;
        workouts?: number;
    };
    recent: {
        cycles: Array<{ start_time?: string }>;
        sleep: Array<{ start_time?: string }>;
        recovery: Array<{ cycle_id?: string | number; recovery_percentage?: number; created_at?: string }>;
        workouts: Array<{ start_time?: string; created_at?: string }>;
    };
    latest_date?: string;
    strain: Array<{ formatted_date: string; strain: number }>;
    timestamp: string;
}

export default function WhoopDashboard() {
    const { session, status, signIn, signOut } = useAuthClient();
    const [historicalResult, setHistoricalResult] = useState<CollectionStats | null>(null);
    const [dailyResult, setDailyResult] = useState<CollectionStats | null>(null);
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [syncStatus, setSyncStatus] = useState<any>(null);
    const [loading, setLoading] = useState({
        historical: false,
        daily: false,
        debug: false,
        syncStatus: false
    });

    const [sessionStatus, setSessionStatus] = useState<Record<string, any> | null>(null);
    const checkSessionStatusRef = useRef<() => Promise<void>>(async () => {});
    const getDebugInfoRef = useRef<() => Promise<void>>(async () => {});
    const getSyncStatusRef = useRef<() => Promise<void>>(async () => {});

    // Check session status (TODO: Migrate to FastAPI in Phase 6-7)
    const checkSessionStatus = async () => {
        try {
            console.log('🔍 Checking session status...');
            // TODO: Replace with FastAPI endpoint when WHOOP integration is implemented
            const status = await ApiClient.get<Record<string, any>>('/api/debug-session', {
                fallback: '/api/debug-session',
            });
            console.log('Session debug response:', status);
            setSessionStatus(status);
        } catch (error) {
            console.error('Failed to check session status:', error);
        }
    };

    const runHistoricalCollection = async () => {
        setLoading(prev => ({ ...prev, historical: true }));
        setHistoricalResult(null);

        try {
            console.log('🚀 Starting historical collection...');
            console.log('Session status:', !!session);
            console.log('User info:', session?.user);

            // TODO: Replace with FastAPI endpoint when WHOOP integration is implemented (Phase 6-7)
            // For now, use the existing Next.js endpoint
            const result = await integrationService.triggerWhoopCollector({ mode: 'historical' }) as any;
            console.log('API Response:', result);

            // Extract the actual data from the wrapper response
            const actualResult = (result as any)?.data || result;
            setHistoricalResult(actualResult);

            // Refresh debug info after collection
            setTimeout(getDebugInfo, 2000);
        } catch (error) {
            console.error('Historical collection error:', error);
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
            // TODO: Replace with FastAPI endpoint when WHOOP integration is implemented (Phase 6-7)
            const result = await integrationService.triggerWhoopDailySync({ dryRun: false }) as any;

            // Extract the data from the API response structure
            const apiData = (result as any)?.data || result;

            // Transform the userResults array into a single summary object for display
            const transformedResult = {
                totalUsers: apiData.totalUsers || 0,
                successfulUsers: apiData.successfulUsers || 0,
                failedUsers: apiData.failedUsers || 0,
                newCycles: 0,
                newSleep: 0,
                newRecovery: 0,
                newWorkouts: 0,
                errors: apiData.errors || []
            };

            // Sum up all the user results
            if (apiData.userResults && Array.isArray(apiData.userResults)) {
                transformedResult.newCycles = apiData.userResults.reduce((sum: number, user: any) => sum + (user.newCycles || 0), 0);
                transformedResult.newSleep = apiData.userResults.reduce((sum: number, user: any) => sum + (user.newSleep || 0), 0);
                transformedResult.newRecovery = apiData.userResults.reduce((sum: number, user: any) => sum + (user.newRecovery || 0), 0);
                transformedResult.newWorkouts = apiData.userResults.reduce((sum: number, user: any) => sum + (user.newWorkouts || 0), 0);
            }

            setDailyResult(transformedResult);

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
            const result = await analyticsService.getWhoopViewData() as ViewDataResponse;

            setDebugInfo({
                user: session?.user,
                data_counts: {
                    cycles: result.counts?.cycles || 0,
                    sleep: result.counts?.sleep || 0,
                    recovery: result.counts?.recovery || 0,
                    workouts: result.counts?.workouts || 0
                },
                latest_dates: {
                    latest_cycle: result.recent?.cycles?.[0]?.start_time,
                    latest_sleep: result.recent?.sleep?.[0]?.start_time,
                    latest_recovery: result.recent?.recovery?.[0]?.created_at,
                    latest_workout: result.recent?.workouts?.[0]?.start_time || result.recent?.workouts?.[0]?.created_at
                },
                database_status: !!result.success,
                api_status: result.success,
                schema_status: true,
                last_sync: result.latest_date
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
            // TODO: Replace with FastAPI endpoint when WHOOP integration is implemented (Phase 6-7)
            const result = await integrationService.getSyncStatus() as Record<string, any>;
            setSyncStatus(result);
        } catch (error) {
            console.error('Failed to get sync status:', error);
        }

        setLoading(prev => ({ ...prev, syncStatus: false }));
    };

    useEffect(() => {
        checkSessionStatusRef.current = checkSessionStatus;
        getDebugInfoRef.current = getDebugInfo;
        getSyncStatusRef.current = getSyncStatus;
    });

    // Auto-refresh debug info and sync status every 30 seconds when authenticated
    useEffect(() => {
        if (!session) return undefined;

        const refreshStatus = () => {
            getDebugInfoRef.current();
            getSyncStatusRef.current();
        };

        const initial = setTimeout(() => {
            refreshStatus();
            checkSessionStatusRef.current();
        }, 0);
        const interval = setInterval(() => {
            refreshStatus();
        }, 30000);
        return () => {
            clearTimeout(initial);
            clearInterval(interval);
        };
    }, [session]);

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
            <div className="min-h-screen relative overflow-hidden">
                <LiquidNav currentPage="apps" />
                {/* Animated Background */}
                <div className="fixed inset-0 -z-10">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/30 animate-gradient-xy"></div>
                    <div className="absolute top-0 left-0 w-full h-full opacity-20">
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="pt-32 md:pt-40 px-4 md:px-6 pb-20">
                    <div className="max-w-md mx-auto text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                        <p className="text-white/80 font-light">Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            <LiquidNav currentPage="apps" />
            {/* Animated Background */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/30 animate-gradient-xy"></div>
                <div className="absolute top-0 left-0 w-full h-full opacity-20">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
                </div>
            </div>

            {/* Main Content */}
            <div className="pt-32 md:pt-40 px-4 md:px-6 pb-20">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-20">
                        <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent leading-tight">
                            WHOOP Analytics
                        </h1>
                        <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed mb-12">
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
                                        onClick={(e) => {
                                            console.log('🖱️ Button clicked!', e);
                                            console.log('Loading state:', loading.historical);
                                            console.log('Session exists:', !!session);
                                            runHistoricalCollection();
                                        }}
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

                                    {/* Debug button */}
                                    <button
                                        onClick={checkSessionStatus}
                                        className="w-full mt-3 liquid-glass-secondary backdrop-blur-xl bg-white/[0.04] border border-white/[0.15] text-white/90 font-medium py-2 px-4 rounded-xl hover:bg-white/[0.08] hover:border-white/[0.25] hover:text-white transition-all duration-300"
                                    >
                                        🔍 Test Connection
                                    </button>

                                    {historicalResult && (
                                        <div className="mt-6 p-6 backdrop-blur-xl bg-white/[0.03] border border-white/[0.1] rounded-2xl">
                                            <h3 className="font-medium text-white mb-4">Historical Collection Results:</h3>

                                            {/* Always show success metrics */}
                                            <div className="text-green-400 space-y-3 font-light mb-6">
                                                <p className="flex items-center gap-3">
                                                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                                    Cycles: {historicalResult.totalCycles || historicalResult.newCycles || 0} processed
                                                </p>
                                                <p className="flex items-center gap-3">
                                                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                                    Sleep Records: {historicalResult.totalSleep || historicalResult.newSleep || 0} processed
                                                </p>
                                                <p className="flex items-center gap-3">
                                                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                                    Recovery Records: {historicalResult.totalRecovery || historicalResult.newRecovery || 0} processed
                                                </p>
                                                <p className="flex items-center gap-3">
                                                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                                    Workouts: {historicalResult.totalWorkouts || historicalResult.newWorkouts || 0} processed
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

                                            {/* Summary information */}
                                            {(dailyResult.totalUsers || dailyResult.successfulUsers || dailyResult.failedUsers) && (
                                                <div className="text-cyan-400 space-y-2 font-light mb-6 pb-4 border-b border-white/10">
                                                    <p className="flex items-center gap-3">
                                                        <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                                                        Users processed: {dailyResult.successfulUsers || 0} of {dailyResult.totalUsers || 0}
                                                    </p>
                                                    {(dailyResult.failedUsers || 0) > 0 && (
                                                        <p className="flex items-center gap-3 text-yellow-400">
                                                            <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                                                            Failed users: {dailyResult.failedUsers}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Data collection metrics */}
                                            <div className="text-green-400 space-y-3 font-light mb-6">
                                                <p className="flex items-center gap-3">
                                                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                                    Cycles: {dailyResult.totalCycles || dailyResult.newCycles || 0} processed
                                                </p>
                                                <p className="flex items-center gap-3">
                                                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                                    Sleep Records: {dailyResult.totalSleep || dailyResult.newSleep || 0} processed
                                                </p>
                                                <p className="flex items-center gap-3">
                                                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                                    Recovery Records: {dailyResult.totalRecovery || dailyResult.newRecovery || 0} processed
                                                </p>
                                                <p className="flex items-center gap-3">
                                                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                                    Workouts: {dailyResult.totalWorkouts || dailyResult.newWorkouts || 0} processed
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
                                            href="/apps/fitness-dashboard"
                                            className="liquid-glass-primary backdrop-blur-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-white font-light py-3 px-6 rounded-2xl hover:from-cyan-400/30 hover:to-blue-400/30 hover:border-cyan-300/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/25"
                                        >
                                            📈 Open Fitness Dashboard
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
