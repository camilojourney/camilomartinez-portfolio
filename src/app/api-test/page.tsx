/**
 * Test page to verify FastAPI backend connectivity
 * This page tests all the migrated API connections
 */
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { aiService, systemService } from '@/lib/api/config';

interface TestResult {
  endpoint: string;
  status: 'pending' | 'success' | 'error';
  response?: any;
  error?: string;
  duration?: number;
}

export default function APITestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateResult = (endpoint: string, result: Partial<TestResult>) => {
    setTestResults(prev => 
      prev.map(r => r.endpoint === endpoint ? { ...r, ...result } : r)
    );
  };

  const runTests = async () => {
    setIsRunning(true);
    
    const tests: TestResult[] = [
      { endpoint: 'System Health Check', status: 'pending' },
      { endpoint: 'System Detailed Health', status: 'pending' },
      { endpoint: 'AI Service Info', status: 'pending' },
      { endpoint: 'AI Chat Query', status: 'pending' },
      { endpoint: 'AI Trainer History', status: 'pending' },
    ];
    
    setTestResults(tests);

    // Test 1: System Health Check
    try {
      const start = Date.now();
      const response = await systemService.healthCheck();
      const duration = Date.now() - start;
      updateResult('System Health Check', { 
        status: 'success', 
        response, 
        duration 
      });
    } catch (error) {
      updateResult('System Health Check', { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }

    // Test 2: System Detailed Health
    try {
      const start = Date.now();
      const response = await systemService.detailedHealthCheck();
      const duration = Date.now() - start;
      updateResult('System Detailed Health', { 
        status: 'success', 
        response, 
        duration 
      });
    } catch (error) {
      updateResult('System Detailed Health', { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }

    // Test 3: AI Service Info
    try {
      const start = Date.now();
      const response = await fetch('http://localhost:9000/api/ai/');
      const data = await response.json();
      const duration = Date.now() - start;
      updateResult('AI Service Info', { 
        status: 'success', 
        response: data, 
        duration 
      });
    } catch (error) {
      updateResult('AI Service Info', { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }

    // Test 4: AI Chat Query
    try {
      const start = Date.now();
      const response = await aiService.query(
        'Hello! This is a test query to verify the API connection.', 
        false, 
        7
      );
      const duration = Date.now() - start;
      updateResult('AI Chat Query', { 
        status: 'success', 
        response, 
        duration 
      });
    } catch (error) {
      updateResult('AI Chat Query', { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }

    // Test 5: AI Trainer History (will likely fail without auth, but tests the endpoint)
    try {
      const start = Date.now();
      const response = await aiService.getTrainerHistory(5);
      const duration = Date.now() - start;
      updateResult('AI Trainer History', { 
        status: 'success', 
        response, 
        duration 
      });
    } catch (error) {
      updateResult('AI Trainer History', { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }

    setIsRunning(false);
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/30">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            FastAPI Backend Connection Test
          </h1>
          <p className="text-muted-foreground mb-6">
            Testing connectivity between frontend and FastAPI backend
          </p>
          <button
            onClick={runTests}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-foreground px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {isRunning ? 'Running Tests...' : 'Run API Tests'}
          </button>
        </div>

        <div className="grid gap-4 max-w-4xl mx-auto">
          {testResults.map((result) => (
            <Card key={result.endpoint} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getStatusIcon(result.status)}</span>
                  <h3 className="text-xl font-semibold text-foreground">
                    {result.endpoint}
                  </h3>
                  <span className={`text-sm ${getStatusColor(result.status)}`}>
                    {result.status.toUpperCase()}
                  </span>
                </div>
                {result.duration && (
                  <span className="text-sm text-muted-foreground">
                    {result.duration}ms
                  </span>
                )}
              </div>

              {result.error && (
                <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4 mb-4">
                  <p className="text-red-400 text-sm">
                    <strong>Error:</strong> {result.error}
                  </p>
                </div>
              )}

              {result.response && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Response:</h4>
                  <pre className="text-xs text-muted-foreground overflow-x-auto">
                    {JSON.stringify(result.response, null, 2)}
                  </pre>
                </div>
              )}
            </Card>
          ))}
        </div>

        {testResults.length > 0 && (
          <div className="mt-8 text-center">
            <div className="bg-slate-800/50 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-foreground mb-4">Test Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl text-green-400 font-bold">
                    {testResults.filter(r => r.status === 'success').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl text-red-400 font-bold">
                    {testResults.filter(r => r.status === 'error').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl text-yellow-400 font-bold">
                    {testResults.filter(r => r.status === 'pending').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}