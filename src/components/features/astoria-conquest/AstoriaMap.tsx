'use client';

import { useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLngExpression } from 'leaflet';
import type { FeatureCollection, LineString, Position } from 'geojson';
import polyline from '@mapbox/polyline';

// Fix for default Leaflet icon issue with React
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

import type { AstoriaMapProps } from '@/types/astoria';

// Custom controls component that will be rendered inside the MapContainer
function CustomControls() {
  const map = useMap();

  const handleZoomIn = () => {
    map.zoomIn();
  };

  const handleZoomOut = () => {
    map.zoomOut();
  };

  const handleCenterView = () => {
    const center: LatLngExpression = [40.765, -73.92]; // Astoria Center
    map.setView(center, 14);
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      {/* Zoom In */}
      <button
        onClick={handleZoomIn}
        className="w-10 h-10 bg-white/90 hover:bg-white border border-gray-300 rounded shadow-lg flex items-center justify-center text-gray-700 hover:text-black transition-all duration-200 hover:scale-105"
        title="Zoom in"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
      
      {/* Zoom Out */}
      <button
        onClick={handleZoomOut}
        className="w-10 h-10 bg-white/90 hover:bg-white border border-gray-300 rounded shadow-lg flex items-center justify-center text-gray-700 hover:text-black transition-all duration-200 hover:scale-105"
        title="Zoom out"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
        </svg>
      </button>
      
      {/* Center View */}
      <button
        onClick={handleCenterView}
        className="w-10 h-10 bg-white/90 hover:bg-white border border-gray-300 rounded shadow-lg flex items-center justify-center text-gray-700 hover:text-black transition-all duration-200 hover:scale-105"
        title="Center view"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth={2} />
          <circle cx="12" cy="12" r="3" strokeWidth={2} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
      </button>
    </div>
  );
}

const AstoriaMap = ({ baseMapData, coveredStreetsData, selectedRun }: AstoriaMapProps) => {
  const center: LatLngExpression = [40.765, -73.92]; // Astoria Center

  const selectedRunFeature = (() => {
    if (!selectedRun?.polyline) {
      return null;
    }

    try {
      const decoded = polyline.decode(selectedRun.polyline);
      const coordinates: Position[] = decoded.map(([lat, lng]) => [lng, lat]);

      return {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates,
            },
          },
        ],
      } as FeatureCollection<LineString>;
    } catch (error) {
      console.error('Failed to decode run polyline', error);
      return null;
    }
  })();

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false} // Disable default zoom control
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; CARTO'
        />
        <GeoJSON
          data={baseMapData as FeatureCollection}
          style={{ color: '#444444', weight: 1.5, opacity: 0.8 }}
        />
        {/* Show either the selected run OR all covered streets */}
        {selectedRunFeature ? (
          <GeoJSON
            key="selected-run"
            data={selectedRunFeature}
            style={{ color: '#ff4ff8', weight: 4, opacity: 0.9 }}
          />
        ) : (
          <GeoJSON
            key="all-covered"
            data={coveredStreetsData as FeatureCollection}
            style={{ color: '#00FFFF', weight: 3, opacity: 1 }}
          />
        )}
        <CustomControls />
      </MapContainer>
    </div>
  );
};

export default AstoriaMap;
