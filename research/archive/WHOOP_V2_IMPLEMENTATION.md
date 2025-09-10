# WHOOP API v2 Implementation Notes

## Overview

This document provides details about how the WHOOP API v2 integration is implemented in this project. It covers key aspects of the API, known issues, and the strategy used for data collection.

## Key Components

1. **API Client**: `lib/whoop-client.ts`
   - Implements the WhoopV2Client class for interacting with WHOOP API v2
   - Handles authentication, pagination, and API requests

2. **Database Service**: `lib/whoop-database.ts`
   - Manages data storage and retrieval from the Postgres database
   - Implements upsert operations for all WHOOP data types

3. **Collection Endpoint**: `app/api/whoop-collector-v2/route.ts`
   - Optimized implementation that handles data collection
   - Supports both daily and historical collection modes

4. **Dashboard UI**: `app/whoop-dashboard/page.tsx`
   - Provides interface for initiating data collection
   - Displays collection status and results

## WHOOP API v2 Notes

### Working Endpoints

The following endpoints work reliably:

- `/v2/user/profile/basic` - User profile data
- `/v2/cycle` - Collection of all cycles
- `/v2/activity/sleep` - Collection of all sleep records
- `/v2/recovery` - Collection of all recovery records
- `/v2/activity/workout` - Collection of all workout records
- `/v2/cycle/{cycleId}/recovery` - Recovery for specific cycle

### Known Issues

- **`/v2/cycle/{cycleId}/sleep` Endpoint**: This endpoint consistently returns 404 errors and cannot be used. Instead, we collect all sleep data using the `/v2/activity/sleep` endpoint.

### Collection Strategy

Our optimized strategy:

1. Collect all cycles using `/v2/cycle` with pagination
2. Collect all sleep data using `/v2/activity/sleep` with pagination
3. Collect all recovery data using `/v2/recovery` with pagination
4. Collect all workout data using `/v2/activity/workout` with pagination

This approach avoids the problematic `/v2/cycle/{cycleId}/sleep` endpoint and ensures we get all available data.

### Database Schema Considerations

- The `whoop_sleep` table has a nullable `cycle_id` column since we cannot reliably associate sleep records with cycles due to the API limitations
- Sleep and workout IDs use the UUID format in v2, different from the integer format in v1

## Usage

To collect WHOOP data:

1. Visit the WHOOP Dashboard page
2. Use "Start Historical Collection" for all historical data
3. Use "Start Daily Collection" for recent data (last 3 days)

## Troubleshooting

If you encounter issues:

1. Check the server logs for API errors
2. Verify that the database schema matches `database-schema-v2.sql`
3. Ensure the user has authenticated with WHOOP and granted all required scopes
