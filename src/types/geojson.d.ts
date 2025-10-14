// Type declarations for GeoJSON imports
declare module '*.geojson' {
  import { FeatureCollection } from 'geojson';
  const value: FeatureCollection;
  export default value;
}
