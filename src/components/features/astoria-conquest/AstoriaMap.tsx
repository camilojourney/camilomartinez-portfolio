'use client';

import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLngExpression } from 'leaflet';
import type { Feature, FeatureCollection, LineString, Position } from 'geojson';

// Fix for default Leaflet icon issue with React
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

import type { AstoriaMapProps } from '@/types/astoria';

const AstoriaMap = ({ baseMapData, coveredStreetsData, selectedRun }: AstoriaMapProps) => {
  const center: LatLngExpression = [40.765, -73.92]; // Astoria Center

  return (
    <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; CARTO'
      />
      <GeoJSON 
        data={baseMapData as FeatureCollection} 
        style={{ color: '#444444', weight: 1.5, opacity: 0.8 }} 
      />
      <GeoJSON 
        data={coveredStreetsData as FeatureCollection} 
        style={{ color: '#00FFFF', weight: 3, opacity: 1 }}
      />
      {selectedRun?.polyline && (
        <GeoJSON
          data={({
            type: "FeatureCollection",
            features: [{
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: JSON.parse(selectedRun.polyline) as Position[]
              }
            }]
          } as FeatureCollection<LineString>)}
          style={{ color: '#ff00ff', weight: 4, opacity: 0.8 }}
        />
      )}
    </MapContainer>
  );
};

export default AstoriaMap;