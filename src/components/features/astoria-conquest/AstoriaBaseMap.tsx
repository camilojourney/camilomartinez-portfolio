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
  /** Callback when map is clicked */
  onMapClick?: (coordinates: { lat: number; lng: number }) => void;
}

export default function AstoriaBaseMap({ 
  overlayPoints = [], 
  routePaths = [],
  onMapClick 
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

  // Handle container resizing
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        setContainerDimensions({ width: offsetWidth, height: offsetHeight });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Convert lat/lng to pixel coordinates within the image
  const latLngToPixel = (lat: number, lng: number) => {
    if (!mapMetadata || !containerDimensions.width) return { x: 0, y: 0 };

    const { bounds } = mapMetadata;
    
    // Calculate relative position within bounds (0-1)
    const xRatio = (lng - bounds.west) / (bounds.east - bounds.west);
    const yRatio = (bounds.north - lat) / (bounds.north - bounds.south); // Flip Y for image coordinates
    
    // Apply zoom and pan transformations
    const x = (xRatio * containerDimensions.width * zoomLevel) + panOffset.x;
    const y = (yRatio * containerDimensions.height * zoomLevel) + panOffset.y;
    
    return { x, y };
  };

  // Convert pixel coordinates back to lat/lng
  const pixelToLatLng = (x: number, y: number) => {
    if (!mapMetadata || !containerDimensions.width) return { lat: 0, lng: 0 };

    const { bounds } = mapMetadata;
    
    // Reverse zoom and pan transformations
    const adjustedX = (x - panOffset.x) / zoomLevel;
    const adjustedY = (y - panOffset.y) / zoomLevel;
    
    // Calculate relative position (0-1)
    const xRatio = adjustedX / containerDimensions.width;
    const yRatio = adjustedY / containerDimensions.height;
    
    // Convert to lat/lng
    const lng = bounds.west + xRatio * (bounds.east - bounds.west);
    const lat = bounds.north - yRatio * (bounds.north - bounds.south); // Flip Y back
    
    return { lat, lng };
  };

  // Handle map clicks
  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return; // Don't trigger click if we were dragging
    
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
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
  };

  if (loading) {
    return (
      <div className="h-[600px] bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl mb-4 animate-pulse">🗺️</div>
          <h3 className="text-xl font-medium mb-2">Loading Base Map...</h3>
          <p className="text-white/70">Preparing Astoria street network</p>
        </div>
      </div>
    );
  }

  if (error || !mapMetadata) {
    return (
      <div className="h-[600px] bg-red-500/20 rounded-xl flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">❌</div>
          <h3 className="text-xl font-medium mb-2">Map Loading Error</h3>
          <p className="text-white/70">{error || 'Failed to load map data'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map Info Header */}
      <div className="flex items-center justify-between text-sm text-white/70">
        <div className="flex items-center gap-4">
          <span>📍 Center: {mapMetadata.center.lat.toFixed(4)}, {mapMetadata.center.lng.toFixed(4)}</span>
          <span>🏠 {mapMetadata.stats.total_edges} streets mapped</span>
        </div>
        <div className="text-xs">
          Generated: {new Date(mapMetadata.generated_at).toLocaleDateString()}
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
          />
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

        {/* Route Path Overlays */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
          viewBox={`0 0 ${containerDimensions.width} ${containerDimensions.height}`}
        >
          {routePaths.map((route, index) => {
            const pathData = route.coordinates
              .map(([lng, lat]) => {
                const { x, y } = latLngToPixel(lat, lng);
                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
              })
              .join(' ');

            return (
              <path
                key={index}
                d={pathData}
                stroke={route.style.color}
                strokeWidth={route.style.width}
                strokeOpacity={route.style.opacity}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={route.completed ? 'animate-pulse' : ''}
              />
            );
          })}
        </svg>

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
        {(() => {
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
          Coordinate System: {mapMetadata.coordinate_system}
        </div>
      </div>
    </div>
  );
}
