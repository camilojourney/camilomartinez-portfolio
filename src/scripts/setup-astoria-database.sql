-- 📂 src/scripts/setup-astoria-database.sql
-- Database schema setup for the Astoria Conquest feature
-- Run this SQL script in your Vercel Postgres database

-- Enable PostGIS extension for geospatial operations
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create table for storing Astoria street network
CREATE TABLE IF NOT EXISTS astoria_streets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    street_type VARCHAR(50), -- avenue, street, boulevard, etc.
    length_meters DECIMAL(10,2),
    geom GEOMETRY(LineString, 4326) NOT NULL, -- GPS coordinates as LineString
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Index for spatial queries
    CONSTRAINT astoria_streets_geom_idx UNIQUE(geom)
);

-- Create spatial index for efficient geospatial queries
CREATE INDEX IF NOT EXISTS idx_astoria_streets_geom 
ON astoria_streets USING GIST (geom);

-- Create index on street name for fast lookups
CREATE INDEX IF NOT EXISTS idx_astoria_streets_name 
ON astoria_streets (name);

-- Create table for storing processed Strava runs
CREATE TABLE IF NOT EXISTS strava_runs (
    activity_id BIGINT PRIMARY KEY, -- Strava activity ID
    run_date TIMESTAMPTZ NOT NULL,
    distance_meters DECIMAL(10,2) NOT NULL,
    moving_time_seconds INTEGER NOT NULL,
    average_speed_ms DECIMAL(8,4), -- meters per second
    total_elevation_gain DECIMAL(8,2),
    polyline TEXT NOT NULL, -- Encoded polyline from Strava
    start_lat DECIMAL(10,7),
    start_lng DECIMAL(10,7),
    end_lat DECIMAL(10,7),
    end_lng DECIMAL(10,7),
    name VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    country VARCHAR(50),
    geom GEOMETRY(LineString, 4326) NOT NULL, -- Decoded GPS track
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create spatial index for runs
CREATE INDEX IF NOT EXISTS idx_strava_runs_geom 
ON strava_runs USING GIST (geom);

-- Create index on run date for temporal queries
CREATE INDEX IF NOT EXISTS idx_strava_runs_date 
ON strava_runs (run_date);

-- Create index on activity_id for fast upserts
CREATE INDEX IF NOT EXISTS idx_strava_runs_activity_id 
ON strava_runs (activity_id);

-- Create table for storing sync metadata
CREATE TABLE IF NOT EXISTS strava_sync_log (
    id SERIAL PRIMARY KEY,
    sync_type VARCHAR(50) NOT NULL, -- 'manual', 'cron', 'initial'
    activities_processed INTEGER DEFAULT 0,
    activities_successful INTEGER DEFAULT 0,
    activities_failed INTEGER DEFAULT 0,
    sync_start_time TIMESTAMPTZ NOT NULL,
    sync_end_time TIMESTAMPTZ,
    error_message TEXT,
    sync_details JSONB, -- Additional metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on sync log for monitoring
CREATE INDEX IF NOT EXISTS idx_strava_sync_log_date 
ON strava_sync_log (sync_start_time);

-- Sample data for testing (remove in production)
-- This would be replaced with actual Astoria street data from OpenStreetMap

-- You can load real Astoria street data using:
-- 1. Export from OpenStreetMap using Overpass Turbo
-- 2. Use PostGIS to import GeoJSON/Shapefile data
-- 3. Run the load-astoria-streets.js script

-- Example: INSERT sample street (for testing only)
INSERT INTO astoria_streets (name, street_type, geom) 
VALUES (
    'Sample Street', 
    'street',
    ST_SetSRID(ST_GeomFromText('LINESTRING(-73.9262 40.7614, -73.9260 40.7616)'), 4326)
) ON CONFLICT (geom) DO NOTHING;

-- Verify tables were created successfully
SELECT 
    'astoria_streets' as table_name, 
    COUNT(*) as row_count 
FROM astoria_streets
UNION ALL
SELECT 
    'strava_runs' as table_name, 
    COUNT(*) as row_count 
FROM strava_runs
UNION ALL
SELECT 
    'strava_sync_log' as table_name, 
    COUNT(*) as row_count 
FROM strava_sync_log;

-- Show PostGIS version to confirm extension is working
SELECT PostGIS_Full_Version();
