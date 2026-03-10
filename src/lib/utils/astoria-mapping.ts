// 📂 src/lib/utils/astoria-mapping.ts
/**
 * Astoria GPS Mapping Utilities
 * 
 * Utilities for matching Strava GPS coordinates with the Astoria base map
 * and calculating street coverage based on running activities.
 */

export interface GPSPoint {
  lat: number;
  lng: number;
  timestamp?: string;
  elevation?: number;
}

export interface RouteSegment {
  start: GPSPoint;
  end: GPSPoint;
  distance: number; // meters
  bearing: number; // degrees
}

export interface MapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface StravaActivity {
  id: string;
  name: string;
  distance: number;
  moving_time: number;
  start_date: string;
  polyline?: string; // Encoded polyline
  gps_points: GPSPoint[];
}

/**
 * Check if a GPS point is within Astoria bounds
 */
export function isPointInAstoriaBounds(point: GPSPoint, bounds: MapBounds): boolean {
  return (
    point.lat >= bounds.south &&
    point.lat <= bounds.north &&
    point.lng >= bounds.west &&
    point.lng <= bounds.east
  );
}

/**
 * Calculate distance between two GPS points using Haversine formula
 */
export function calculateDistance(point1: GPSPoint, point2: GPSPoint): number {
  const R = 6371000; // Earth's radius in meters
  const lat1Rad = (point1.lat * Math.PI) / 180;
  const lat2Rad = (point2.lat * Math.PI) / 180;
  const deltaLatRad = ((point2.lat - point1.lat) * Math.PI) / 180;
  const deltaLngRad = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate bearing from point1 to point2
 */
export function calculateBearing(point1: GPSPoint, point2: GPSPoint): number {
  const lat1Rad = (point1.lat * Math.PI) / 180;
  const lat2Rad = (point2.lat * Math.PI) / 180;
  const deltaLngRad = ((point2.lng - point1.lng) * Math.PI) / 180;

  const y = Math.sin(deltaLngRad) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLngRad);

  const bearingRad = Math.atan2(y, x);
  return ((bearingRad * 180) / Math.PI + 360) % 360;
}

/**
 * Filter GPS points to only include those within Astoria
 */
export function filterAstoriaPoints(activity: StravaActivity, bounds: MapBounds): GPSPoint[] {
  return activity.gps_points.filter(point => isPointInAstoriaBounds(point, bounds));
}

/**
 * Convert GPS points to route segments
 */
export function gpsPointsToSegments(points: GPSPoint[]): RouteSegment[] {
  const segments: RouteSegment[] = [];
  
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    if (!start || !end) continue;
    
    segments.push({
      start,
      end,
      distance: calculateDistance(start, end),
      bearing: calculateBearing(start, end)
    });
  }
  
  return segments;
}

/**
 * Simplify GPS track by removing points that are too close together
 * This helps reduce noise and improves performance
 */
export function simplifyGPSTrack(points: GPSPoint[], minDistance: number = 10): GPSPoint[] {
  if (points.length === 0) return [];
  if (points.length <= 2) return points;
  
  const first = points[0];
  if (!first) return [];
  const simplified = [first]; // Always keep first point
  
  for (let i = 1; i < points.length - 1; i++) {
    const lastKept = simplified[simplified.length - 1];
    const current = points[i];
    if (!lastKept || !current) continue;
    
    if (calculateDistance(lastKept, current) >= minDistance) {
      simplified.push(current);
    }
  }
  
  const last = points[points.length - 1];
  if (last) simplified.push(last); // Always keep last point
  return simplified;
}

/**
 * Find the closest point on a line segment to a given point
 * Used for street matching algorithms
 */
export function closestPointOnSegment(
  point: GPSPoint, 
  segmentStart: GPSPoint, 
  segmentEnd: GPSPoint
): GPSPoint {
  const A = point.lat - segmentStart.lat;
  const B = point.lng - segmentStart.lng;
  const C = segmentEnd.lat - segmentStart.lat;
  const D = segmentEnd.lng - segmentStart.lng;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) return segmentStart; // Segment is a point
  
  const param = dot / lenSq;
  
  if (param < 0) return segmentStart;
  if (param > 1) return segmentEnd;
  
  return {
    lat: segmentStart.lat + param * C,
    lng: segmentStart.lng + param * D
  };
}

/**
 * Calculate coverage statistics for a set of runs
 */
export function calculateCoverageStats(
  completedSegments: RouteSegment[],
  totalStreets: number,
  totalDistance: number
) {
  const completedDistance = completedSegments.reduce(
    (sum, segment) => sum + segment.distance, 
    0
  );
  
  return {
    completedSegments: completedSegments.length,
    totalSegments: totalStreets,
    completedDistance,
    totalDistance,
    completionPercentage: totalStreets > 0 ? (completedSegments.length / totalStreets) * 100 : 0,
    distancePercentage: totalDistance > 0 ? (completedDistance / totalDistance) * 100 : 0
  };
}

/**
 * Load map metadata from public directory
 */
export async function loadMapMetadata() {
  try {
    const response = await fetch('/maps/astoria/map-metadata.json');
    if (!response.ok) {
      throw new Error(`Failed to load map metadata: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading map metadata:', error);
    throw error;
  }
}

/**
 * Convert Strava polyline to GPS points
 * Note: You'll need to install @mapbox/polyline for this to work
 */
export function decodePolyline(polyline: string): GPSPoint[] {
  // This is a placeholder - implement with @mapbox/polyline or similar
  // return polyline.decode(polyline).map(([lat, lng]) => ({ lat, lng }));
  console.warn('Polyline decoding not implemented. Install @mapbox/polyline package.');
  return [];
}

/**
 * Prepare route data for map visualization
 */
export function prepareRouteForVisualization(
  segments: RouteSegment[],
  completed: boolean = false
): Array<{
  coordinates: Array<[number, number]>;
  style: {
    color: string;
    width: number;
    opacity: number;
  };
  completed: boolean;
}> {
  if (segments.length === 0) return [];
  const first = segments[0];
  if (!first) return [];
  
  // Group consecutive segments into paths
  const coordinates: Array<[number, number]> = [];
  
  // Add first point
  coordinates.push([first.start.lng, first.start.lat]);
  
  // Add all end points
  segments.forEach(segment => {
    coordinates.push([segment.end.lng, segment.end.lat]);
  });
  
  return [{
    coordinates,
    style: {
      color: completed ? '#10b981' : '#3b82f6', // green if completed, blue otherwise
      width: completed ? 4 : 2,
      opacity: completed ? 0.9 : 0.7
    },
    completed
  }];
}

/**
 * Generate sample data for testing
 */
export function generateSampleRunData(bounds: MapBounds): StravaActivity {
  const { center } = {
    center: {
      lat: (bounds.north + bounds.south) / 2,
      lng: (bounds.east + bounds.west) / 2
    }
  };
  
  // Generate a simple route around the center
  const points: GPSPoint[] = [];
  const startLat = center.lat + (Math.random() - 0.5) * 0.01;
  const startLng = center.lng + (Math.random() - 0.5) * 0.01;
  
  for (let i = 0; i < 50; i++) {
    const angle = (i / 50) * 2 * Math.PI;
    const radius = 0.005; // ~500m radius
    
    points.push({
      lat: startLat + Math.cos(angle) * radius,
      lng: startLng + Math.sin(angle) * radius,
      timestamp: new Date(Date.now() + i * 30000).toISOString() // 30 seconds between points
    });
  }
  
  return {
    id: 'sample-run-' + Date.now(),
    name: 'Sample Astoria Run',
    distance: 3200, // meters
    moving_time: 1500, // seconds
    start_date: new Date().toISOString(),
    gps_points: points
  };
}
