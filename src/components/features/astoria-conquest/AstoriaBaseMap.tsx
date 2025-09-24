// 📂 src/components/features/astoria-conquest/AstoriaBaseMap.tsx
/**
 * Astoria Base Map Component
 * 
 * Displays the generated base map image with proper coordinate mapping
 * for overlaying Strava GPS data and route visualization.
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface MapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

interface ReferencePoint {
  lat: number;
  lng: number;
}

interface MapMetadata {
  generated_at: string;
  coordinate_system: string;
  bounds: MapBounds;
  center: ReferencePoint;
  reference_points: {
    home: ReferencePoint;
    gym: ReferencePoint;
  };
  stats: {
    total_nodes: number;
    total_edges: number;
    neighborhoods: string[];
  };
}

interface AstoriaBaseMapProps {
  /** Additional GPS points to overlay on the map */
  overlayPoints?: Array<{
    lat: number;
    lng: number;
    type: 'start' | 'end' | 'waypoint' | 'completed';
    label?: string;
  }>;
  /** Optional route paths to overlay */
  routePaths?: Array<{
    coordinates: Array<[number, number]>; // [lng, lat] format
    style: {
      color: string;
      width: number;
      opacity: number;
    };
    completed?: boolean;
  }>;
  /** Custom map bounds to use instead of metadata bounds (for GPS data that extends beyond original map) */
  customBounds?: MapBounds;
  /** Original map bounds for reference */
  originalBounds?: MapBounds;
  /** Callback when map is clicked */
  onMapClick?: (coordinates: { lat: number; lng: number }) => void;
  /** Whether to show the pre-processed route overlays */
  showRoutes?: boolean;
  /** Selected routes to display */
  selectedRoutes?: string[];
  /** Callback when a route is selected */
  onRouteSelect?: (routeId: string) => void;
}export default function AstoriaBaseMap({ 
  overlayPoints = [], 
  routePaths = [],
  customBounds,
  originalBounds,
  onMapClick,
  showRoutes = true,
  selectedRoutes = [],
  onRouteSelect
}: AstoriaBaseMapProps) {
  const [mapMetadata, setMapMetadata] = useState<MapMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [autoFitApplied, setAutoFitApplied] = useState(false);

  // Always use original map bounds for coordinate system
  const activeBounds = mapMetadata?.bounds;

  console.log('🗺️ AstoriaBaseMap bounds configuration:');
  console.log('   Custom bounds provided:', !!customBounds);
  console.log('   Active bounds:', activeBounds);
  console.log('   Original bounds:', originalBounds);
  console.log('   Route paths:', routePaths.length);

  // Load map metadata
  useEffect(() => {
    async function loadMapMetadata() {
      try {
        const response = await fetch('/maps/astoria/map-metadata.json');
        if (!response.ok) throw new Error('Failed to load map metadata');
        
        const metadata: MapMetadata = await response.json();
        setMapMetadata(metadata);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }

    loadMapMetadata();
  }, []);

  // Handle container resizing with proper initialization
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        console.log('📐 Container dimensions updated:', { width: offsetWidth, height: offsetHeight });
        
        // Only update if we have actual dimensions
        if (offsetWidth > 0 && offsetHeight > 0) {
          setContainerDimensions({ width: offsetWidth, height: offsetHeight });
        }
      }
    };

    // Use a small delay to ensure the DOM is fully rendered
    const initializeDimensions = () => {
      updateDimensions();
      // Also try again after a short delay in case the initial measurement was wrong
      setTimeout(updateDimensions, 100);
    };

    initializeDimensions();
    window.addEventListener('resize', updateDimensions);
    
    // Also check dimensions when the component becomes visible
    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
      observer.disconnect();
    };
  }, []);

  // Auto-fit to show GPS routes when data loads
  useEffect(() => {
    if (!autoFitApplied && mapMetadata?.bounds && routePaths.length > 0 && containerDimensions.width > 0) {
      console.log('🎯 Auto-fitting map to show GPS routes...');
      
      // Get all GPS coordinates from route paths
      const allCoords = routePaths.flatMap(route => route.coordinates);
      if (allCoords.length === 0) return;
      
      // Calculate bounds of GPS data
      const lats = allCoords.map(([lng, lat]) => lat);
      const lngs = allCoords.map(([lng, lat]) => lng);
      const gpsBounds = {
        minLat: Math.min(...lats),
        maxLat: Math.max(...lats),
        minLng: Math.min(...lngs),
        maxLng: Math.max(...lngs)
      };
      
      console.log('📍 GPS data bounds:', gpsBounds);
      console.log('🗺️ Original map bounds:', mapMetadata.bounds);
      
      // Calculate center of GPS data
      const gpsCenter = {
        lat: (gpsBounds.minLat + gpsBounds.maxLat) / 2,
        lng: (gpsBounds.minLng + gpsBounds.maxLng) / 2
      };
      
      // Calculate center of original map
      const mapCenter = {
        lat: (mapMetadata.bounds.north + mapMetadata.bounds.south) / 2,
        lng: (mapMetadata.bounds.east + mapMetadata.bounds.west) / 2
      };
      
      console.log('📍 GPS center:', gpsCenter);
      console.log('🗺️ Map center:', mapCenter);
      
      // Calculate offset needed to center GPS data
      const latDiff = gpsCenter.lat - mapCenter.lat;
      const lngDiff = gpsCenter.lng - mapCenter.lng;
      
      // Convert lat/lng offset to pixel offset
      const latToPixel = containerDimensions.height / (mapMetadata.bounds.north - mapMetadata.bounds.south);
      const lngToPixel = containerDimensions.width / (mapMetadata.bounds.east - mapMetadata.bounds.west);
      
      const pixelOffset = {
        x: -lngDiff * lngToPixel, // Negative because we want to move the map, not the viewport
        y: latDiff * latToPixel   // Positive because Y is flipped
      };
      
      console.log('🎯 Applying auto-fit:', pixelOffset);
      
      // Apply the offset and set a reasonable zoom level
      setPanOffset(pixelOffset);
      setZoomLevel(2); // Zoom in to see more detail
      setAutoFitApplied(true);
    }
  }, [mapMetadata, routePaths, containerDimensions, autoFitApplied]);

  // Convert lat/lng to pixel coordinates within the image
  const latLngToPixel = (lat: number, lng: number) => {
    if (!mapMetadata?.bounds) {
      console.warn('⚠️ latLngToPixel: Map metadata bounds not loaded yet');
      return { x: 0, y: 0 };
    }
    
    if (!containerDimensions.width || !containerDimensions.height) {
      console.warn('⚠️ latLngToPixel: Container dimensions not ready:', containerDimensions);
      return { x: 0, y: 0 };
    }

    // Always use the original map bounds for coordinate transformation
    const bounds = mapMetadata.bounds;
    
    // Calculate relative position within the ORIGINAL map bounds (0-1)
    const xRatio = (lng - bounds.west) / (bounds.east - bounds.west);
    const yRatio = (bounds.north - lat) / (bounds.north - bounds.south); // Flip Y for image coordinates
    
    // Apply zoom and pan transformations
    const x = (xRatio * containerDimensions.width * zoomLevel) + panOffset.x;
    const y = (yRatio * containerDimensions.height * zoomLevel) + panOffset.y;
    
    // Only log coordinates that are significantly outside bounds for debugging
    const outsideBounds = xRatio < -0.1 || xRatio > 1.1 || yRatio < -0.1 || yRatio > 1.1;
    if (outsideBounds && Math.random() < 0.1) {
      console.log(`🔍 Coordinate outside map bounds: [${lat.toFixed(6)}, ${lng.toFixed(6)}] → ratios: [${xRatio.toFixed(4)}, ${yRatio.toFixed(4)}]`);
    }
    
    return { x, y };
  };

  // Convert pixel coordinates back to lat/lng
  const pixelToLatLng = (x: number, y: number) => {
    if (!activeBounds || !containerDimensions.width || !containerDimensions.height) {
      console.warn('⚠️ pixelToLatLng: Cannot convert - missing data');
      return { lat: 0, lng: 0 };
    }

    // Reverse zoom and pan transformations
    const adjustedX = (x - panOffset.x) / zoomLevel;
    const adjustedY = (y - panOffset.y) / zoomLevel;
    
    // Calculate relative position (0-1)
    const xRatio = adjustedX / containerDimensions.width;
    const yRatio = adjustedY / containerDimensions.height;
    
    // Convert to lat/lng using the active bounds
    const lng = activeBounds.west + xRatio * (activeBounds.east - activeBounds.west);
    const lat = activeBounds.north - yRatio * (activeBounds.north - activeBounds.south); // Flip Y back
    
    console.log(`🔄 pixelToLatLng: [${x}, ${y}] → [${lat.toFixed(6)}, ${lng.toFixed(6)}]`);
    
    return { lat, lng };
  };

  // Handle map clicks
  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return; // Don't trigger click if we were dragging
    
    if (!containerRef.current || !activeBounds || containerDimensions.width === 0) {
      console.warn('⚠️ Map click ignored - container not ready');
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    console.log(`🖱️ Map clicked at pixel: [${x}, ${y}]`);
    
    const coordinates = pixelToLatLng(x, y);
    setClickedCoords(coordinates);
    
    if (onMapClick) {
      onMapClick(coordinates);
    }
  };

  // Handle mouse events for panning
  const handleMouseDown = (event: React.MouseEvent) => {
    setIsDragging(false);
    setLastMousePos({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (event.buttons === 1) { // Left mouse button is pressed
      setIsDragging(true);
      const deltaX = event.clientX - lastMousePos.x;
      const deltaY = event.clientY - lastMousePos.y;
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastMousePos({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseUp = () => {
    // Reset dragging state after a short delay to prevent click events
    setTimeout(() => setIsDragging(false), 100);
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 4));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.5));
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setClickedCoords(null);
    setAutoFitApplied(false); // Allow auto-fit to run again
  };

  // Add a "Fit GPS Routes" button
  const handleFitGPSRoutes = () => {
    setAutoFitApplied(false); // Trigger auto-fit again
  };

  if (loading) {
    return (
      <div className="h-[600px] bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl mb-4 animate-pulse">🗺️</div>
          <h3 className="text-xl font-medium mb-2">Loading Base Map...</h3>
          <p className="text-white/70">Preparing Astoria street network with GPS data bounds</p>
        </div>
      </div>
    );
  }

  if (error || (!mapMetadata && !customBounds)) {
    return (
      <div className="h-[600px] bg-red-500/20 rounded-xl flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">❌</div>
          <h3 className="text-xl font-medium mb-2">Map Loading Error</h3>
          <p className="text-white/70">{error || 'Failed to load map data or bounds'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map Info Header */}
      <div className="flex items-center justify-between text-sm text-white/70">
        <div className="flex items-center gap-4">
          {activeBounds && (
            <span>📍 Center: {((activeBounds.north + activeBounds.south) / 2).toFixed(4)}, {((activeBounds.east + activeBounds.west) / 2).toFixed(4)}</span>
          )}
          {mapMetadata && (
            <span>🏠 {mapMetadata.stats.total_edges} streets mapped</span>
          )}
          {customBounds && (
            <span className="text-blue-400">🔍 Extended bounds for GPS data</span>
          )}
        </div>
        <div className="text-xs">
          {mapMetadata ? `Generated: ${new Date(mapMetadata.generated_at).toLocaleDateString()}` : 'Using custom bounds'}
        </div>
      </div>

      {/* Interactive Map Container */}
      <div 
        ref={containerRef}
        className="relative w-full h-[600px] rounded-xl overflow-hidden bg-black border border-white/10"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleMapClick}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Base Map Image */}
        <div 
          className="absolute inset-0"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
          }}
        >
          <Image
            src="/maps/astoria/astoria-base-map.png"
            alt="Astoria Base Map"
            fill
            className="object-contain bg-black"
            priority
            draggable={false}
            onLoad={() => console.log('✅ Base map image loaded successfully')}
            onError={(e) => {
              console.error('❌ Failed to load base map image:', e);
              console.error('   Image src:', '/maps/astoria/astoria-base-map.png');
            }}
          />
          
          {/* Debug overlay to show map bounds */}
          {customBounds && (
            <div 
              className="absolute inset-0 border-4 border-blue-400/50"
              style={{ 
                background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.1) 25%, transparent 25%), linear-gradient(-45deg, rgba(59, 130, 246, 0.1) 25%, transparent 25%)',
                backgroundSize: '20px 20px'
              }}
            >
              <div className="absolute top-2 left-2 bg-blue-500/80 text-white text-xs px-2 py-1 rounded">
                Extended Bounds Active
              </div>
            </div>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 bg-black/70 hover:bg-black/90 text-white rounded-lg flex items-center justify-center transition-all duration-200 border border-white/20 hover:border-white/40"
            title="Zoom In"
          >
            <span className="text-lg font-bold">+</span>
          </button>
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 bg-black/70 hover:bg-black/90 text-white rounded-lg flex items-center justify-center transition-all duration-200 border border-white/20 hover:border-white/40"
            title="Zoom Out"
          >
            <span className="text-lg font-bold">−</span>
          </button>
          <button
            onClick={handleFitGPSRoutes}
            className="w-10 h-10 bg-green-600/70 hover:bg-green-600/90 text-white rounded-lg flex items-center justify-center transition-all duration-200 border border-green-400/30 hover:border-green-400/60"
            title="Fit GPS Routes"
          >
            <span className="text-sm">🎯</span>
          </button>
          <button
            onClick={handleResetView}
            className="w-10 h-10 bg-black/70 hover:bg-black/90 text-white rounded-lg flex items-center justify-center transition-all duration-200 border border-white/20 hover:border-white/40"
            title="Reset View"
          >
            <span className="text-sm">⌂</span>
          </button>
        </div>

        {/* Zoom Level Indicator */}
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm border border-white/20">
          Zoom: {zoomLevel.toFixed(1)}x
        </div>

        {/* Route Path Overlays - Only render when ready */}
        {mapMetadata?.bounds && containerDimensions.width > 0 && containerDimensions.height > 0 && (
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="none"
            viewBox={`0 0 ${containerDimensions.width} ${containerDimensions.height}`}
          >
            {routePaths.map((route, routeIndex) => {
              console.log(`🗺️ Rendering route ${routeIndex} with ${route.coordinates.length} coordinates`);
              
              if (route.coordinates.length === 0) {
                console.warn(`⚠️ Route ${routeIndex} has no coordinates!`);
                return null;
              }
            
            if (route.coordinates.length === 0) {
              console.warn(`⚠️ Route ${routeIndex} has no coordinates!`);
              return null;
            }
            
            const pathData = route.coordinates
              .map(([lng, lat], coordIndex) => {
                const { x, y } = latLngToPixel(lat, lng);
                const command = coordIndex === 0 ? 'M' : 'L'; // First coordinate uses M (move), others use L (line)
                return `${command} ${x} ${y}`;
              })
              .join(' ');

            return (
              <g key={routeIndex}>
                <path
                  d={pathData}
                  stroke={route.style.color}
                  strokeWidth={route.style.width}
                  strokeOpacity={route.style.opacity}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={route.completed ? 'animate-pulse' : ''}
                />
              </g>
            );
          })}
          </svg>
        )}

        {/* Loading indicator when container dimensions aren't ready */}
        {(!mapMetadata?.bounds || containerDimensions.width === 0 || containerDimensions.height === 0) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white text-center">
              <div className="text-2xl mb-2 animate-pulse">🗺️</div>
              <div className="text-sm">
                {!mapMetadata?.bounds ? 'Loading map metadata...' : 'Initializing container...'}
              </div>
            </div>
          </div>
        )}

        {/* Point Overlays */}
        {overlayPoints.map((point, index) => {
          const { x, y } = latLngToPixel(point.lat, point.lng);
          
          return (
            <div
              key={index}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ left: x, top: y }}
            >
              <div className={`
                w-3 h-3 rounded-full border-2 border-white shadow-lg
                ${point.type === 'start' ? 'bg-green-500' : 
                  point.type === 'end' ? 'bg-red-500' :
                  point.type === 'completed' ? 'bg-blue-500 animate-pulse' :
                  'bg-yellow-500'}
              `} />
              {point.label && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap">
                  {point.label}
                </div>
              )}
            </div>
          );
        })}

        {/* Reference Points (Home & Gym) */}
        {mapMetadata && (() => {
          const homePixel = latLngToPixel(
            mapMetadata.reference_points.home.lat, 
            mapMetadata.reference_points.home.lng
          );
          const gymPixel = latLngToPixel(
            mapMetadata.reference_points.gym.lat, 
            mapMetadata.reference_points.gym.lng
          );

          return (
            <>
              {/* Home Marker */}
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: homePixel.x, top: homePixel.y }}
              >
                <div className="w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">🏠</span>
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-green-600/90 text-white text-xs rounded whitespace-nowrap font-medium">
                  Home
                </div>
              </div>

              {/* Gym Marker */}
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: gymPixel.x, top: gymPixel.y }}
              >
                <div className="w-6 h-6 bg-orange-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">🏋️</span>
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-orange-600/90 text-white text-xs rounded whitespace-nowrap font-medium">
                  Gym
                </div>
              </div>
            </>
          );
        })()}

        {/* Coordinate Display */}
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded border border-white/20">
          {clickedCoords 
            ? `📍 ${clickedCoords.lat.toFixed(5)}, ${clickedCoords.lng.toFixed(5)}`
            : "Click to get coordinates • Drag to pan"
          }
        </div>

        {/* Instructions */}
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded border border-white/20">
          🖱️ Drag to pan • 🔍 Use zoom controls
        </div>

        {/* Route Overlays */}
        {showRoutes && containerDimensions.width > 0 && containerDimensions.height > 0 && (
          <RouteOverlay
            width={containerDimensions.width}
            height={containerDimensions.height}
            selectedRoutes={selectedRoutes}
            onRouteSelect={onRouteSelect}
            showLegend={true}
          />
        )}
      </div>

      {/* Map Legend */}
      <div className="flex items-center justify-between text-xs text-white/60">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Start Point</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>End Point</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Completed</span>
          </div>
        </div>
        <div>
          {mapMetadata ? `Coordinate System: ${mapMetadata.coordinate_system}` : 'Custom coordinate bounds'}
        </div>
      </div>
    </div>
  );
}
