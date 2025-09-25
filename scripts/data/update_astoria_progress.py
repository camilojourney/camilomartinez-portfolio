import os
import json
import pickle
import time
import math
from math import radians, sin, cos, sqrt, atan2
import geopandas as gpd
import osmnx as ox
import networkx as nx
import polyline
import psycopg2
from dotenv import load_dotenv

load_dotenv() # Loads environment variables from .env file

print("🔄 Starting Astoria Conquest Progress Update...")

# --- CONFIGURATION ---
DB_CONNECTION_STRING = os.getenv("POSTGRES_URL_NONPRISMA")
CACHE_DIR = "astoria_conquest_data"
PUBLIC_DIR = "public/data/astoria-conquest"
GRAPH_PATH = os.path.join(CACHE_DIR, "astoria_graph.pkl")

# --- STEP 1: LOAD THE CACHED BASE MAP ---
print("   -> Loading cached base map graph...")
if not os.path.exists(GRAPH_PATH):
    print("   -> 🚨 ERROR: Base graph 'astoria_graph.pkl' not found.")
    print("   -> Please run 'generate_astoria_base_map.py' first.")
    exit()

with open(GRAPH_PATH, 'rb') as f:
    G_final = pickle.load(f)
nodes_gdf, edges_gdf = ox.graph_to_gdfs(G_final)
total_length_meters = edges_gdf['length'].sum()
total_length_miles = total_length_meters / 1609.34
print("   -> Base map loaded successfully.")


# --- STEP 2: FETCH ALL STRAVA RUN POLYLINES ---
print("   -> Fetching Strava polylines from database...")
all_polylines = []
try:
    conn = psycopg2.connect(DB_CONNECTION_STRING)
    cur = conn.cursor()
    
    # --- THIS IS THE UPDATED SQL QUERY ---
    sql_query = """
        SELECT 
            sr.id, sr.name, sr.start_date, sr.distance_meters,
            sr.detailed_polyline, sr.elapsed_time_seconds,
            sr.average_speed_mps, sr.suffer_score,
            -- WHOOP data
            w.strain, w.avg_heart_rate_bpm, w.max_heart_rate_bpm,
            w.kilojoule, w.hr_zone_0_ms, w.hr_zone_1_ms, w.hr_zone_2_ms,
            w.hr_zone_3_ms, w.hr_zone_4_ms, w.hr_zone_5_ms
        FROM strava_runs sr
        LEFT JOIN activity_correlations ac ON sr.id = ac.strava_run_id
        LEFT JOIN whoop_workouts w ON w.id = ac.whoop_workout_id
        WHERE 
            sr.start_date >= '2025-09-20'
            AND sr.detailed_polyline IS NOT NULL
        ORDER BY sr.start_date DESC;
    """
    cur.execute(sql_query)
    # --- END OF UPDATED QUERY ---

    rows = cur.fetchall()
    # Create a list of run objects with all the data
    runs_data = []
    for idx, row in enumerate(rows, 1):
        # Convert heart rate zone milliseconds to minutes for better readability
        hr_zones_minutes = [
            round(zone_ms / (1000 * 60), 2) if zone_ms else 0
            for zone_ms in row[12:18]  # hr_zone_0_ms through hr_zone_5_ms
        ]
        
        runs_data.append({
            "run_number": len(rows) - idx + 1,  # Reverse numbering since ORDER BY DESC
            "id": row[0],
            "name": row[1],
            "date": row[2].isoformat(),
            "distance_meters": row[3],
            "polyline": row[4],
            "duration_seconds": row[5],
            "average_speed_mps": row[6],
            "suffer_score": row[7],
            # WHOOP metrics
            "whoop_strain": row[8],
            "avg_heart_rate": row[9],
            "max_heart_rate": row[10],
            "kilojoules": row[11],
            # Heart rate zones in minutes
            "heart_rate_zones": {
                "rest": hr_zones_minutes[0],
                "light": hr_zones_minutes[1],
                "moderate": hr_zones_minutes[2],
                "hard": hr_zones_minutes[3],
                "peak": hr_zones_minutes[4],
                "max": hr_zones_minutes[5]
            }
        })
    
    # Still maintain all_polylines for the coverage calculation
    all_polylines = [run["polyline"] for run in runs_data]
    cur.close()
    conn.close()
    print(f"   -> Found {len(runs_data)} runs matching the criteria.")
except Exception as e:
    print(f"   -> 🚨 ERROR: Could not connect to database: {e}")
    exit()

# --- STEP 3: PROCESS POLYLINES AND AGGREGATE COVERED STREETS ---
print("   -> Matching all runs to the street network...")
all_covered_edges = set()
minx, miny, maxx, maxy = edges_gdf.total_bounds

def haversine(lat1, lon1, lat2, lon2):
    """Calculate great-circle distance between two points in meters."""
    R = 6371000.0  # Earth radius in meters
    phi1, phi2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlambda = radians(lon2 - lon1)
    a = sin(dphi/2)**2 + cos(phi1) * cos(phi2) * sin(dlambda/2)**2
    return 2 * R * atan2(sqrt(a), sqrt(1 - a))

# --- Re-introduce the helper functions from your original script ---
def smooth_trace(points, w=3):
    if w <= 1 or len(points) < w: return points
    sm = []
    for i in range(len(points)):
        a = max(0, i - w // 2)
        b = min(len(points), i + w // 2 + 1)
        lats = [p[0] for p in points[a:b]]
        lons = [p[1] for p in points[a:b]]
        sm.append((sum(lats) / len(lats), sum(lons) / len(lons)))
    return sm

def spatial_cluster(points, dist_threshold=32):
    if not points: return []
    clusters = []
    current_cluster = [points[0]]
    for i in range(1, len(points)):
        dist = haversine(points[i-1][0], points[i-1][1], points[i][0], points[i][1])
        if dist <= dist_threshold:
            current_cluster.append(points[i])
        else:
            if current_cluster:
                avg_lat = sum(p[0] for p in current_cluster) / len(current_cluster)
                avg_lon = sum(p[1] for p in current_cluster) / len(current_cluster)
                clusters.append((avg_lat, avg_lon))
            current_cluster = [points[i]]
    if current_cluster:
        avg_lat = sum(p[0] for p in current_cluster) / len(current_cluster)
        avg_lon = sum(p[1] for p in current_cluster) / len(current_cluster)
        clusters.append((avg_lat, avg_lon))
    return clusters
# --- End of helper functions ---

# Create an undirected graph for simple pathfinding, just like the original script
G_u = nx.Graph(G_final)

for encoded_polyline in all_polylines:
    if not encoded_polyline: continue
    
    # 1. DECODE AND PRE-PROCESS (Original Method)
    decoded_coords = polyline.decode(encoded_polyline)
    clipped_coords = [(lat, lon) for lat, lon in decoded_coords if (minx <= lon <= maxx) and (miny <= lat <= maxy)]
    if len(clipped_coords) < 2: continue
    
    smoothed_coords = smooth_trace(clipped_coords, w=3)
    clustered_coords = spatial_cluster(smoothed_coords)
    if len(clustered_coords) < 2: continue

    # 2. MATCH TO NETWORK (Original Method)
    edge_triplets, snap_dists = ox.distance.nearest_edges(
        G_final,
        X=[p[1] for p in clustered_coords],
        Y=[p[0] for p in clustered_coords],
        return_dist=True,
    )

    candidate_nodes = []
    for (u, v, k), (lat, lon), d in zip(edge_triplets, clustered_coords, snap_dists):
        if d is None: continue
        du = haversine(lat, lon, G_final.nodes[u]['y'], G_final.nodes[u]['x'])
        dv = haversine(lat, lon, G_final.nodes[v]['y'], G_final.nodes[v]['x'])
        candidate_nodes.append(u if du <= dv else v)

    snapped_nodes = []
    for n in candidate_nodes:
        if not snapped_nodes or n != snapped_nodes[-1]:
            snapped_nodes.append(n)
            
    # 3. RECONSTRUCT PATH (Original Method)
    for a, b in zip(snapped_nodes[:-1], snapped_nodes[1:]):
        if a == b: continue
        try:
            path = nx.shortest_path(G_u, a, b, weight='length')
            for u, v in zip(path[:-1], path[1:]):
                all_covered_edges.add(tuple(sorted((u, v))))
        except (nx.NetworkXNoPath, Exception):
            continue

print(f"   -> Found {len(all_covered_edges)} unique street segments covered in total.")


# --- STEP 4: GENERATE AND SAVE UPDATED FILES ---
print("   -> Generating and saving updated progress files...")

# Helper function to get edge geometry
def get_edge_geometry(u, v, G):
    """Get the geometry of an edge, trying both directions."""
    edge_data = G.get_edge_data(u, v) or G.get_edge_data(v, u)
    if edge_data:
        for data in edge_data.values():
            if 'geometry' in data:
                return data['geometry']
    return None

# Create continuous paths from edge sequences
continuous_paths = []
current_path = []

for u, v in all_covered_edges:
    geom = get_edge_geometry(u, v, G_final)
    if geom is not None:
        coords = list(geom.coords)
        if not current_path:
            current_path.extend(coords)
        else:
            # Check if this edge connects to current path
            if coords[0] == current_path[-1] or coords[-1] == current_path[-1]:
                if coords[0] == current_path[-1]:
                    current_path.extend(coords[1:])
                else:
                    current_path.extend(coords[-2::-1])  # Reverse and append
            else:
                # Start new path
                if len(current_path) > 1:
                    continuous_paths.append(current_path)
                current_path = list(coords)

if current_path and len(current_path) > 1:
    continuous_paths.append(current_path)

# Create a mask for covered edges using both node-based and geometry-based matching
covered_edges_mask = edges_gdf.apply(
    lambda row: (
        tuple(sorted((row.name[0], row.name[1]))) in all_covered_edges
    ),
    axis=1
)

# Filter the edges GeoDataFrame to only include covered streets
covered_edges_gdf = edges_gdf[covered_edges_mask].copy()

# Calculate accurate coverage statistics
total_length_meters = edges_gdf['length'].sum()
covered_length_meters = 0

for u, v in all_covered_edges:
    edge_data = G_final.get_edge_data(u, v) or G_final.get_edge_data(v, u)
    if edge_data:
        # Get the first edge data if there are multiple
        first_edge = list(edge_data.values())[0]
        edge_length = first_edge.get('length', 0)
        covered_length_meters += edge_length

# Convert to miles
total_length_miles = total_length_meters / 1609.34
covered_length_miles = covered_length_meters / 1609.34
percent_complete = (covered_length_miles / total_length_miles) * 100 if total_length_miles > 0 else 0

# Calculate coverage density (ratio of GPS points to street segments)
coverage_density = len(all_covered_edges) / float(len(edges_gdf)) if len(edges_gdf) > 0 else 0

stats = {
    "summary": {
        "total_miles": round(total_length_miles, 2),
        "covered_miles": round(covered_length_miles, 2),
        "percent_complete": round(percent_complete, 2),
        "total_segments": len(edges_gdf),
        "covered_segments": len(covered_edges_gdf),
        "coverage_density": round(coverage_density * 100, 2),
        "total_runs": len(runs_data),
        "continuous_paths": len(continuous_paths),
        "last_updated": time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())
    },
    "runs": runs_data
}

# Overwrite the progress files
covered_streets_path = os.path.join(PUBLIC_DIR, "astoria-covered-streets.geojson")
stats_path = os.path.join(PUBLIC_DIR, "astoria-progress-stats.json")

# Export covered streets as GeoJSON
covered_edges_gdf.to_file(
    covered_streets_path,
    driver='GeoJSON',
    encoding='utf-8'
)

# Convert Decimal objects to float for JSON serialization
def decimal_default(obj):
    from decimal import Decimal
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

with open(stats_path, 'w') as f:
    json.dump(stats, f, default=decimal_default)

print("\n✅ Success! Progress files have been updated.")