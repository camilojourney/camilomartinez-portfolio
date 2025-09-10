// 📂 src/components/features/astoria-conquest/AstoriaConquestDemo.tsx
/**
 * Astoria Conquest Demo Component
 * 
 * Demonstrates the base map with sample running data and shows how
 * real Strava GPS coordinates will be matched and displayed.
 */

'use client';

import React, { useState, useEffect } from 'react';
import AstoriaBaseMap from './AstoriaBaseMap';
import { 
  generateSampleRunData, 
  filterAstoriaPoints, 
  gpsPointsToSegments,
  prepareRouteForVisualization,
  loadMapMetadata,
  calculateCoverageStats,
  type GPSPoint,
  type StravaActivity,
  type MapBounds
} from '@/lib/utils/astoria-mapping';

interface MapMetadata {
  generated_at: string;
  coordinate_system: string;
  bounds: MapBounds;
  center: { lat: number; lng: number };
  reference_points: {
    home: { lat: number; lng: number };
    gym: { lat: number; lng: number };
  };
  stats: {
    total_nodes: number;
    total_edges: number;
    neighborhoods: string[];
  };
}

interface DemoStats {
  totalRuns: number;
  totalDistance: number;
  completedSegments: number;
  totalSegments: number;
  completionPercentage: number;
}

export default function AstoriaConquestDemo() {
  const [mapMetadata, setMapMetadata] = useState<MapMetadata | null>(null);
  const [sampleRuns, setSampleRuns] = useState<StravaActivity[]>([]);
  const [selectedRun, setSelectedRun] = useState<number | null>(null);
  const [showAllRuns, setShowAllRuns] = useState(true);
  const [stats, setStats] = useState<DemoStats>({
    totalRuns: 0,
    totalDistance: 0,
    completedSegments: 0,
    totalSegments: 1000, // Estimated from our base map
    completionPercentage: 0
  });

  // Load map metadata and generate sample data
  useEffect(() => {
    async function initializeDemo() {
      try {
        const metadata = await loadMapMetadata();
        setMapMetadata(metadata);
        
        // Generate 3-5 sample runs
        const runs: StravaActivity[] = [];
        for (let i = 0; i < 4; i++) {
          const run = generateSampleRunData(metadata.bounds);
          run.name = `Astoria Run ${i + 1}`;
          run.id = `demo-run-${i + 1}`;
          runs.push(run);
        }
        
        setSampleRuns(runs);
        
        // Calculate demo stats
        const totalDistance = runs.reduce((sum, run) => sum + run.distance, 0);
        const allSegments = runs.flatMap(run => {
          const astoriaPoints = filterAstoriaPoints(run, metadata.bounds);
          return gpsPointsToSegments(astoriaPoints);
        });
        
        setStats({
          totalRuns: runs.length,
          totalDistance: totalDistance / 1609.34, // Convert to miles
          completedSegments: allSegments.length,
          totalSegments: metadata.stats.total_edges,
          completionPercentage: (allSegments.length / metadata.stats.total_edges) * 100
        });
        
      } catch (error) {
        console.error('Failed to initialize demo:', error);
      }
    }

    initializeDemo();
  }, []);

  // Prepare route data for visualization
  const getRouteData = () => {
    if (!mapMetadata || sampleRuns.length === 0) return [];
    
    const runsToShow = selectedRun !== null ? [sampleRuns[selectedRun]] : sampleRuns;
    
    return runsToShow.flatMap((run, runIndex) => {
      const astoriaPoints = filterAstoriaPoints(run, mapMetadata.bounds);
      const segments = gpsPointsToSegments(astoriaPoints);
      
      return prepareRouteForVisualization(segments, runIndex % 2 === 0); // Alternate completed status
    });
  };

  // Prepare overlay points
  const getOverlayPoints = () => {
    if (!mapMetadata || sampleRuns.length === 0) return [];
    
    const runsToShow = selectedRun !== null ? [sampleRuns[selectedRun]] : sampleRuns;
    
    return runsToShow.flatMap((run, runIndex) => {
      const astoriaPoints = filterAstoriaPoints(run, mapMetadata.bounds);
      
      if (astoriaPoints.length === 0) return [];
      
      return [
        {
          lat: astoriaPoints[0].lat,
          lng: astoriaPoints[0].lng,
          type: 'start' as const,
          label: `Run ${runIndex + 1} Start`
        },
        {
          lat: astoriaPoints[astoriaPoints.length - 1].lat,
          lng: astoriaPoints[astoriaPoints.length - 1].lng,
          type: 'end' as const,
          label: `Run ${runIndex + 1} End`
        }
      ];
    });
  };

  const handleMapClick = (coordinates: { lat: number; lng: number }) => {
    console.log('Clicked coordinates:', coordinates);
    // This is where you'd implement street selection or route planning
  };

  return (
    <div className="space-y-6">
      {/* Demo Controls */}
      <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">🎮 Interactive Demo</h3>
          <div className="text-sm text-white/60">
            Sample data showing GPS coordinate matching
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* Run Selection */}
          <div>
            <label className="text-sm text-white/80 mb-2 block">Select Run to Highlight:</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedRun(null)}
                className={`px-3 py-1 rounded-lg text-sm transition-all ${
                  selectedRun === null
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                All Runs
              </button>
              {sampleRuns.map((run, index) => (
                <button
                  key={run.id}
                  onClick={() => setSelectedRun(index)}
                  className={`px-3 py-1 rounded-lg text-sm transition-all ${
                    selectedRun === index
                      ? 'bg-green-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  Run {index + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Demo Stats */}
          <div>
            <label className="text-sm text-white/80 mb-2 block">Demo Statistics:</label>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white/[0.03] rounded-lg p-2">
                <div className="text-cyan-400 font-semibold">{stats.totalRuns}</div>
                <div className="text-white/60 text-xs">Sample Runs</div>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-2">
                <div className="text-green-400 font-semibold">{stats.totalDistance.toFixed(1)}mi</div>
                <div className="text-white/60 text-xs">Total Distance</div>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-2">
                <div className="text-purple-400 font-semibold">{stats.completedSegments}</div>
                <div className="text-white/60 text-xs">GPS Segments</div>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-2">
                <div className="text-orange-400 font-semibold">{stats.completionPercentage.toFixed(1)}%</div>
                <div className="text-white/60 text-xs">Mock Coverage</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">🗺️ GPS Coordinate Matching Demo</h3>
          <div className="text-sm text-white/60">
            Drag to pan • Zoom controls on right • Click for coordinates
          </div>
        </div>

        {/* Map Info Header */}
        <div className="flex items-center justify-between text-sm text-white/70 mb-4 p-3 bg-white/[0.03] rounded-lg border border-white/[0.06]">
          <div className="flex items-center gap-6">
            <span>📍 Astoria, Queens ({mapMetadata?.stats.neighborhoods.length || 0} neighborhoods)</span>
            <span>🛣️ {mapMetadata?.stats.total_edges || 0} street segments</span>
            <span>📐 Area: ~15 square miles</span>
          </div>
          <div className="text-xs">
            Generated: {mapMetadata ? new Date(mapMetadata.generated_at).toLocaleDateString() : 'Loading...'}
          </div>
        </div>
        
        <AstoriaBaseMap
          overlayPoints={getOverlayPoints()}
          routePaths={getRouteData()}
          onMapClick={handleMapClick}
        />
      </div>

      {/* Implementation Notes */}
      <div className="backdrop-blur-2xl bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
        <h3 className="text-lg font-medium text-white mb-4">🔗 Strava Integration Plan</h3>
        
        <div className="grid md:grid-cols-2 gap-6 text-sm text-white/80">
          <div>
            <h4 className="font-medium text-white mb-2">📱 Real Data Pipeline:</h4>
            <ul className="space-y-1 text-white/70">
              <li>• Fetch activities from Strava API</li>
              <li>• Filter runs within Astoria bounds</li>
              <li>• Match GPS points to street segments</li>
              <li>• Calculate completion percentages</li>
              <li>• Update visualizations in real-time</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-white mb-2">🎯 Coordinate Matching:</h4>
            <ul className="space-y-1 text-white/70">
              <li>• GPS points → Street segment mapping</li>
              <li>• Distance-based street coverage</li>
              <li>• Tolerance for GPS accuracy (~10m)</li>
              <li>• Partial vs. complete street coverage</li>
              <li>• Progress tracking over time</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-400/20 rounded-lg">
          <div className="text-sm text-blue-300">
            <strong>Next Steps:</strong> Connect to your Strava account to replace this demo data with real running activities. 
            The coordinate system (EPSG:4326) ensures perfect alignment between Strava GPS data and the base map.
          </div>
        </div>
      </div>
    </div>
  );
}
