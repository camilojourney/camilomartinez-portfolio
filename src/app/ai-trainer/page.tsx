// 📂 src/app/ai-trainer/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface EvaluationCycle {
  id: string;
  status: 'running' | 'completed' | 'failed';
  created_at: string;
  completed_at: string | null;
  total_questions: number;
  successful_queries: number;
  failed_queries: number;
  avg_response_time: number;
  accuracy_score: number;
  metadata: {
    error_patterns?: string[];
    improvement_suggestions?: string[];
  };
}

interface QueryHistory {
  query: string;
  success: boolean;
  response_time: number;
  timestamp: string;
  error_message?: string;
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

// Helper function to extract improvement suggestions from analysis text
const extractImprovementSuggestions = (analysis: string): string[] => {
  if (!analysis) return [];
  
  const suggestions = [];
  
  // Look for common patterns in the analysis
  if (analysis.includes('Schema Description Updates')) {
    suggestions.push('Update schema descriptions with accurate column names and relationships');
  }
  if (analysis.includes('System Prompt Improvements')) {
    suggestions.push('Enhance system prompts with better examples for SQL operations');
  }
  if (analysis.includes('Query Validation')) {
    suggestions.push('Implement pre-execution query validation system');
  }
  if (analysis.includes('API Stability') || analysis.includes('500 Internal Server Error')) {
    suggestions.push('Address backend API stability and error handling');
  }
  if (analysis.includes('Test Coverage')) {
    suggestions.push('Increase test coverage for edge cases and complex queries');
  }
  
  return suggestions.length > 0 ? suggestions : ['Review detailed analysis for specific recommendations'];
};

export default function AITrainerPage() {
  const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'cycles' | 'insights'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCycles();
  }, []);

  const fetchCycles = async () => {
    try {
      const response = await fetch('/api/ai-trainer/history');
      const data = await response.json();
      if (data.success && data.data?.history) {
        // Map the API response to match our interface
        const mappedCycles = data.data.history.map((cycle: any) => ({
          id: cycle.id.toString(),
          status: cycle.status,
          created_at: cycle.start_time,
          completed_at: cycle.end_time || null,
          total_questions: cycle.total_questions,
          successful_queries: cycle.success_count,
          failed_queries: (cycle.total_questions || 0) - (cycle.success_count || 0),
          avg_response_time: cycle.duration_seconds ? cycle.duration_seconds * 1000 : 0,
          accuracy_score: cycle.success_rate,
          metadata: {
            error_patterns: cycle.failure_analysis ? [cycle.failure_analysis] : [],
            improvement_suggestions: cycle.failure_analysis ? extractImprovementSuggestions(cycle.failure_analysis) : []
          }
        }));
        setCycles(mappedCycles);
        setIsRunning(data.data.isRunning || false);
      }
    } catch (error) {
      console.error('Error fetching cycles:', error);
    } finally {
      setLoading(false);
    }
  };

  const runEvaluationCycle = async () => {
    setIsRunning(true);
    try {
      const response = await fetch('/api/ai-trainer/run-cycle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ numQuestions: 5 }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Use the returned cycle ID for more specific tracking
        console.log('✅ Evaluation cycle started:', result.message);
        console.log('🔍 Tracking cycle:', result.cycleId);
        pollCycleStatus(result.cycleId);
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error running cycle:', error);
      alert(`Failed to start evaluation cycle: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsRunning(false);
    }
  };

  const pollCycleStatus = async (cycleId?: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/ai-trainer/history');
        const data = await response.json();
        
        if (data.success && data.data?.history) {
          const mappedCycles = data.data.history.map((cycle: any) => ({
            id: cycle.id.toString(),
            status: cycle.status,
            created_at: cycle.start_time,
            completed_at: cycle.end_time || null,
            total_questions: cycle.total_questions,
            successful_queries: cycle.success_count,
            failed_queries: (cycle.total_questions || 0) - (cycle.success_count || 0),
            avg_response_time: cycle.duration_seconds ? cycle.duration_seconds * 1000 : 0,
            accuracy_score: cycle.success_rate,
            metadata: {
              error_patterns: cycle.failure_analysis ? [cycle.failure_analysis] : [],
              improvement_suggestions: []
            }
          }));
          
          setCycles(mappedCycles);
          
          // Check if we have any running cycles
          const runningCycles = mappedCycles.filter((c: any) => c.status === 'running');
          
          // If we have a specific cycle ID, check just that one
          if (cycleId) {
            const currentCycle = mappedCycles.find((c: any) => c.id === cycleId);
            if (currentCycle && currentCycle.status !== 'running') {
              setIsRunning(false);
              clearInterval(interval);
            }
          } else {
            // If no specific cycle ID, check if any cycles are running
            if (runningCycles.length === 0) {
              setIsRunning(false);
              clearInterval(interval);
            }
          }
          
          // Also check the global running status if available
          if (data.data.isRunning === false) {
            setIsRunning(false);
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Error polling cycle status:', error);
        // On error, stop polling after a few retries
        setIsRunning(false);
        clearInterval(interval);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 10 minutes max
    setTimeout(() => {
      clearInterval(interval);
      setIsRunning(false);
    }, 600000);
  };

  const getOverviewStats = () => {
    if (cycles.length === 0) return { totalCycles: 0, avgAccuracy: 0, totalQueries: 0, successRate: 0 };
    
    const totalCycles = cycles.length;
    const completedCycles = cycles.filter(c => c.status === 'completed');
    const avgAccuracy = completedCycles.reduce((sum, c) => sum + (c.accuracy_score || 0), 0) / completedCycles.length;
    const totalQueries = cycles.reduce((sum, c) => sum + c.total_questions, 0);
    const totalSuccessful = cycles.reduce((sum, c) => sum + c.successful_queries, 0);
    const successRate = totalQueries > 0 ? (totalSuccessful / totalQueries) * 100 : 0;

    return { totalCycles, avgAccuracy, totalQueries, successRate };
  };

  const getChartData = () => {
    return cycles
      .filter(c => c.status === 'completed')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((cycle, index) => ({
        cycle: index + 1,
        accuracy: cycle.accuracy_score || 0,
        responseTime: cycle.avg_response_time || 0,
        successRate: cycle.total_questions > 0 ? (cycle.successful_queries / cycle.total_questions) * 100 : 0,
        date: new Date(cycle.created_at).toLocaleDateString(),
      }));
  };

  const getStatusDistribution = () => {
    const statusCounts = cycles.reduce((acc, cycle) => {
      acc[cycle.status] = (acc[cycle.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }));
  };

  const stats = getOverviewStats();
  const chartData = getChartData();
  const statusData = getStatusDistribution();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            AI Trainer Dashboard
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Monitor and improve your AI query engine performance through automated evaluation cycles
          </p>
        </motion.div>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-12"
        >
          <button
            onClick={runEvaluationCycle}
            disabled={isRunning}
            className="relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm border border-white/10"
          >
            {isRunning ? (
              <span className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                Running Evaluation Cycle...
              </span>
            ) : (
              'Run New Evaluation Cycle'
            )}
          </button>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-1 border border-white/10">
            {['overview', 'cycles', 'insights'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`px-6 py-3 rounded-lg capitalize transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Cycles', value: stats.totalCycles, color: 'from-blue-500 to-blue-600' },
                  { label: 'Avg Accuracy', value: `${stats.avgAccuracy.toFixed(1)}%`, color: 'from-green-500 to-green-600' },
                  { label: 'Total Queries', value: stats.totalQueries, color: 'from-purple-500 to-purple-600' },
                  { label: 'Success Rate', value: `${stats.successRate.toFixed(1)}%`, color: 'from-orange-500 to-orange-600' },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                  >
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center mb-4`}>
                      <div className="w-6 h-6 bg-white rounded opacity-80" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                    <p className="text-gray-400">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Charts */}
              {chartData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Accuracy Trend */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <h3 className="text-xl font-semibold mb-6 text-white">Accuracy Trend</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="cycle" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px'
                          }} 
                        />
                        <Line type="monotone" dataKey="accuracy" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Status Distribution */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <h3 className="text-xl font-semibold mb-6 text-white">Cycle Status Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cycles' && (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left p-4 text-gray-300">Cycle ID</th>
                      <th className="text-left p-4 text-gray-300">Status</th>
                      <th className="text-left p-4 text-gray-300">Questions</th>
                      <th className="text-left p-4 text-gray-300">Success Rate</th>
                      <th className="text-left p-4 text-gray-300">Avg Response Time</th>
                      <th className="text-left p-4 text-gray-300">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cycles.map((cycle, index) => (
                      <motion.tr
                        key={cycle.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-t border-white/10 hover:bg-white/5 transition-colors"
                      >
                        <td className="p-4 font-mono text-sm text-blue-400">{cycle.id.slice(0, 8)}...</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            cycle.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            cycle.status === 'running' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {cycle.status}
                          </span>
                        </td>
                        <td className="p-4 text-gray-300">{cycle.total_questions}</td>
                        <td className="p-4 text-gray-300">
                          {cycle.total_questions > 0 ? `${((cycle.successful_queries / cycle.total_questions) * 100).toFixed(1)}%` : 'N/A'}
                        </td>
                        <td className="p-4 text-gray-300">{cycle.avg_response_time || 0}ms</td>
                        <td className="p-4 text-gray-300">{new Date(cycle.created_at).toLocaleString()}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
                {cycles.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    No evaluation cycles found. Run your first cycle to get started!
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-8">
              {/* Latest Analysis Report */}
              {cycles.length > 0 && cycles[0].metadata?.error_patterns && cycles[0].metadata.error_patterns.length > 0 && (
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <h3 className="text-xl font-semibold mb-6 text-white">Latest Analysis Report</h3>
                  <div className="prose prose-invert max-w-none">
                    <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                      {cycles[0].metadata.error_patterns[0]}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Insights Summary */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold mb-4 text-white">Performance Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-300 mb-3">Common Error Patterns</h4>
                    <div className="space-y-2">
                      <div className="text-sm text-red-400 bg-red-500/10 rounded-lg p-3">
                        <strong>API Stability Issues:</strong> 70% of failures due to 500 Internal Server Errors
                      </div>
                      <div className="text-sm text-red-400 bg-red-500/10 rounded-lg p-3">
                        <strong>Schema Mismatches:</strong> Missing columns like 'workout_date', 'user_id', 'start_time'
                      </div>
                      <div className="text-sm text-red-400 bg-red-500/10 rounded-lg p-3">
                        <strong>Query Formation:</strong> Incorrect aggregation functions and WHERE clauses
                      </div>
                      <div className="text-sm text-red-400 bg-red-500/10 rounded-lg p-3">
                        <strong>Date Functions:</strong> Using table names instead of column names in DATE() functions
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-300 mb-3">Improvement Suggestions</h4>
                    <div className="space-y-2">
                      <div className="text-sm text-blue-400 bg-blue-500/10 rounded-lg p-3">
                        <strong>Schema Updates:</strong> Enhance descriptions with correct column names and relationships
                      </div>
                      <div className="text-sm text-blue-400 bg-blue-500/10 rounded-lg p-3">
                        <strong>Query Validation:</strong> Implement pre-execution validation for SQL syntax
                      </div>
                      <div className="text-sm text-blue-400 bg-blue-500/10 rounded-lg p-3">
                        <strong>System Prompts:</strong> Add examples for aggregation functions and time-based queries
                      </div>
                      <div className="text-sm text-blue-400 bg-blue-500/10 rounded-lg p-3">
                        <strong>Error Handling:</strong> Improve API stability and graceful error recovery
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {chartData.length > 1 && (
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <h3 className="text-xl font-semibold mb-6 text-white">Response Time vs Success Rate</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="cycle" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="responseTime" fill="#8B5CF6" name="Response Time (ms)" />
                      <Bar dataKey="successRate" fill="#10B981" name="Success Rate (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}