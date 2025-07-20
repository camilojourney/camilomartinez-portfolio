'use client';

import { useState } from 'react';

export function DataCollectionTools() {
    const [loading, setLoading] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<any>(null);

    const runDataCollection = async (endpoint: string, name: string) => {
        setLoading(name);
        setLastResult(null);

        try {
            const response = await fetch(endpoint, {
                method: endpoint === '/api/view-data' || endpoint === '/api/check-data' ? 'GET' : 'POST'
            });
            const result = await response.json();
            setLastResult(result);

            // Show success message
            if (result.success !== false) {
                alert(`✅ ${name} completed successfully!\n\nData: ${JSON.stringify(result, null, 2)}`);
            } else {
                alert(`❌ ${name} failed:\n\n${result.error || JSON.stringify(result, null, 2)}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert(`❌ ${name} failed:\n\n${error}`);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="liquid-glass-card backdrop-blur-lg bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8">
            <h2 className="text-2xl font-semibold text-white mb-6 text-center">
                Data Collection Tools
            </h2>
            <p className="text-white/70 text-center mb-8">
                Use these tools to collect and sync your WHOOP data to the database for analysis.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Historical Data Collection */}
                <div className="liquid-glass-card backdrop-blur-lg bg-green-500/10 border border-green-400/20 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Historical Data</h3>
                    <p className="text-white/70 text-sm mb-6">
                        Collect your historical WHOOP data (last 30 days) and store it in the database.
                    </p>
                    <button
                        onClick={() => runDataCollection('/api/whoop-backfill', 'Historical Data Collection')}
                        disabled={loading !== null}
                        className="w-full bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 text-green-300 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading === 'Historical Data Collection' ? 'Collecting...' : 'Collect Historical Data'}
                    </button>
                </div>

                {/* Daily Sync */}
                <div className="liquid-glass-card backdrop-blur-lg bg-blue-500/10 border border-blue-400/20 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Daily Sync</h3>
                    <p className="text-white/70 text-sm mb-6">
                        Sync recent data and fill in any missing sleep/recovery information.
                    </p>
                    <button
                        onClick={() => runDataCollection('/api/whoop-collector-daily', 'Daily Sync')}
                        disabled={loading !== null}
                        className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-300 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading === 'Daily Sync' ? 'Syncing...' : 'Run Daily Sync'}
                    </button>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* View Data */}
                <div className="liquid-glass-card backdrop-blur-lg bg-purple-500/10 border border-purple-400/20 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">View Database</h3>
                    <p className="text-white/70 text-sm mb-6">
                        Check what data is currently stored in the database.
                    </p>
                    <button
                        onClick={() => runDataCollection('/api/view-data', 'View Database')}
                        disabled={loading !== null}
                        className="w-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-300 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading === 'View Database' ? 'Loading...' : 'View Data Counts'}
                    </button>
                </div>

                {/* Check Schema */}
                <div className="liquid-glass-card backdrop-blur-lg bg-cyan-500/10 border border-cyan-400/20 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Check Schema</h3>
                    <p className="text-white/70 text-sm mb-6">
                        Verify the database schema and data integrity.
                    </p>
                    <button
                        onClick={() => runDataCollection('/api/check-data', 'Check Schema')}
                        disabled={loading !== null}
                        className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-300 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading === 'Check Schema' ? 'Checking...' : 'Check Schema'}
                    </button>
                </div>
            </div>

            {/* Status Display */}
            {loading && (
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-400/20 rounded-lg">
                    <div className="flex items-center gap-3 text-blue-300">
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>Running {loading}...</span>
                    </div>
                </div>
            )}

            {lastResult && (
                <details className="mt-6 liquid-glass-card backdrop-blur-lg bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
                    <summary className="p-4 cursor-pointer hover:bg-white/[0.03] transition-colors">
                        <span className="text-white font-medium">View Last Result</span>
                    </summary>
                    <div className="border-t border-white/[0.08] p-4 bg-black/20">
                        <pre className="text-xs text-white/80 whitespace-pre-wrap overflow-x-auto">
                            {JSON.stringify(lastResult, null, 2)}
                        </pre>
                    </div>
                </details>
            )}
        </div>
    );
}
