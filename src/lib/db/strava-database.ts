// 📂 src/lib/db/strava-database.ts
/**
 * Database operations for Strava data in the Astoria Conquest feature
 * Handles storing runs, street data, and geospatial calculations
 */

import { sql } from './db';
import { StravaActivity, StoredStravaRun, AstoriaStreet, AstoriaStats, StreetGeoJSON, RunGeoJSON } from '@/types/strava';
import polyline from '@mapbox/polyline';

/**
 * Convert Strava encoded polyline to WKT (Well-Known Text) format for PostGIS
 */
function polylineToWKT(encodedPolyline: string): string {
  try {
    const coordinates = polyline.decode(encodedPolyline);
    // Convert from [lat, lng] to [lng, lat] for PostGIS and join as space-separated pairs
    const wktCoords = coordinates
      .map(([lat, lng]: [number, number]) => `${lng} ${lat}`)
      .join(',');
    
    return `LINESTRING(${wktCoords})`;
  } catch (error) {
    console.error('❌ Error decoding polyline:', error);
    throw new Error(`Failed to decode polyline: ${encodedPolyline.substring(0, 50)}...`);
  }
}

/**
 * Insert or update a Strava run in the database
 */
export async function upsertStravaRun(activity: StravaActivity): Promise<void> {
  try {
    if (!activity.map?.summary_polyline) {
      console.warn(`⚠️ Skipping activity ${activity.id}: No GPS data available`);
      return;
    }

    const wkt = polylineToWKT(activity.map.summary_polyline);
    
    // Using raw SQL with Vercel Postgres for PostGIS operations
    await sql`
      INSERT INTO strava_runs (
        activity_id,
        run_date,
        distance_meters,
        moving_time_seconds,
        average_speed_ms,
        total_elevation_gain,
        polyline,
        start_lat,
        start_lng,
        end_lat,
        end_lng,
        name,
        city,
        state,
        country,
        geom,
        created_at,
        updated_at
      ) VALUES (
        ${activity.id},
        ${activity.start_date},
        ${activity.distance},
        ${activity.moving_time},
        ${activity.average_speed},
        ${activity.total_elevation_gain},
        ${activity.map.summary_polyline},
        ${activity.start_latlng?.[0] || null},
        ${activity.start_latlng?.[1] || null},
        ${activity.end_latlng?.[0] || null},
        ${activity.end_latlng?.[1] || null},
        ${activity.name},
        ${activity.location_city || null},
        ${activity.location_state || null},
        ${activity.location_country || null},
        ST_SetSRID(ST_GeomFromText(${wkt}), 4326),
        NOW(),
        NOW()
      )
      ON CONFLICT (activity_id) 
      DO UPDATE SET
        run_date = EXCLUDED.run_date,
        distance_meters = EXCLUDED.distance_meters,
        moving_time_seconds = EXCLUDED.moving_time_seconds,
        average_speed_ms = EXCLUDED.average_speed_ms,
        total_elevation_gain = EXCLUDED.total_elevation_gain,
        name = EXCLUDED.name,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        country = EXCLUDED.country,
        updated_at = NOW()
    `;

    console.log(`✅ Upserted run: ${activity.name} (${(activity.distance / 1000).toFixed(2)}km)`);
  } catch (error) {
    console.error(`❌ Error upserting run ${activity.id}:`, error);
    throw error;
  }
}

/**
 * Batch upsert multiple Strava runs
 */
export async function batchUpsertStravaRuns(activities: StravaActivity[]): Promise<number> {
  let successCount = 0;
  let errorCount = 0;

  console.log(`📊 Starting batch upsert of ${activities.length} activities...`);

  for (const activity of activities) {
    try {
      await upsertStravaRun(activity);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to upsert activity ${activity.id}:`, error);
      errorCount++;
    }

    // Small delay to prevent overwhelming the database
    if (successCount % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`✅ Batch upsert complete: ${successCount} successful, ${errorCount} errors`);
  return successCount;
}

/**
 * Get the most recent run date to determine sync starting point
 */
export async function getLastRunDate(): Promise<Date | null> {
  try {
    const result = await sql`
      SELECT MAX(run_date) as last_run_date
      FROM strava_runs
    `;

    const lastRunDate = result.rows[0]?.last_run_date;
    return lastRunDate ? new Date(lastRunDate) : null;
  } catch (error) {
    console.error('❌ Error getting last run date:', error);
    return null;
  }
}

/**
 * Get the highest activity ID to determine incremental sync point
 */
export async function getLastActivityId(): Promise<number | null> {
  try {
    const result = await sql`
      SELECT MAX(activity_id) as last_activity_id
      FROM strava_runs
    `;

    return result.rows[0]?.last_activity_id || null;
  } catch (error) {
    console.error('❌ Error getting last activity ID:', error);
    return null;
  }
}

/**
 * Get all Astoria streets as GeoJSON for map visualization
 */
export async function getAstoriaStreetsGeoJSON(): Promise<StreetGeoJSON> {
  try {
    const result = await sql`
      WITH street_coverage AS (
        SELECT 
          s.id,
          s.name,
          s.street_type,
          s.length_meters,
          COALESCE(
            ST_Length(
              ST_Intersection(
                s.geom,
                ST_Union(r.geom)
              )
            ) / NULLIF(ST_Length(s.geom), 0) * 100,
            0
          ) as coverage_percentage
        FROM astoria_streets s
        LEFT JOIN strava_runs r ON ST_Intersects(s.geom, r.geom)
        GROUP BY s.id, s.name, s.street_type, s.length_meters, s.geom
      )
      SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', json_agg(
          json_build_object(
            'type', 'Feature',
            'properties', json_build_object(
              'id', sc.id,
              'name', sc.name,
              'street_type', sc.street_type,
              'length_meters', sc.length_meters,
              'completion_status', 
              CASE 
                WHEN sc.coverage_percentage >= 80 THEN 'completed'
                WHEN sc.coverage_percentage > 0 THEN 'partial'
                ELSE 'unvisited'
              END,
              'coverage_percentage', ROUND(sc.coverage_percentage, 2)
            ),
            'geometry', ST_AsGeoJSON(s.geom)::json
          )
        )
      ) as geojson
      FROM street_coverage sc
      JOIN astoria_streets s ON sc.id = s.id
    `;

    return result.rows[0]?.geojson || { type: 'FeatureCollection', features: [] };
  } catch (error) {
    console.error('❌ Error getting streets GeoJSON:', error);
    return { type: 'FeatureCollection', features: [] };
  }
}

/**
 * Get all runs as GeoJSON for map visualization
 */
export async function getRunsGeoJSON(): Promise<RunGeoJSON> {
  try {
    const result = await sql`
      SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', json_agg(
          json_build_object(
            'type', 'Feature',
            'properties', json_build_object(
              'activity_id', activity_id,
              'name', name,
              'run_date', run_date,
              'distance_meters', distance_meters,
              'moving_time_seconds', moving_time_seconds
            ),
            'geometry', ST_AsGeoJSON(geom)::json
          )
        )
      ) as geojson
      FROM strava_runs
      WHERE geom IS NOT NULL
      ORDER BY run_date DESC
    `;

    return result.rows[0]?.geojson || { type: 'FeatureCollection', features: [] };
  } catch (error) {
    console.error('❌ Error getting runs GeoJSON:', error);
    return { type: 'FeatureCollection', features: [] };
  }
}

/**
 * Calculate comprehensive Astoria conquest statistics
 */
export async function getAstoriaStats(): Promise<AstoriaStats> {
  try {
    const result = await sql`
      WITH street_stats AS (
        SELECT 
          COUNT(*) as total_streets,
          COALESCE(SUM(length_meters), 0) as total_distance_meters,
          COUNT(CASE WHEN coverage.coverage_percentage >= 80 THEN 1 END) as completed_streets,
          COUNT(CASE WHEN coverage.coverage_percentage > 0 AND coverage.coverage_percentage < 80 THEN 1 END) as partial_streets,
          COALESCE(SUM(CASE WHEN coverage.coverage_percentage >= 80 THEN length_meters ELSE 0 END), 0) as completed_distance_meters
        FROM astoria_streets s
        LEFT JOIN (
          SELECT 
            s.id,
            COALESCE(
              ST_Length(ST_Intersection(s.geom, ST_Union(r.geom))) / NULLIF(ST_Length(s.geom), 0) * 100,
              0
            ) as coverage_percentage
          FROM astoria_streets s
          LEFT JOIN strava_runs r ON ST_Intersects(s.geom, r.geom)
          GROUP BY s.id, s.geom
        ) coverage ON s.id = coverage.id
      ),
      run_stats AS (
        SELECT 
          COUNT(*) as total_runs_count,
          COALESCE(SUM(distance_meters), 0) as total_run_distance_meters,
          COALESCE(SUM(moving_time_seconds), 0) as total_running_time_seconds,
          COALESCE(AVG(distance_meters), 0) as average_run_distance_meters,
          MAX(run_date) as last_run_date
        FROM strava_runs
      ),
      monthly_stats AS (
        SELECT 
          COUNT(DISTINCT s.id) as streets_completed_this_month
        FROM astoria_streets s
        JOIN (
          SELECT 
            s.id,
            COALESCE(
              ST_Length(ST_Intersection(s.geom, ST_Union(r.geom))) / NULLIF(ST_Length(s.geom), 0) * 100,
              0
            ) as coverage_percentage
          FROM astoria_streets s
          LEFT JOIN strava_runs r ON ST_Intersects(s.geom, r.geom)
            AND r.run_date >= DATE_TRUNC('month', CURRENT_DATE)
          GROUP BY s.id, s.geom
        ) monthly_coverage ON s.id = monthly_coverage.id
        WHERE monthly_coverage.coverage_percentage >= 80
      )
      SELECT 
        ss.total_streets,
        ss.completed_streets,
        ss.partial_streets,
        (ss.total_streets - ss.completed_streets - ss.partial_streets) as unvisited_streets,
        ROUND((ss.completed_streets::numeric / NULLIF(ss.total_streets, 0)) * 100, 2) as completion_percentage,
        ss.total_distance_meters,
        ss.completed_distance_meters,
        (ss.total_distance_meters - ss.completed_distance_meters) as remaining_distance_meters,
        rs.total_runs_count,
        rs.total_running_time_seconds,
        rs.average_run_distance_meters,
        rs.last_run_date,
        ms.streets_completed_this_month,
        CASE 
          WHEN ss.total_streets > 0 THEN 
            ROUND((ms.streets_completed_this_month::numeric / ss.total_streets) * 100, 2)
          ELSE 0 
        END as monthly_progress_percentage
      FROM street_stats ss
      CROSS JOIN run_stats rs
      CROSS JOIN monthly_stats ms
    `;

    const row = result.rows[0];
    
    if (!row) {
      // Return default stats if no data
      return {
        totalStreets: 0,
        completedStreets: 0,
        partialStreets: 0,
        unvisitedStreets: 0,
        completionPercentage: 0,
        totalDistanceMeters: 0,
        completedDistanceMeters: 0,
        remainingDistanceMeters: 0,
        totalRunsCount: 0,
        totalRunningTimeSeconds: 0,
        averageRunDistanceMeters: 0,
        streetsCompletedThisMonth: 0,
        monthlyProgressPercentage: 0,
      };
    }

    return {
      totalStreets: parseInt(row.total_streets) || 0,
      completedStreets: parseInt(row.completed_streets) || 0,
      partialStreets: parseInt(row.partial_streets) || 0,
      unvisitedStreets: parseInt(row.unvisited_streets) || 0,
      completionPercentage: parseFloat(row.completion_percentage) || 0,
      totalDistanceMeters: parseFloat(row.total_distance_meters) || 0,
      completedDistanceMeters: parseFloat(row.completed_distance_meters) || 0,
      remainingDistanceMeters: parseFloat(row.remaining_distance_meters) || 0,
      totalRunsCount: parseInt(row.total_runs_count) || 0,
      totalRunningTimeSeconds: parseInt(row.total_running_time_seconds) || 0,
      averageRunDistanceMeters: parseFloat(row.average_run_distance_meters) || 0,
      lastRunDate: row.last_run_date || undefined,
      streetsCompletedThisMonth: parseInt(row.streets_completed_this_month) || 0,
      monthlyProgressPercentage: parseFloat(row.monthly_progress_percentage) || 0,
    };
  } catch (error) {
    console.error('❌ Error calculating Astoria stats:', error);
    // Return safe default stats on error
    return {
      totalStreets: 0,
      completedStreets: 0,
      partialStreets: 0,
      unvisitedStreets: 0,
      completionPercentage: 0,
      totalDistanceMeters: 0,
      completedDistanceMeters: 0,
      remainingDistanceMeters: 0,
      totalRunsCount: 0,
      totalRunningTimeSeconds: 0,
      averageRunDistanceMeters: 0,
      streetsCompletedThisMonth: 0,
      monthlyProgressPercentage: 0,
    };
  }
}

/**
 * Get recent running activity for dashboard highlights
 */
export async function getRecentRuns(limit: number = 5): Promise<StoredStravaRun[]> {
  try {
    const result = await sql`
      SELECT 
        activity_id,
        run_date,
        distance_meters,
        moving_time_seconds,
        average_speed_ms,
        total_elevation_gain,
        polyline,
        start_lat,
        start_lng,
        end_lat,
        end_lng,
        name,
        city,
        state,
        country,
        created_at,
        updated_at
      FROM strava_runs
      ORDER BY run_date DESC
      LIMIT ${limit}
    `;

    return result.rows.map(row => ({
      activity_id: row.activity_id,
      run_date: row.run_date,
      distance_meters: row.distance_meters,
      moving_time_seconds: row.moving_time_seconds,
      average_speed_ms: row.average_speed_ms,
      total_elevation_gain: row.total_elevation_gain,
      polyline: row.polyline,
      start_lat: row.start_lat,
      start_lng: row.start_lng,
      end_lat: row.end_lat,
      end_lng: row.end_lng,
      name: row.name,
      city: row.city,
      state: row.state,
      country: row.country,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  } catch (error) {
    console.error('❌ Error getting recent runs:', error);
    return [];
  }
}

/**
 * Delete old runs (for data cleanup)
 */
export async function deleteRunsOlderThan(date: Date): Promise<number> {
  try {
    const result = await sql`
      DELETE FROM strava_runs
      WHERE run_date < ${date.toISOString()}
    `;

    const deletedCount = result.rowCount || 0;
    console.log(`🧹 Deleted ${deletedCount} runs older than ${date.toDateString()}`);
    return deletedCount;
  } catch (error) {
    console.error('❌ Error deleting old runs:', error);
    return 0;
  }
}

/**
 * Get database health info for monitoring
 */
export async function getDatabaseHealth(): Promise<{
  totalRuns: number;
  totalStreets: number;
  oldestRun?: string;
  newestRun?: string;
  dbSize?: string;
}> {
  try {
    const result = await sql`
      SELECT 
        (SELECT COUNT(*) FROM strava_runs) as total_runs,
        (SELECT COUNT(*) FROM astoria_streets) as total_streets,
        (SELECT MIN(run_date) FROM strava_runs) as oldest_run,
        (SELECT MAX(run_date) FROM strava_runs) as newest_run
    `;

    const row = result.rows[0];
    
    return {
      totalRuns: parseInt(row?.total_runs) || 0,
      totalStreets: parseInt(row?.total_streets) || 0,
      oldestRun: row?.oldest_run || undefined,
      newestRun: row?.newest_run || undefined,
    };
  } catch (error) {
    console.error('❌ Error getting database health:', error);
    return {
      totalRuns: 0,
      totalStreets: 0,
    };
  }
}
