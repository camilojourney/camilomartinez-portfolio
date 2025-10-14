"""
Generate Astoria street network base map (ONE-TIME SETUP).

This script:
1. Fetches Astoria neighborhood boundaries from NYC Open Data
2. Downloads street network from OpenStreetMap
3. Filters and cleans the street network
4. Saves output files for the Conquest map

Outputs:
- backend/data/astoria-conquest/cache/astoria_graph.pkl (for Python processing)
- public/data/astoria-conquest/astoria-base-map.geojson (for frontend display)

Usage:
    # From project root
    cd backend
    poetry run python app/scripts/astoria/generate_base_map.py

    # Or from npm script
    npm run map:setup
"""

import os
import pickle
from pathlib import Path
import requests
import pandas as pd
import geopandas as gpd
import osmnx as ox
import networkx as nx
from shapely.geometry import shape
from shapely.ops import unary_union

print("🚀 Starting One-Time Generation of Astoria Base Map...")

# --- CONFIGURATION ---
# Get project root (backend/app/scripts/astoria -> go up 4 levels)
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent.parent

# Store data in backend for better organization
DATA_OUTPUT_DIR = PROJECT_ROOT / "public" / "data" / "astoria-conquest"  # Frontend data (static assets)
OUTPUT_DIR_CACHE = PROJECT_ROOT / "backend" / "data" / "astoria-conquest" / "cache"  # Backend cache
OSMNX_CACHE_DIR = PROJECT_ROOT / "backend" / "data" / "osmnx-cache"  # OSMnx HTTP cache

os.makedirs(DATA_OUTPUT_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR_CACHE, exist_ok=True)
os.makedirs(OSMNX_CACHE_DIR, exist_ok=True)

# Configure OSMnx to use backend cache directory
ox.settings.cache_folder = str(OSMNX_CACHE_DIR)
ox.settings.use_cache = True

# --- HELPER FUNCTIONS ---
def remove_all_dead_ends(graph):
    """Remove dead-end streets from the graph."""
    # Use an undirected graph view for connected components and degree checks
    G_undirected = graph.to_undirected()
    # Find nodes with degree 1 (dead-ends in an undirected graph)
    dead_ends = [n for n, d in G_undirected.degree() if d == 1]
    
    # Create a copy to modify
    G_pruned = graph.copy()
    G_pruned.remove_nodes_from(dead_ends)
    
    # Keep only the largest connected component after removing dead ends
    if G_pruned.number_of_nodes() > 0:
        # Use the undirected view again to find the largest component
        G_pruned_undirected = G_pruned.to_undirected()
        largest_cc = max(nx.connected_components(G_pruned_undirected), key=len)
        G_final = G_pruned.subgraph(largest_cc).copy()
        return G_final
    return G_pruned


# --- STEP 1: FETCH AND PROCESS THE STREET NETWORK ---
print("   -> Fetching neighborhood boundaries from NYC Open Data...")
API_URL = "https://data.cityofnewyork.us/resource/9nt8-h7nd.json"
params = {"$where": "upper(ntaname) like '%ASTORIA%'"}
response = requests.get(API_URL, params=params)
df = pd.DataFrame(response.json())
df = df[~df['the_geom'].isnull()].copy()
geometry_series = df['the_geom'].apply(lambda g: shape(g) if g else None)
gdf = gpd.GeoDataFrame(df, geometry=geometry_series, crs="EPSG:4326")

keep_names = {
    "Astoria (Central)",
    "Old Astoria-Hallets Point",
    'Astoria (East)-Woodside (North)',
    'Queensbridge-Ravenswood-Dutch Kills',
    'Astoria (North)-Ditmars-Steinway',
    'Astoria Park'
}
keep_names_normalized = {name.lower().strip() for name in keep_names}
gdf['ntaname_normalized'] = gdf['ntaname'].str.lower().str.strip()
gdf_astoria = gdf[gdf["ntaname_normalized"].isin(keep_names_normalized)].copy()
astoria_boundary = unary_union(gdf_astoria.geometry.values)

print("   -> Fetching street network from OpenStreetMap (This may take a minute)...")
street_types_to_keep = ['residential', 'tertiary', 'secondary', 'unclassified', 'living_street']
G_raw = ox.graph_from_polygon(
    astoria_boundary,
    network_type='walk',
    custom_filter=f'["highway"~"{"|".join(street_types_to_keep)}"]'
)

print("   -> Cleaning the network (removing dead ends)...")
G_final = remove_all_dead_ends(G_raw)

nodes_gdf, edges_gdf = ox.graph_to_gdfs(G_final)
print(f"   -> Final network created with {len(nodes_gdf)} nodes and {len(edges_gdf)} edges.")


# --- STEP 2: SAVE THE GENERATED ASSETS ---
print("   -> Saving processed files...")

# 1. Save the NetworkX Graph Object (for fast loading in future scripts)
graph_path = OUTPUT_DIR_CACHE / "astoria_graph.pkl"
with open(graph_path, 'wb') as f:
    pickle.dump(G_final, f)
print(f"      - Saved Python graph object to: {graph_path}")

# 2. Save the Base Map as GeoJSON (for the website frontend)
geojson_path = DATA_OUTPUT_DIR / "astoria-base-map.geojson"
edges_gdf.to_file(geojson_path, driver='GeoJSON')
print(f"      - Saved web-ready base map to: {geojson_path}")

print("\n✅ Success! Foundational map assets have been created.")
