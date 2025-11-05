import os
import json
import pickle
import requests
import pandas as pd
import geopandas as gpd
import osmnx as ox
import networkx as nx
from shapely.geometry import shape
from shapely.ops import unary_union

print("🚀 Starting One-Time Generation of Astoria Base Map...")

# --- CONFIGURATION ---
# Store data in backend for better organization
OUTPUT_DIR_PUBLIC = "public/data/astoria-conquest"  # Frontend visualization
OUTPUT_DIR_CACHE = "backend/data/astoria-conquest/cache"  # Backend cache
OSMNX_CACHE_DIR = "backend/data/osmnx-cache"  # OSMnx HTTP cache
os.makedirs(OUTPUT_DIR_PUBLIC, exist_ok=True)
os.makedirs(OUTPUT_DIR_CACHE, exist_ok=True)
os.makedirs(OSMNX_CACHE_DIR, exist_ok=True)

# Configure OSMnx to use backend cache directory
ox.settings.cache_folder = OSMNX_CACHE_DIR
ox.settings.use_cache = True

# --- HELPER FUNCTIONS ---
def remove_all_dead_ends(graph):
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
keep_names = { "Astoria (Central)", "Old Astoria-Hallets Point", 'Astoria (East)-Woodside (North)', 'Queensbridge-Ravenswood-Dutch Kills', 'Astoria (North)-Ditmars-Steinway', 'Astoria Park'}
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
graph_path = os.path.join(OUTPUT_DIR_CACHE, "astoria_graph.pkl")
with open(graph_path, 'wb') as f:
    pickle.dump(G_final, f)
print(f"      - Saved Python graph object to: {graph_path}")

# 2. Save the Base Map as GeoJSON (for the website frontend)
geojson_path = os.path.join(OUTPUT_DIR_PUBLIC, "astoria-base-map.geojson")
edges_gdf.to_file(geojson_path, driver='GeoJSON')
print(f"      - Saved web-ready base map to: {geojson_path}")

print("\n✅ Success! Foundational map assets have been created.")
