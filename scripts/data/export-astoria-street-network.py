#!/usr/bin/env python3
"""
Export Astoria Street Network from OSMnx to Optimized JSON Format

This script extracts the actual street network used in the Astoria Conquest project
and exports it in an optimized format for fast map matching in the web application.
"""

import json
import requests
import pandas as pd
import geopandas as gpd
import osmnx as ox
import numpy as np
from shapely.geometry import shape
from shapely.ops import unary_union
import time

print("🗺️ Exporting Astoria Street Network for Web Application...")

# Step 1: Get Astoria neighborhoods (same as in Quarto project)
print("📍 Fetching Astoria neighborhood boundaries...")
API_URL = "https://data.cityofnewyork.us/resource/9nt8-h7nd.json"
params = {"$where": "upper(ntaname) like '%ASTORIA%'"}

response = requests.get(API_URL, params=params)
response.raise_for_status()
df = pd.DataFrame(response.json())

# Filter for null geometry
df = df[~df['the_geom'].isnull()].copy()

# Parse geometry safely
def parse_geojson_geom(geom_dict):
    try:
        if isinstance(geom_dict, dict) and 'type' in geom_dict:
            return shape(geom_dict)
        return None
    except Exception as e:
        print(f"⚠️ Failed to parse geometry: {str(e)[:100]}...")
        return None

geometry_series = df['the_geom'].apply(parse_geojson_geom)
valid_geom = geometry_series.notna()
df = df[valid_geom].copy()
geometry_series = geometry_series[valid_geom]

# Create GeoDataFrame
gdf = gpd.GeoDataFrame(df, geometry=geometry_series, crs="EPSG:4326")

# Filter for specific Astoria neighborhoods (same as Quarto project)
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

print(f"📊 Selected {len(gdf_astoria)} Astoria neighborhoods")

# Step 2: Download street network (same parameters as Quarto project)
print("🛣️ Downloading street network from OpenStreetMap...")
start_time = time.time()

astoria_boundary = unary_union(gdf_astoria.geometry.values)

# Download with same parameters as Quarto project
G = ox.graph_from_polygon(
    astoria_boundary, 
    network_type='walk',
    retain_all=True,
    truncate_by_edge=True
)

# Filter for running-suitable street types (same as Quarto project)
def remove_all_dead_ends(graph):
    G_pruned = graph.copy()
    while True:
        dead_ends = [
            node for node in G_pruned.nodes()
            if len(set(G_pruned.successors(node)) | set(G_pruned.predecessors(node))) == 1
        ]
        if not dead_ends:
            break
        G_pruned.remove_nodes_from(dead_ends)
    
    if G_pruned.number_of_nodes() > 0:
        import networkx as nx
        largest_component = max(nx.weakly_connected_components(G_pruned), key=len)
        G_final = G_pruned.subgraph(largest_component).copy()
    else:
        G_final = G_pruned
    return G_final

# Filter street types (same as Quarto project)
street_types_to_keep = ['residential', 'tertiary', 'secondary', 'unclassified', 'living_street']
G_filtered = ox.graph_from_polygon(
    astoria_boundary,
    network_type='walk',
    custom_filter=f'["highway"~"{"|".join(street_types_to_keep)}"]'
)

# Remove dead ends (same as Quarto project)
G_final = remove_all_dead_ends(G_filtered)

download_time = time.time() - start_time
print(f"✅ Network downloaded in {download_time:.1f}s")

# Step 3: Convert to GeoDataFrames
nodes_gdf, edges_gdf = ox.graph_to_gdfs(G_final)

print(f"📊 Network Statistics:")
print(f"   • Nodes (intersections): {len(nodes_gdf):,}")
print(f"   • Edges (street segments): {len(edges_gdf):,}")
print(f"   • Total length: {(edges_gdf['length'].sum() / 1609.34):.1f} miles")

# Step 4: Create optimized data structure for web application  
print("⚡ Creating optimized data structure...")

# Create spatial grid for fast lookups (divide area into grid cells)
bounds = edges_gdf.total_bounds  # minx, miny, maxx, maxy
GRID_SIZE = 20  # 20x20 grid for spatial indexing

lat_min, lat_max = bounds[1], bounds[3]
lng_min, lng_max = bounds[0], bounds[2]

lat_step = (lat_max - lat_min) / GRID_SIZE
lng_step = (lng_max - lng_min) / GRID_SIZE

def get_grid_cell(lat, lng):
    """Get grid cell coordinates for a point"""
    row = min(int((lat - lat_min) / lat_step), GRID_SIZE - 1)
    col = min(int((lng - lng_min) / lng_step), GRID_SIZE - 1)
    return (row, col)

# Build spatial index
spatial_index = {}
for idx, edge in edges_gdf.iterrows():
    # Get edge bounds
    edge_bounds = edge.geometry.bounds
    edge_lat_min, edge_lat_max = edge_bounds[1], edge_bounds[3]
    edge_lng_min, edge_lng_max = edge_bounds[0], edge_bounds[2]
    
    # Find all grid cells this edge intersects
    start_row = max(0, int((edge_lat_min - lat_min) / lat_step))
    end_row = min(GRID_SIZE - 1, int((edge_lat_max - lat_min) / lat_step))
    start_col = max(0, int((edge_lng_min - lng_min) / lng_step))
    end_col = min(GRID_SIZE - 1, int((edge_lng_max - lng_min) / lng_step))
    
    # Add edge to all relevant grid cells
    for row in range(start_row, end_row + 1):
        for col in range(start_col, end_col + 1):
            cell_key = f"{row},{col}"
            if cell_key not in spatial_index:
                spatial_index[cell_key] = []
            
            # Extract geometry points efficiently
            if hasattr(edge.geometry, 'coords'):
                geometry_points = list(edge.geometry.coords)
            else:
                geometry_points = [(edge.geometry.x, edge.geometry.y)]
            
            edge_data = {
                'id': f"edge_{idx}",
                'geometry': [[lat, lng] for lng, lat in geometry_points],  # Convert to [lat, lng]
                'length_meters': float(edge.get('length', 0)),
                'street_name': str(edge.get('name', '')),
                'highway_type': str(edge.get('highway', 'unknown')),
                'from_node': str(edge.name[0]) if hasattr(edge, 'name') else f"node_{idx}_start",
                'to_node': str(edge.name[1]) if hasattr(edge, 'name') else f"node_{idx}_end"
            }
            spatial_index[cell_key].append(edge_data)

print(f"🔍 Created spatial index with {len(spatial_index)} grid cells")

# Step 5: Create final optimized JSON structure
export_data = {
    'metadata': {
        'generated_at': time.strftime('%Y-%m-%d %H:%M:%S'),
        'total_nodes': len(nodes_gdf),
        'total_edges': len(edges_gdf), 
        'total_length_miles': float(edges_gdf['length'].sum() / 1609.34),
        'bounds': {
            'north': float(lat_max),
            'south': float(lat_min), 
            'east': float(lng_max),
            'west': float(lng_min)
        },
        'grid_size': GRID_SIZE,
        'grid_bounds': {
            'lat_min': float(lat_min),
            'lat_max': float(lat_max),
            'lng_min': float(lng_min), 
            'lng_max': float(lng_max),
            'lat_step': float(lat_step),
            'lng_step': float(lng_step)
        }
    },
    'spatial_index': spatial_index,
    'street_types': list(street_types_to_keep)
}

# Step 6: Export to JSON file
output_path = '/Users/camilo/camilomartinez-portfolio/public/data/astoria-street-network.json'
print(f"💾 Exporting to {output_path}...")

import os
os.makedirs(os.path.dirname(output_path), exist_ok=True)

with open(output_path, 'w') as f:
    json.dump(export_data, f, separators=(',', ':'))  # Compact JSON

file_size = os.path.getsize(output_path) / (1024 * 1024)  # MB
print(f"✅ Export complete!")
print(f"📊 Final Statistics:")
print(f"   • File size: {file_size:.1f} MB")
print(f"   • Grid cells: {len(spatial_index)}")
print(f"   • Average edges per cell: {sum(len(edges) for edges in spatial_index.values()) / len(spatial_index):.1f}")
print(f"   • Ready for fast map matching! 🚀")