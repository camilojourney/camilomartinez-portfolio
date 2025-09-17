# Scripts Organization

This folder contains all development and maintenance scripts organized by function.

## 📁 Folder Structure

### `data/` - Data Processing & Analysis
- `activity-correlation-etl.ts` - ETL process for cross-platform activity correlations
- `analyze-sleep-data.js` - Sleep data analysis from WHOOP
- `fetch-real-enhanced-data.js` - **Main enhanced Strava data fetcher with real API calls**
- `generate-astoria-base-map.py` - Generate Astoria map visualization
- `get-workout-data.js` - WHOOP workout data extraction
- `load-astoria-streets.js` - Load Astoria street data into database
- `refresh-strava-tokens.js` - Automatic Strava token refresh system
- `run-correlation-etl.js` - Execute activity correlation ETL process
- `simple-historical-import.js` - Historical data import from WHOOP
- `simple-strava-historical.js` - Historical Strava data import
- `strava-historical-import.js` - Complete Strava historical import
- `strava-setup-complete.js` - Strava integration setup
- `strava-sync-status.js` - Check Strava sync status
- `strava-weekly-sync.js` - Weekly Strava data sync
- `test-strava-sync.js` - Test Strava synchronization

### `testing/` - Test & Validation Scripts
- `check-cron-health.js` - Monitor cron job health and execution
- `check-database-schema.js` - Validate database schema
- `check-recent-data.js` - Check for recent data in database
- `check-strava-setup.js` - Validate Strava integration
- `check-whoop-schema.js` - Validate WHOOP database schema
- `get-token.js` - Extract WHOOP access token for API testing
- `simple-strava-check.js` - Simple Strava connection test
- `test-data-insertion.js` - Test database insertion functionality
- `test-single-import.js` - Test single record import
- `test-strava-integration.js` - Complete Strava integration test
- `test-token-status.js` - Check WHOOP token status

### `dev/` - Development Utilities
- `whoop-cli.js` - WHOOP command-line interface

### `db/` - Database Operations
- `apply-migration.js` - Apply database migrations with validation
- `check-vector-support.js` - Verify vector extension support
- `enable-vector-support.js` - Enable PostgreSQL vector extension
- `get-database-schema.js` - Export complete database schema
- `run-strava-migrations.js` - Run all Strava migrations
- `setup-astoria-database.sql` - Initial database setup

## 🚀 Usage

### Most Common Operations

```bash
# Check system health
node scripts/testing/check-cron-health.js
node scripts/testing/check-recent-data.js

# Enhanced data fetching (MAIN PRODUCTION SCRIPT)
node scripts/data/fetch-real-enhanced-data.js

# Monitor integrations
node scripts/data/strava-sync-status.js
node scripts/testing/get-token.js

# Database operations
node scripts/db/get-database-schema.js
node scripts/testing/check-database-schema.js

# Historical data imports
node scripts/data/simple-historical-import.js
node scripts/data/strava-historical-import.js

# Activity correlation ETL
node scripts/data/run-correlation-etl.js
```

### Testing & Debugging

```bash
# Test API connections
node scripts/testing/check-strava-setup.js
node scripts/testing/test-strava-integration.js
node scripts/testing/test-token-status.js

# Database validation
node scripts/testing/check-whoop-schema.js
node scripts/testing/test-data-insertion.js
```

### Development Utilities

```bash
# WHOOP CLI for development
node scripts/dev/whoop-cli.js

# Database migrations
node scripts/db/apply-migration.js
```

## 📝 Notes

- **Run from project root:** All scripts should be executed from the project root directory
- **Environment variables:** Scripts require proper `.env` configuration
- **Database scripts:** Ensure database connection is available
- **Token scripts:** WHOOP scripts require valid authentication tokens
- **Import paths:** Scripts use relative imports: `../../src/lib/...`

## 🔧 Recent Updates (September 2025)

- **Enhanced Data Collection:** Added `fetch-real-enhanced-data.js` as main production script for Strava data with coordinates, splits, and enhanced metrics
- **Script Organization:** Reorganized scripts into logical categories (data/, testing/, db/, dev/)
- **Cleaned up:** Removed obsolete debugging scripts and temporary files
- **Activity Correlations:** Added ETL process for cross-platform activity matching
- **Updated:** Added cron health monitoring and enhanced token management tools
