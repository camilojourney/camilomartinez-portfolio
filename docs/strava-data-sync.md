# Strava Data Synchronization System

This document describes Phase 2 of the Strava integration - the comprehensive data population system that builds on the existing authentication infrastructure.

## Overview

The Strava Data Sync system provides two main synchronization modes:

1. **Historical Import** - One-time import of all historical running data
2. **Weekly Sync** - Ongoing incremental sync of new activities

## Architecture

### Phase 1: Authentication (Already Complete)
- OAuth flow with Strava
- Token management and refresh
- User profile storage
- API client with rate limiting

### Phase 2: Data Population (This System)
- Historical data import service
- Weekly incremental sync service
- Progress tracking and error handling
- CLI scripts and API endpoints

## Database Schema

The system populates the `strava_runs` table with this structure:

```sql
CREATE TABLE strava_runs (
    id BIGINT PRIMARY KEY,                        -- Strava activity ID
    user_id BIGINT REFERENCES strava_users(id),   -- FK to athlete
    name VARCHAR(255),                            -- Activity name
    sport_type VARCHAR(50),                       -- Run, Ride, etc.
    start_date TIMESTAMP WITH TIME ZONE,          -- When the run started
    distance_meters DOUBLE PRECISION,             -- Total distance
    summary_polyline TEXT,                        -- Encoded polyline (for quick draw)
    detailed_polyline TEXT,                       -- Optional: higher fidelity
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Components

### Core Services

1. **`HistoricalDataImporter`** - Imports all historical running data
2. **`WeeklySyncService`** - Syncs new activities incrementally  
3. **`StravaDataSyncCoordinator`** - Unified interface for both services

### CLI Scripts

1. **`scripts/data/strava-historical-import.js`** - Historical import CLI
2. **`scripts/data/strava-weekly-sync.js`** - Weekly sync CLI

### API Endpoints

1. **`/api/strava/sync-status`** - Get sync status and statistics
2. **`/api/strava/sync/historical`** - Trigger historical import
3. **`/api/strava/sync/weekly`** - Trigger weekly sync

## Usage

### Initial Setup (Historical Import)

Run the historical import to populate all past running data:

```bash
# Import for all users
node scripts/data/strava-historical-import.js

# Import for specific user
node scripts/data/strava-historical-import.js 12345
```

Or via API:

```bash
# Import all users
curl -X POST http://localhost:3000/api/strava/sync/historical

# Import specific user
curl -X POST http://localhost:3000/api/strava/sync/historical \
  -H "Content-Type: application/json" \
  -d '{"userId": 12345}'
```

### Ongoing Sync (Weekly)

Set up weekly sync to keep data current:

```bash
# Manual weekly sync
node scripts/data/strava-weekly-sync.js

# Cron job (every Monday at 6 AM)
0 6 * * 1 /usr/bin/node /path/to/scripts/data/strava-weekly-sync.js
```

Or via API:

```bash
# Sync all users
curl -X POST http://localhost:3000/api/strava/sync/weekly

# Sync specific user  
curl -X POST http://localhost:3000/api/strava/sync/weekly \
  -H "Content-Type: application/json" \
  -d '{"userId": 12345}'
```

### Check Sync Status

Monitor sync progress and statistics:

```bash
# Get current sync status
curl http://localhost:3000/api/strava/sync-status
```

## Features

### Rate Limiting & Reliability
- Respects Strava API rate limits (600 requests per 15 minutes)
- Configurable delays between requests and batches
- Automatic retry on transient failures
- Graceful error handling and recovery

### Progress Tracking
- Real-time progress callbacks
- Detailed error reporting
- Performance metrics and statistics
- Comprehensive logging

### Polyline Handling
- Fetches detailed polylines when available
- Falls back to summary polylines
- Proper encoding for GPS accuracy
- Optimized for map visualization

### Batch Processing
- Configurable batch sizes for optimal performance
- Memory-efficient processing of large datasets
- Parallel processing where appropriate

## Configuration

### Environment Variables

Required environment variables:

```bash
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_REFRESH_TOKEN=your_refresh_token  # For automated scripts
DATABASE_URL=your_database_connection_string
```

### Sync Options

Both historical and weekly sync accept these options:

```typescript
interface SyncOptions {
  maxActivitiesPerBatch?: number;     // Default: 30 (historical), 50 (weekly)
  delayBetweenBatches?: number;       // Default: 1000ms (historical), 500ms (weekly)  
  maxRetries?: number;                // Default: 3
  onProgress?: (progress) => void;    // Progress callback
}
```

## Monitoring

### Sync Status Response

The `/api/strava/sync-status` endpoint returns:

```json
{
  "status": "success",
  "data": {
    "lastSyncDate": "2024-01-15T10:30:00Z",
    "totalRuns": 1250,
    "totalUsers": 5,
    "averageRunsPerUser": 250,
    "needsHistoricalImport": false,
    "recommendations": {
      "nextWeeklySync": "2024-01-22T06:00:00Z",
      "actions": ["Continue weekly sync schedule"]
    }
  }
}
```

### Progress Tracking

Sync operations provide real-time progress:

```json
{
  "userId": 12345,
  "totalActivities": 500,
  "processedActivities": 250,
  "successfulImports": 248,
  "errors": ["Activity 123 failed: Rate limit exceeded"],
  "status": "running",
  "startTime": "2024-01-15T10:00:00Z"
}
```

## Error Handling

### Common Issues

1. **Rate Limit Exceeded**
   - Automatic backoff and retry
   - Configurable delays between requests
   - Conservative default settings

2. **Token Expiration**
   - Automatic token refresh using stored refresh tokens
   - Graceful handling of authentication failures

3. **Network Issues**
   - Retry logic for transient failures
   - Detailed error logging for debugging

4. **Data Issues**
   - Skip activities without GPS data
   - Handle malformed polylines gracefully
   - Continue processing despite individual failures

### Troubleshooting

If sync fails, check:

1. Strava API credentials in environment variables
2. Database connectivity and schema
3. Valid tokens in `strava_users` table
4. Strava API rate limit status
5. Network connectivity to Strava

## Performance

### Historical Import
- **Rate**: ~20-30 activities per minute (respecting API limits)
- **Memory**: Processes activities in configurable batches
- **Duration**: ~30-60 minutes for 1000 activities per user

### Weekly Sync  
- **Rate**: ~40-60 activities per minute (more aggressive for recent data)
- **Memory**: Minimal - only processes new activities
- **Duration**: Usually under 5 minutes for typical weekly activity

### Optimization Tips

1. **Batch Size**: Larger batches = faster processing, but higher memory usage
2. **Delays**: Shorter delays = faster sync, but higher chance of rate limiting
3. **Timing**: Run during off-peak hours to avoid API congestion
4. **Incremental**: Use weekly sync instead of re-running historical import

## Integration with Astoria Conquest

The synced data is automatically available for:

1. **Street Coverage Analysis** - Uses GPS polylines to calculate which streets have been run
2. **Progress Tracking** - Shows completion percentages and statistics  
3. **Map Visualization** - Renders routes on the interactive Astoria map
4. **Analytics** - Provides insights into running patterns and achievements

## Next Steps

After setting up the sync system:

1. **Schedule Weekly Sync** - Set up cron job for ongoing data updates
2. **Monitor Performance** - Use API endpoints to track sync health
3. **Optimize Settings** - Adjust batch sizes and delays based on usage
4. **Add Webhooks** - Consider Strava webhooks for real-time updates (future enhancement)

## Support

For issues or questions:

1. Check logs from CLI scripts for detailed error information
2. Use `/api/strava/sync-status` to verify system health
3. Review Strava API documentation for rate limits and requirements
4. Check database connectivity and schema integrity
