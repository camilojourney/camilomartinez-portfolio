# 🗺️ Astoria Conquest Feature Documentation

A comprehensive geospatial running tracker that visualizes progress toward running every street in Astoria, Queens. This feature integrates with Strava to automatically track running activities and uses PostGIS for advanced geospatial analysis.

## 🎯 Overview

The Astoria Conquest feature demonstrates:
- **Real-time Data Integration**: Automatic Strava activity synchronization
- **Geospatial Analysis**: PostGIS-powered street coverage calculations  
- **Interactive Visualization**: Map-based progress tracking
- **Scalable Architecture**: Production-ready with automated cron jobs

### Key Features

- 📱 **Automated Data Collection**: Daily sync from Strava API
- 🗺️ **Interactive Map**: Real-time street completion visualization
- 📊 **Progress Analytics**: Completion percentage, distance tracking, monthly goals
- 🔄 **Incremental Sync**: Efficient updates with only new activities
- 🏗️ **Production Ready**: Error handling, rate limiting, monitoring

## 🏗️ Architecture Overview

### Database Layer (PostGIS)
```sql
-- Street network with geospatial indexing
astoria_streets (id, name, street_type, geom, length_meters)

-- Running activities with GPS tracks  
strava_runs (activity_id, run_date, geom, distance_meters, ...)

-- Sync monitoring and debugging
strava_sync_log (id, sync_type, activities_processed, ...)
```

### API Layer
```
/api/astoria-conquest        # Main data endpoint (GeoJSON + stats)
/api/strava/auth            # OAuth authentication flow
/api/strava/sync            # Manual data synchronization
/api/cron/strava-sync       # Automated daily sync (Vercel Cron)
```

### Frontend Components
```
/astoria-conquest           # Main page with interactive map
├── AstoriaRunMap          # Leaflet.js map component
├── ProgressDashboard      # Statistics and progress tracking
└── DataCollectionTools    # Admin tools for data management
```

## 🚀 Setup Instructions

### 1. Database Setup

First, ensure PostGIS is enabled in your Vercel Postgres database:

```sql
-- Connect to your database and run:
CREATE EXTENSION IF NOT EXISTS postgis;
```

Then run the setup script:

```bash
# Set up database tables and indexes
psql $POSTGRES_URL -f src/scripts/setup-astoria-database.sql
```

### 2. Environment Variables

Add these to your `.env.local`:

```bash
# Strava API Configuration
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret  
STRAVA_REFRESH_TOKEN=your_personal_refresh_token

# Database (from Vercel)
POSTGRES_URL=your_vercel_postgres_url

# Security
CRON_SECRET=your_random_cron_secret
NEXTAUTH_URL=http://localhost:3000  # or your domain
NEXTAUTH_SECRET=your_nextauth_secret
```

### 3. Street Data Loading

Load the Astoria street network:

```bash
# Using sample data (for testing)
node -r dotenv/config src/scripts/load-astoria-streets.js

# For real data:
# 1. Get GeoJSON from OpenStreetMap (see script for instructions)
# 2. Save as src/scripts/astoria_streets.geojson
# 3. Run the script again
```

### 4. Strava Authentication

Get your personal refresh token for automated sync:

1. Visit `/api/strava/auth` to get the OAuth URL
2. Complete the OAuth flow to get tokens
3. Add your `refresh_token` to the environment variables

## 📊 Data Flow

### Initial Data Collection

```bash
# Manual sync for initial data load
curl -X POST http://localhost:3000/api/strava/sync \
  -H "Content-Type: application/json" \
  -d '{"daysBack": 90, "forceFullSync": true}'
```

### Automated Daily Sync

Set up Vercel Cron in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/strava-sync",
      "schedule": "0 14 * * *"
    }
  ]
}
```

### Data Processing Pipeline

1. **Fetch**: Get new activities from Strava API
2. **Decode**: Convert polylines to GPS coordinates  
3. **Store**: Upsert activities with PostGIS geometry
4. **Analyze**: Calculate street coverage using spatial intersections
5. **Visualize**: Serve GeoJSON for map rendering

## 🗺️ Map Visualization

### Street Status Colors

- 🟢 **Green**: Completed (≥80% coverage)
- 🟡 **Yellow**: Partial (1-79% coverage)  
- ⚪ **Gray**: Unvisited (0% coverage)
- 🔵 **Blue**: Your running tracks

### Interactive Features

- **Zoom**: Explore different neighborhoods
- **Click**: View street details and completion status
- **Layer Toggle**: Show/hide running tracks vs. street network
- **Progress Filter**: Filter by completion status

## 📈 Analytics & Statistics

### Core Metrics

```typescript
interface AstoriaStats {
  totalStreets: number              // Total streets in Astoria
  completedStreets: number          // Streets with ≥80% coverage
  partialStreets: number            // Streets with partial coverage
  completionPercentage: number      // Overall progress %
  totalDistanceMeters: number       // Total length of all streets
  completedDistanceMeters: number   // Distance completed
  totalRunsCount: number            // Number of tracked runs
  monthlyProgressPercentage: number // This month's progress
}
```

### Geospatial Calculations

The system uses PostGIS for accurate calculations:

```sql
-- Street completion percentage
SELECT 
  street_name,
  (ST_Length(ST_Intersection(street_geom, runs_union)) / ST_Length(street_geom) * 100) as coverage_pct
FROM astoria_streets s
LEFT JOIN (SELECT ST_Union(geom) as runs_union FROM strava_runs) r ON true
```

## 🔧 API Endpoints

### Data Retrieval

**GET `/api/astoria-conquest`**
```javascript
// Response
{
  "allStreetsGeoJSON": { /* FeatureCollection */ },
  "runGeometriesGeoJSON": { /* FeatureCollection */ },
  "stats": { /* AstoriaStats */ }
}
```

**Query Parameters:**
- `includeRuns=false` - Skip run geometries for faster loading
- `skipStats=true` - Skip statistics calculation

### Manual Sync

**POST `/api/strava/sync`**
```javascript
// Request body
{
  "daysBack": 30,          // Days of history to sync
  "forceFullSync": false,  // Force full resync
  "accessToken": "..."     // Optional: custom token
}
```

### Authentication

**GET `/api/strava/auth`**
```javascript
// Response
{
  "authUrl": "https://www.strava.com/oauth/authorize?...",
  "state": "astoria-conquest"
}
```

## 🛠️ Development Tools

### Local Testing

```bash
# Start development server
pnpm dev

# Test API endpoints
curl http://localhost:3000/api/astoria-conquest

# Manual data sync
curl -X POST http://localhost:3000/api/strava/sync \
  -H "Content-Type: application/json" \
  -d '{"daysBack": 7}'
```

### Database Monitoring

```sql
-- Check data health
SELECT 
  (SELECT COUNT(*) FROM astoria_streets) as streets_count,
  (SELECT COUNT(*) FROM strava_runs) as runs_count,
  (SELECT MAX(run_date) FROM strava_runs) as latest_run;

-- View recent sync logs
SELECT * FROM strava_sync_log 
ORDER BY sync_start_time DESC 
LIMIT 5;
```

### Performance Optimization

- **Spatial Indexing**: GIST indexes on geometry columns
- **Incremental Sync**: Only fetch new activities after last sync
- **API Caching**: 5-minute cache on data endpoints
- **Rate Limiting**: Respect Strava API limits (100 requests/15min)

## 🚨 Error Handling

### Common Issues

1. **Rate Limit Exceeded**
   - Wait for rate limit reset (15 minutes)
   - Check current usage in API response headers

2. **Invalid Polyline Data**
   - Skip malformed activities
   - Log errors for debugging

3. **PostGIS Errors**
   - Validate geometry before insert
   - Handle topology exceptions gracefully

### Monitoring

Check sync logs for errors:

```sql
SELECT sync_type, error_message, sync_start_time 
FROM strava_sync_log 
WHERE error_message IS NOT NULL 
ORDER BY sync_start_time DESC;
```

## 🔮 Future Enhancements

### Phase 2 Features

- **Neighborhood Analysis**: Break down progress by Astoria neighborhoods
- **Achievement System**: Badges for milestones (10%, 25%, 50%, etc.)
- **Social Features**: Share progress with other runners
- **Route Planning**: Suggest optimal routes for uncovered streets

### Technical Improvements

- **Real-time Updates**: WebSocket integration for live progress
- **Mobile App**: React Native app with offline map support
- **AI Route Optimization**: ML-powered efficient route suggestions
- **Performance Analytics**: Speed, elevation, weather correlations

## 📋 Deployment Checklist

- [ ] Database tables created with PostGIS
- [ ] Street network data loaded
- [ ] Environment variables configured
- [ ] Strava OAuth setup completed
- [ ] Vercel Cron jobs configured
- [ ] Initial data sync completed
- [ ] Map components working locally
- [ ] API endpoints tested
- [ ] Error monitoring setup

## 🤝 Contributing

This feature demonstrates advanced full-stack development patterns:

- **Geospatial Data Processing**: PostGIS integration
- **API Design**: RESTful endpoints with proper error handling
- **Real-time Sync**: Automated data collection with cron jobs
- **Interactive Visualization**: Modern map interfaces
- **Production Architecture**: Scalable, monitored, secure

The codebase serves as a reference for building production-ready geospatial applications with Next.js and PostGIS.

---

*Part of the Camilo Martinez Portfolio - showcasing AI development, data analytics, and full-stack engineering expertise.*
