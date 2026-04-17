'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { integrationService } from '@/lib/api/config';
// TODO: Import FastAPI client when WHOOP integration is implemented (Phase 6-7)
// import { ApiClient, API_ENDPOINTS } from '@/lib/api/config';

interface DailyFetchResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp?: string;
}

export function DailyFetchControl() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DailyFetchResult | null>(null);

  const handleDailyFetch = async (dryRun = false) => {
    setIsLoading(true);
    setResult(null);

    try {
      // TODO: Replace with FastAPI endpoint when WHOOP integration is implemented (Phase 6-7)
      const response = await fetch('/api/actions/daily-fetch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dryRun }),
      });
      
      const data = await response.json();
      setResult(data as DailyFetchResult);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to trigger daily fetch',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-8 border-white/10 hover:border-blue-400/30 transition-all duration-300">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/30 rounded-full px-6 py-3 mb-6">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
          <span className="text-blue-300 font-semibold tracking-wide">Data Pipeline Control</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
          Daily Data Sync
        </h2>
        <p className="text-white/70 text-lg max-w-3xl mx-auto leading-relaxed">
          Manually trigger the daily WHOOP data collection pipeline. This connects to the same cron job that runs automatically at 3 PM daily.
          <span className="block mt-2 text-blue-400 font-semibold">Real-time Token Refresh • Multi-user Data Processing • Error Handling</span>
          <span className="block mt-1 text-blue-300 text-sm">Skills: API Integration, Cron Jobs, Data Pipeline Engineering, Error Recovery</span>
        </p>
      </div>

      <div className="space-y-6">
        {/* Control Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => handleDailyFetch(true)}
            disabled={isLoading}
            className="px-8 py-4 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/30 rounded-lg text-blue-300 font-semibold hover:from-blue-500/30 hover:to-indigo-500/30 hover:border-blue-400/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Running...' : 'Test Connection (Dry Run)'}
          </button>
          
          <button
            onClick={() => handleDailyFetch(false)}
            disabled={isLoading}
            className="px-8 py-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-lg text-green-300 font-semibold hover:from-green-500/30 hover:to-emerald-500/30 hover:border-green-400/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Syncing...' : 'Sync Latest Data'}
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center">
            <div className="inline-flex items-center gap-3 text-white/60">
              <div className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
              <span>Processing data pipeline...</span>
            </div>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="mt-8">
            <div className={`p-6 rounded-lg border ${
              result.success 
                ? 'bg-green-500/10 border-green-400/30 text-green-300' 
                : 'bg-red-500/10 border-red-400/30 text-red-300'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                {result.success ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className="font-semibold">
                  {result.success ? 'Success' : 'Error'}
                </span>
                {result.timestamp && (
                  <span className="text-sm opacity-70">
                    {new Date(result.timestamp).toLocaleString()}
                  </span>
                )}
              </div>

              {result.error && (
                <div className="space-y-3">
                  <p className="text-sm mb-4">{result.error}</p>
                  
                  {/* Token refresh error guidance */}
                  {(result.error.includes('Token refresh failed') || 
                    result.error.includes('RefreshAccessTokenError') ||
                    result.error.includes('invalid_request') ||
                    result.error.includes('400 Bad Request')) && (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-400/20 rounded text-yellow-300 text-sm">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div>
                          <strong className="block mb-2">WHOOP Token Expired</strong>
                          <p className="mb-3">Your WHOOP authentication has expired. This is normal for security reasons.</p>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => window.location.href = '/signin'}
                              className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-400/30 rounded text-xs font-medium transition-colors"
                            >
                              Re-authenticate with WHOOP
                            </button>
                            <button 
                              onClick={() => window.location.href = '/whoop-dashboard'}
                              className="px-3 py-1.5 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-400/30 rounded text-xs font-medium transition-colors"
                            >
                              Go to Dashboard
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {result.data && (
                <div className="space-y-3">
                  {result.data.dryRun && (
                    <div className="p-4 bg-blue-500/10 border border-blue-400/20 rounded text-blue-300 text-sm">
                      <strong>Dry Run:</strong> Connection test successful. No data was actually fetched.
                    </div>
                  )}
                  
                  {result.data.data && result.data.data.totalUsers && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{result.data.data.totalUsers}</div>
                        <div className="opacity-70">Total Users</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{result.data.data.successfulUsers}</div>
                        <div className="opacity-70">Successful</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{result.data.data.failedUsers}</div>
                        <div className="opacity-70">Failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {result.data.data.tokenRefreshResults?.successful || 0}
                        </div>
                        <div className="opacity-70">Tokens Refreshed</div>
                      </div>
                    </div>
                  )}

                  {result.data.data && result.data.data.userResults && result.data.data.userResults.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-3">User Results:</h4>
                      <div className="space-y-2">
                        {result.data.data.userResults.map((user: any, index: number) => (
                          <div key={index} className="p-3 bg-white/5 rounded border border-white/10 text-sm">
                            <div className="font-medium">{user.userName}</div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs opacity-80">
                              <span>Cycles: {user.newCycles || 0}</span>
                              <span>Sleep: {user.newSleep || 0}</span>
                              <span>Recovery: {user.newRecovery || 0}</span>
                              <span>Workouts: {user.newWorkouts || 0}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
