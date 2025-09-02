#!/usr/bin/env node
// 📂 src/scripts/load-astoria-streets.js
/**
 * Script to load Astoria street network data into the database
 * This is a one-time setup script to populate the astoria_streets table
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Sample GeoJSON data for Astoria streets (replace with real data)
const sampleAstoriaStreets = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Northern Boulevard",
        "highway": "primary",
        "street_type": "boulevard"
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-73.9262, 40.7614],
          [-73.9260, 40.7616],
          [-73.9258, 40.7618]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "Astoria Boulevard",
        "highway": "secondary",
        "street_type": "boulevard"
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-73.9200, 40.7650],
          [-73.9195, 40.7652],
          [-73.9190, 40.7654]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "31st Street",
        "highway": "residential",
        "street_type": "street"
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-73.9240, 40.7600],
          [-73.9242, 40.7620],
          [-73.9244, 40.7640]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "30th Avenue",
        "highway": "residential",
        "street_type": "avenue"
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-73.9300, 40.7630],
          [-73.9280, 40.7632],
          [-73.9260, 40.7634]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "Ditmars Boulevard",
        "highway": "secondary",
        "street_type": "boulevard"
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [-73.9100, 40.7700],
          [-73.9120, 40.7702],
          [-73.9140, 40.7704]
        ]
      }
    }
  ]
};

/**
 * Calculate the approximate length of a LineString in meters
 */
function calculateLineStringLength(coordinates) {
  let totalLength = 0;
  
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lon1, lat1] = coordinates[i];
    const [lon2, lat2] = coordinates[i + 1];
    
    // Haversine formula for distance between two points
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    totalLength += distance;
  }
  
  return totalLength;
}

async function loadAstoriaStreets() {
  console.log('🗺️ Starting Astoria streets data loading...');
  
  // Check for environment variables
  if (!process.env.POSTGRES_URL) {
    console.error('❌ POSTGRES_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Test database connection
    const client = await pool.connect();
    console.log('✅ Database connection established');
    
    // Check if PostGIS extension is available
    const postgisCheck = await client.query('SELECT PostGIS_Version()');
    console.log('✅ PostGIS version:', postgisCheck.rows[0].postgis_version);

    // Load GeoJSON data (use sample data or read from file)
    let geojsonData = sampleAstoriaStreets;
    
    const geojsonPath = path.join(__dirname, 'astoria_streets.geojson');
    if (fs.existsSync(geojsonPath)) {
      console.log('📂 Loading streets from astoria_streets.geojson...');
      geojsonData = JSON.parse(fs.readFileSync(geojsonPath, 'utf-8'));
    } else {
      console.log('📊 Using sample street data (5 streets)...');
      console.log('💡 To use real data, place astoria_streets.geojson in the scripts directory');
    }

    let insertedCount = 0;
    let skippedCount = 0;

    // Process each street feature
    for (const feature of geojsonData.features) {
      if (feature.geometry.type === 'LineString') {
        const name = feature.properties.name || feature.properties.NAME || 'Unnamed Street';
        const streetType = feature.properties.street_type || 
                          feature.properties.highway || 
                          'unknown';
        
        // Calculate approximate length
        const lengthMeters = calculateLineStringLength(feature.geometry.coordinates);
        
        try {
          // Insert street with PostGIS geometry
          const result = await client.query(`
            INSERT INTO astoria_streets (name, street_type, length_meters, geom) 
            VALUES ($1, $2, $3, ST_SetSRID(ST_GeomFromGeoJSON($4), 4326))
            ON CONFLICT (geom) DO NOTHING
            RETURNING id
          `, [
            name,
            streetType,
            Math.round(lengthMeters),
            JSON.stringify(feature.geometry)
          ]);

          if (result.rows.length > 0) {
            insertedCount++;
            console.log(`✅ Inserted: ${name} (${Math.round(lengthMeters)}m)`);
          } else {
            skippedCount++;
            console.log(`⏭️  Skipped: ${name} (already exists)`);
          }
        } catch (insertError) {
          console.error(`❌ Failed to insert ${name}:`, insertError.message);
        }
      }
    }

    // Get final statistics
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_streets,
        COALESCE(SUM(length_meters), 0) as total_length_meters,
        MIN(length_meters) as min_length,
        MAX(length_meters) as max_length,
        AVG(length_meters) as avg_length
      FROM astoria_streets
    `);

    const stats = statsResult.rows[0];
    
    console.log('\n📊 Loading Results:');
    console.log(`✅ Inserted: ${insertedCount} streets`);
    console.log(`⏭️  Skipped: ${skippedCount} streets (duplicates)`);
    console.log(`📈 Total streets in database: ${stats.total_streets}`);
    console.log(`📏 Total length: ${(stats.total_length_meters / 1609.34).toFixed(2)} miles`);
    console.log(`📏 Average street length: ${Math.round(stats.avg_length)}m`);
    
    client.release();
    console.log('\n🎉 Astoria streets loading completed successfully!');
    
  } catch (error) {
    console.error('❌ Error loading Astoria streets:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Instructions for getting real data
function printDataInstructions() {
  console.log('\n📋 How to get real Astoria street data:');
  console.log('1. Go to https://overpass-turbo.eu/');
  console.log('2. Use this query to get Astoria streets:');
  console.log(`
[out:json][timeout:25];
(
  way["highway"]["highway"!="proposed"]
    (40.7500,40.7800,-73.9500,-73.9000);
);
out geom;
  `);
  console.log('3. Export as GeoJSON');
  console.log('4. Save as astoria_streets.geojson in the scripts directory');
  console.log('5. Run this script again\n');
}

// Main execution
if (require.main === module) {
  // Print instructions first
  printDataInstructions();
  
  // Run the loading script
  loadAstoriaStreets()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { loadAstoriaStreets };
