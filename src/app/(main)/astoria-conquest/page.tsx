// 📂 src/app/(main)/astoria-conquest/page.tsx
/**
 * Astoria Conquest main page
 * Interactive map showing progress toward running every street in Astoria
 */

import { Metadata } from 'next';
import LiquidPage from '@/components/shared/liquid-page';
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

async function getAstoriaConquestData(): Promise<AstoriaTrackerData | null> {
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
      <LiquidPage>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-light text-white mb-4">
                🗺️ Astoria Conquest
              </h1>
              <p className="text-xl text-white/70 max-w-2xl mx-auto">
                Running every street in Astoria, Queens
              </p>
            </div>
            
            <div className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-8 text-center">
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
      </LiquidPage>
    );
  }

  return (
    <LiquidPage>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-light text-white mb-4 flex items-center justify-center gap-3">
              <span>🗺️</span>
              Astoria Conquest
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-6">
              An ambitious quest to run every street in Astoria, Queens. 
              Real-time progress tracking powered by Strava and geospatial analysis.
            </p>
            
            {/* Quick Stats Banner */}
            <div className="inline-flex items-center gap-6 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 text-white">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {data.stats.completionPercentage.toFixed(1)}%
                </div>
                <div className="text-xs text-white/60">Complete</div>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {data.stats.completedStreets}
                </div>
                <div className="text-xs text-white/60">Streets</div>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {(data.stats.completedDistanceMeters / 1609.34).toFixed(1)}
                </div>
                <div className="text-xs text-white/60">Miles</div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Map Section - Takes up 3 columns on large screens */}
            <div className="lg:col-span-3">
              <div className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-light text-white">
                    Interactive Progress Map
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>Partial</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <span>Unvisited</span>
                    </div>
                  </div>
                </div>
                
                {/* <AstoriaRunMap 
                  allStreetsData={data.allStreetsGeoJSON}
                  runData={data.runGeometriesGeoJSON}
                /> */}
                <div className="h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-4xl mb-4">🗺️</div>
                    <h3 className="text-xl font-medium mb-2">Interactive Map Coming Soon</h3>
                    <p className="text-white/70">
                      Map component will display Astoria streets with completion status
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Sidebar - Takes up 1 column */}
            <div className="lg:col-span-1">
              {/* <ProgressDashboard stats={data.stats} /> */}
              <div className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-3xl p-6">
                <h2 className="text-xl font-light text-white mb-6">
                  📊 Progress Dashboard
                </h2>
                <div className="space-y-6">
                  <div>
                    <div className="text-3xl font-bold text-green-400 mb-1">
                      {data.stats.completionPercentage.toFixed(1)}%
                    </div>
                    <div className="text-white/70 text-sm">Overall Progress</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-xl font-semibold text-blue-400">
                        {data.stats.completedStreets}
                      </div>
                      <div className="text-white/60 text-xs">Completed</div>
                    </div>
                    <div>
                      <div className="text-xl font-semibold text-gray-400">
                        {data.stats.unvisitedStreets}
                      </div>
                      <div className="text-white/60 text-xs">Remaining</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-lg font-semibold text-purple-400">
                      {(data.stats.completedDistanceMeters / 1609.34).toFixed(1)} mi
                    </div>
                    <div className="text-white/60 text-xs">Distance Completed</div>
                  </div>

                  <div>
                    <div className="text-lg font-semibold text-orange-400">
                      {data.stats.totalRunsCount}
                    </div>
                    <div className="text-white/60 text-xs">Total Runs</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-12 text-center">
            <div className="liquid-glass-card backdrop-blur-2xl bg-white/[0.06] border border-white/[0.1] rounded-2xl p-6">
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
    </LiquidPage>
  );
}
