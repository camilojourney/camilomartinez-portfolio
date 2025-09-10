// 📂 src/app/(main)/astoria-conquest/page.tsx
/**
 * Astoria Conquest main page
 * Interactive map showing progress toward running every street in Astoria
 */

import { Metadata } from 'next';
import LiquidNav from '@/components/shared/liquid-nav';
import AstoriaBaseMap from '@/components/features/astoria-conquest/AstoriaBaseMap';
import AstoriaConquestDemo from '@/components/features/astoria-conquest/AstoriaConquestDemo';
// import { AstoriaRunMap } from '@/components/features/astoria-conquest/AstoriaRunMap';
// import { ProgressDashboard } from '@/components/features/astoria-conquest/ProgressDashboard';
import { AstoriaTrackerData } from '@/types/strava';

export const metadata: Metadata = {
  title: 'Astoria Conquest | Running Every Street',
  description: 'Interactive map tracking my progress toward running every street in Astoria, Queens. Real-time data from Strava with geospatial analysis.',
  keywords: ['running', 'strava', 'astoria', 'queens', 'street running', 'fitness tracking', 'geospatial'],
  openGraph: {
    title: 'Astoria Conquest - Running Every Street',
    description: 'Follow my journey to run every street in Astoria, Queens',
    type: 'website',
  }
};

async function getAstoriaConquestData(): Promise<any | null> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/astoria-conquest`, {
      // Add cache control for better performance
      next: { revalidate: 300 } // Revalidate every 5 minutes
    });

    if (!response.ok) {
      console.error('Failed to fetch Astoria conquest data:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Astoria conquest data:', error);
    return null;
  }
}

export default async function AstoriaConquestPage() {
  const data = await getAstoriaConquestData();

  // If data fetch failed, show error state with sample data
  if (!data) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <LiquidNav currentPage="projects" />
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
            <div className="text-center mb-8">
              <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent leading-tight flex items-center justify-center gap-3">
                <span>🗺️</span>
                Astoria Conquest
              </h1>
              <p className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto leading-relaxed">
                Running every street in Astoria, Queens
              </p>
            </div>
            
            <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl shadow-black/20 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-500 p-8 text-center">
              <h2 className="text-2xl font-light text-white mb-4">
                🚧 Setting up the conquest...
              </h2>
              <p className="text-white/70 mb-6">
                The Astoria Conquest feature is currently being initialized. This includes setting up the street database and connecting to Strava for real-time tracking.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl mb-2">🏃‍♂️</div>
                  <h3 className="text-lg text-white font-medium mb-2">Strava Integration</h3>
                  <p className="text-white/60 text-sm">Real-time run tracking from your Strava activities</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🗺️</div>
                  <h3 className="text-lg text-white font-medium mb-2">Interactive Map</h3>
                  <p className="text-white/60 text-sm">Visual progress with street completion status</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">📊</div>
                  <h3 className="text-lg text-white font-medium mb-2">Progress Analytics</h3>
                  <p className="text-white/60 text-sm">Detailed statistics and completion tracking</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <LiquidNav currentPage="projects" />
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
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent leading-tight flex items-center justify-center gap-3">
              <span>🗺️</span>
              Astoria Conquest
            </h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto leading-relaxed mb-6">
              An ambitious quest to run every street in Astoria, Queens. 
              Real-time progress tracking powered by <span className="text-cyan-400 font-semibold">Strava</span> and <span className="text-blue-400 font-semibold">geospatial analysis</span>.
            </p>
            
            {/* Quick Stats Banner */}
            <div className="inline-flex items-center gap-6 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 text-white">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {data.stats?.totalRuns || 0}
                </div>
                <div className="text-xs text-white/60">Total Runs</div>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {Math.round((data.stats?.totalDistance || 0) / 1609.34)}
                </div>
                <div className="text-xs text-white/60">Miles</div>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {data.runs?.length || 0}
                </div>
                <div className="text-xs text-white/60">Activities</div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="space-y-8">
            {/* Interactive Demo Section */}
            <AstoriaConquestDemo />
          </div>

          {/* Research & Analysis Section */}
          <div className="mt-12">
            <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl shadow-black/20 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-500 p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-medium text-white mb-4 flex items-center justify-center gap-3">
                  <span>📊</span>
                  Research & Methodology
                </h3>
                <p className="text-white/70 max-w-3xl mx-auto">
                  Dive deep into the technical analysis, algorithms, and data science methodology 
                  that powers this project. View the complete research process from data collection to route optimization.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Research Process */}
                <div>
                  <h4 className="text-lg font-medium text-white mb-4">🔬 Research Process</h4>
                  <div className="space-y-3 text-sm text-white/80">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-500/20 border border-blue-400/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-300 text-xs font-bold">1</span>
                      </div>
                      <div>
                        <strong>Data Collection & Processing</strong>
                        <p className="text-white/60 text-xs mt-1">NYC street network analysis, Strava API integration</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-purple-500/20 border border-purple-400/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-purple-300 text-xs font-bold">2</span>
                      </div>
                      <div>
                        <strong>Graph Theory Application</strong>
                        <p className="text-white/60 text-xs mt-1">Network optimization and route planning algorithms</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-green-500/20 border border-green-400/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-300 text-xs font-bold">3</span>
                      </div>
                      <div>
                        <strong>Geospatial Analysis</strong>
                        <p className="text-white/60 text-xs mt-1">PostGIS spatial operations and coverage calculations</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-orange-500/20 border border-orange-400/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-orange-300 text-xs font-bold">4</span>
                      </div>
                      <div>
                        <strong>Optimization & Validation</strong>
                        <p className="text-white/60 text-xs mt-1">Algorithm testing and real-world validation</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technical Report */}
                <div>
                  <h4 className="text-lg font-medium text-white mb-4">📋 Technical Analysis</h4>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6">
                    <div className="text-center mb-4">
                      <div className="text-3xl mb-3">📄</div>
                      <h5 className="text-white font-medium mb-2">Complete Research Report</h5>
                      <p className="text-white/60 text-sm mb-4">
                        View the full technical analysis including code, visualizations, 
                        and detailed methodology used in this project.
                      </p>
                    </div>
                    
                    <div className="space-y-3 text-sm text-white/70 mb-6">
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Interactive data visualizations</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Complete code documentation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Algorithm explanations</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Performance analysis</span>
                      </div>
                    </div>

                    <a
                      href="/routes_astoria.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-white text-center py-3 px-4 rounded-xl hover:from-cyan-400/30 hover:to-blue-400/30 hover:border-cyan-300/50 transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl hover:shadow-cyan-500/20"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span>📊 View Complete Analysis</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-12 text-center">
            <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl shadow-black/20 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-500 p-6">
              <h3 className="text-lg font-medium text-white mb-3">
                How it works
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-white/70">
                <div>
                  <strong className="text-white">📱 Data Collection:</strong> 
                  Automatically syncs running activities from Strava daily
                </div>
                <div>
                  <strong className="text-white">🗺️ Geospatial Analysis:</strong> 
                  Uses PostGIS to match runs with Astoria's street network
                </div>
                <div>
                  <strong className="text-white">📊 Progress Tracking:</strong> 
                  Real-time statistics and visual progress on the interactive map
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/10 text-xs text-white/50">
                Data automatically synced from Strava • Real-time geospatial analysis
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
