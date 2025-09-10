#!/usr/bin/env python3
"""
Generate Astoria Base Map for Portfolio Website

This script extracts the map generation logic from the Quarto notebook
and creates a reusable base map for the Astoria Conquest project.

Usage:
    python scripts/data/generate-astoria-base-map.py
"""

import requests
import pandas as pd
import geopandas as gpd
import matplotlib.pyplot as plt
import osmnx as ox
import numpy as np
from shapely.geometry import shape
from shapely.ops import unary_union
import json
import os
from datetime import datetime

# Configuration
API_URL = "https://data.cityofnewyork.us/resource/9nt8-h7nd.json"
OUTPUT_DIR = "public/maps/astoria"
ASTORIA_NEIGHBORHOODS = {
    "Astoria (Central)",
    "Old Astoria-Hallets Point", 
    'Astoria (East)-Woodside (North)',
    'Queensbridge-Ravenswood-Dutch Kills',
    'Astoria (North)-Ditmars-Steinway',
    'Astoria Park'
}

# Key coordinates for reference
HOME_COORDS = (40.755124137014725, -73.92649719348772)
GYM_COORDS = (40.762049034238565, -73.92476009837436)

def setup_output_directory():
    """Create output directory structure."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"📁 Output directory: {OUTPUT_DIR}")

def fetch_astoria_neighborhoods():
    """Fetch and filter Astoria neighborhood data from NYC Open Data."""
    print("📊 Fetching neighborhood data from NYC Open Data...")
    
    params = {"$where": "upper(ntaname) like '%ASTORIA%'"}
    response = requests.get(API_URL, params=params)
    response.raise_for_status()
    
    df = pd.DataFrame(response.json())
    print(f"   • Found {len(df)} neighborhoods containing 'Astoria'")
    
    return df

def create_astoria_geodataframe(df):
    """Convert neighborhood data to GeoDataFrame and filter for target areas."""
    print("🗺️  Processing neighborhood geometries...")
    
    # Remove null geometries
    df = df[df['the_geom'].notna()].copy()
    
    # Parse GeoJSON geometries
    def parse_geojson_geom(geom_dict):
        try:
            if isinstance(geom_dict, dict) and 'type' in geom_dict:
                return shape(geom_dict)
            return None
        except Exception as e:
            print(f"   • Warning: Failed to parse geometry: {str(e)[:50]}...")
            return None
    
    geometry_series = df['the_geom'].apply(parse_geojson_geom)
    valid_geom = geometry_series.notna()
    
    if not valid_geom.all():
        print(f"   • Removed {(~valid_geom).sum()} invalid geometries")
        df = df[valid_geom].copy()
        geometry_series = geometry_series[valid_geom]
    
    # Create GeoDataFrame
    gdf = gpd.GeoDataFrame(df, geometry=geometry_series, crs="EPSG:4326")
    
    # Filter for target Astoria neighborhoods
    keep_names_normalized = {name.lower().strip() for name in ASTORIA_NEIGHBORHOODS}
    gdf['ntaname_normalized'] = gdf['ntaname'].str.lower().str.strip()
    gdf_astoria = gdf[gdf["ntaname_normalized"].isin(keep_names_normalized)].copy()
    
    print(f"   • Selected {len(gdf_astoria)} target neighborhoods")
    return gdf_astoria

def generate_street_network(gdf_astoria):
    """Generate street network using OSMnx within Astoria boundaries."""
    print("🛣️  Generating street network with OSMnx...")
    
    # Create boundary polygon
    astoria_boundary = unary_union(gdf_astoria.geometry.values)
    
    # Define running-suitable street types
    street_types = ['residential', 'tertiary', 'secondary', 'unclassified', 'living_street']
    
    # Download street network
    G = ox.graph_from_polygon(
        astoria_boundary,
        network_type='walk',
        custom_filter=f'["highway"~"{"|".join(street_types)}"]',
        retain_all=True,
        truncate_by_edge=True
    )
    
    print(f"   • Downloaded {len(G.nodes())} nodes and {len(G.edges())} edges")
    return G, astoria_boundary

def remove_dead_ends(graph):
    """Remove dead-end nodes iteratively to create clean running network."""
    print("✂️  Removing dead ends for cleaner routes...")
    
    G_pruned = graph.copy()
    original_nodes = len(G_pruned.nodes())
    
    while True:
        # Find nodes with only one neighbor
        dead_ends = [
            node for node in G_pruned.nodes()
            if len(set(G_pruned.successors(node)) | set(G_pruned.predecessors(node))) == 1
        ]
        
        if not dead_ends:
            break
            
        G_pruned.remove_nodes_from(dead_ends)

    # Keep largest connected component
    if G_pruned.number_of_nodes() > 0:
        import networkx as nx
        largest_component = max(nx.weakly_connected_components(G_pruned), key=len)
        G_final = G_pruned.subgraph(largest_component).copy()
    else:
        G_final = G_pruned

    final_nodes = len(G_final.nodes())
    reduction = ((original_nodes - final_nodes) / original_nodes) * 100
    print(f"   • Removed {reduction:.1f}% of nodes ({original_nodes} → {final_nodes})")
    
    return G_final

def generate_base_map(gdf_astoria, G_final, astoria_boundary):
    """Generate the base map image with proper styling."""
    print("🎨 Generating base map visualization...")
    
    # Convert to GeoDataFrames for plotting
    nodes_gdf, edges_gdf = ox.graph_to_gdfs(G_final)
    
    # Create high-quality figure
    plt.style.use('dark_background')
    fig, ax = plt.subplots(figsize=(20, 16), dpi=150)
    
    # Plot neighborhood boundaries
    gdf_astoria.plot(
        ax=ax, 
        facecolor='#1a1a1a', 
        edgecolor='#333333', 
        alpha=0.8, 
        linewidth=1.5
    )
    
    # Plot street network
    edges_gdf.plot(
        ax=ax, 
        color='#444444', 
        linewidth=0.8, 
        alpha=0.9
    )
    
    # Add reference points
    ax.scatter(HOME_COORDS[1], HOME_COORDS[0], c='#00ff00', s=200, marker='h',
               label='Home (Start)', zorder=10, edgecolors='white', linewidth=2)
    ax.scatter(GYM_COORDS[1], GYM_COORDS[0], c='#ff8c00', s=200, marker='s',
               label='Gym (End)', zorder=10, edgecolors='white', linewidth=2)
    
    # Styling
    ax.set_facecolor('#000000')
    ax.set_title('Astoria Running Network - Base Map', 
                fontsize=24, fontweight='bold', color='white', pad=30)
    ax.legend(loc='upper right', fontsize=14, facecolor='black', 
              labelcolor='white', framealpha=0.8)
    
    # Remove axis labels for cleaner look
    ax.set_xlabel('')
    ax.set_ylabel('')
    ax.tick_params(colors='white', labelsize=10)
    
    # Set tight layout
    plt.tight_layout()
    
    return fig, ax

def save_map_outputs(fig, gdf_astoria, G_final, astoria_boundary):
    """Save map image and coordinate metadata."""
    print("💾 Saving map outputs...")
    
    # Save high-quality map image
    map_path = os.path.join(OUTPUT_DIR, 'astoria-base-map.png')
    fig.savefig(map_path, dpi=200, bbox_inches='tight', 
                facecolor='black', edgecolor='none')
    print(f"   • Saved base map: {map_path}")
    
    # Calculate and save bounds for coordinate reference
    bounds = gdf_astoria.total_bounds  # [minx, miny, maxx, maxy]
    
    # Save coordinate metadata
    metadata = {
        'generated_at': datetime.now().isoformat(),
        'coordinate_system': 'EPSG:4326',
        'bounds': {
            'south': float(bounds[1]),  # min latitude
            'west': float(bounds[0]),   # min longitude  
            'north': float(bounds[3]),  # max latitude
            'east': float(bounds[2])    # max longitude
        },
        'center': {
            'lat': float((bounds[1] + bounds[3]) / 2),
            'lng': float((bounds[0] + bounds[2]) / 2)
        },
        'reference_points': {
            'home': {'lat': HOME_COORDS[0], 'lng': HOME_COORDS[1]},
            'gym': {'lat': GYM_COORDS[0], 'lng': GYM_COORDS[1]}
        },
        'stats': {
            'total_nodes': len(G_final.nodes()),
            'total_edges': len(G_final.edges()),
            'neighborhoods': list(ASTORIA_NEIGHBORHOODS)
        }
    }
    
    metadata_path = os.path.join(OUTPUT_DIR, 'map-metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"   • Saved metadata: {metadata_path}")
    
    # Save GeoJSON for web use
    geojson_path = os.path.join(OUTPUT_DIR, 'astoria-boundaries.geojson')
    gdf_astoria.to_file(geojson_path, driver='GeoJSON')
    print(f"   • Saved boundaries: {geojson_path}")
    
    return metadata

def main():
    """Main execution function."""
    print("🗽 Generating Astoria Base Map for Portfolio")
    print("=" * 50)
    
    try:
        # Setup
        setup_output_directory()
        
        # Data processing pipeline
        df = fetch_astoria_neighborhoods()
        gdf_astoria = create_astoria_geodataframe(df)
        G, astoria_boundary = generate_street_network(gdf_astoria)
        G_final = remove_dead_ends(G)
        
        # Map generation
        fig, ax = generate_base_map(gdf_astoria, G_final, astoria_boundary)
        metadata = save_map_outputs(fig, gdf_astoria, G_final, astoria_boundary)
        
        # Success summary
        print("\n✅ Base map generation complete!")
        print(f"   • Map bounds: {metadata['bounds']}")
        print(f"   • Center point: {metadata['center']}")
        print(f"   • Network: {metadata['stats']['total_nodes']} nodes, {metadata['stats']['total_edges']} edges")
        print(f"   • Files saved to: {OUTPUT_DIR}")
        
        print("\n🔄 Next steps:")
        print("   1. Review generated map image")
        print("   2. Integrate with Next.js component")
        print("   3. Set up Strava API for route overlays")
        
        plt.show()
        
    except Exception as e:
        print(f"❌ Error generating base map: {e}")
        raise

if __name__ == "__main__":
    main()
