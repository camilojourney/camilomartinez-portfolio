'use client';

import { useState } from 'react';
import { ApiClient, analyticsService, integrationService } from '@/lib/api/config';

export function DataCollectionTools() {
    const [loading, setLoading] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<any>(null);

    const runDataCollection = async (
        action: 'historical' | 'daily' | 'view' | 'check',
        name: string
    ) => {
        setLoading(name);
        setLastResult(null);

        try {
            let result: any;

            switch (action) {
                case 'historical':
                    result = await integrationService.triggerWhoopCollector({ mode: 'historical' });
                    break;
                case 'daily':
                    result = await integrationService.triggerWhoopDailySync({ dryRun: false });
                    break;
                case 'view':
                    result = await analyticsService.getWhoopViewData();
                    break;
                case 'check':
                    result = await ApiClient.get('/api/check-data', { fallback: '/api/check-data' });
                    break;
                default:
                    result = { success: false, error: 'Unknown action' };
            }

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
        <div className="panel bg-surface-2 border border-line rounded-2xl p-8">
            <h2 className="text-2xl font-semibold text-ink mb-6 text-center">
                Data Collection Tools
            </h2>
            <p className="text-muted text-center mb-8">
                Use these tools to collect and sync your WHOOP data to the database for analysis.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Historical Data Collection */}
                <div className="panel border rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-ink mb-4">Historical Data</h3>
                    <p className="text-muted text-sm mb-6">
                        Collect your historical WHOOP data (last 30 days) and store it in the database.
                    </p>
                    <button
                        onClick={() => runDataCollection('historical', 'Historical Data Collection')}
                        disabled={loading !== null}
                        className="w-full hover:border text-live px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading === 'Historical Data Collection' ? 'Collecting...' : 'Collect Historical Data'}
                    </button>
                </div>

                {/* Daily Sync */}
                <div className="panel border rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-ink mb-4">Daily Sync</h3>
                    <p className="text-muted text-sm mb-6">
                        Sync recent data and fill in any missing sleep/recovery information.
                    </p>
                    <button
                        onClick={() => runDataCollection('daily', 'Daily Sync')}
                        disabled={loading !== null}
                        className="w-full hover:border text-ink px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading === 'Daily Sync' ? 'Syncing...' : 'Run Daily Sync'}
                    </button>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* View Data */}
                <div className="panel border rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-ink mb-4">View Database</h3>
                    <p className="text-muted text-sm mb-6">
                        Check what data is currently stored in the database.
                    </p>
                    <button
                        onClick={() => runDataCollection('view', 'View Database')}
                        disabled={loading !== null}
                        className="w-full hover:border text-ink px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading === 'View Database' ? 'Loading...' : 'View Data Counts'}
                    </button>
                </div>

                {/* Check Schema */}
                <div className="panel border rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-ink mb-4">Check Schema</h3>
                    <p className="text-muted text-sm mb-6">
                        Verify the database schema and data integrity.
                    </p>
                    <button
                        onClick={() => runDataCollection('check', 'Check Schema')}
                        disabled={loading !== null}
                        className="w-full hover:border text-ink px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading === 'Check Schema' ? 'Checking...' : 'Check Schema'}
                    </button>
                </div>
            </div>

            {/* Status Display */}
            {loading && (
                <div className="mt-6 p-4 border rounded-lg">
                    <div className="flex items-center gap-3 text-ink">
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>Running {loading}...</span>
                    </div>
                </div>
            )}

            {lastResult && (
                <details className="mt-6 panel bg-surface-2 border border-line rounded-2xl overflow-hidden">
                    <summary className="p-4 cursor-pointer hover:bg-surface-2 transition-colors">
                        <span className="text-ink font-medium">View Last Result</span>
                    </summary>
                    <div className="border-t border-line p-4 bg-surface-2">
                        <pre className="text-xs text-ink whitespace-pre-wrap overflow-x-auto">
                            {JSON.stringify(lastResult, null, 2)}
                        </pre>
                    </div>
                </details>
            )}
        </div>
    );
}
