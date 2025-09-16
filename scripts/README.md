# Scripts Organization

This folder contains all development and maintenance scripts organized by function.

## 📁 Folder Structure

### `data/` - Data Processing & Analysis
- `analyze-sleep-data.js` - Sleep data analysis from WHOOP
- `simple-historical-import.js` - Historical data import from WHOOP
- `simple-strava-historical.js` - Historical Strava data import
- `strava-historical-import.js` - Complete Strava historical import
- `strava-setup-complete.js` - Strava integration setup
- `strava-sync-status.js` - Check Strava sync status
- `strava-weekly-sync.js` - Weekly Strava data sync
- `load-astoria-streets.js` - Load Astoria street data into database
- `generate-astoria-base-map.py` - Generate Astoria map visualization

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
- `debug-token-values.js` - Debug authentication tokens
- `manual-token-store.js` - Manually store tokens
- `store-env-token.js` - Store environment tokens
- `whoop-cli.js` - WHOOP command-line interface

### `db/` - Database Operations
- `check-vector-support.js` - Verify vector extension support
- `enable-vector-support.js` - Enable PostgreSQL vector extension
- `fix-column-naming.js` - Fix database column naming issues
- `get-database-schema.js` - Export complete database schema
- `migrate-add-tokens.js` - Add token fields to database
- `run-migration.js` - Run general database migrations
- `run-recovery-cycles-migration.js` - Run WHOOP recovery cycles migration
- `run-relationship-migration.js` - Run WHOOP relationship migration
- `run-strava-migration.js` - Run Strava database migration
- `run-strava-migrations.js` - Run all Strava migrations
- `setup-astoria-database.sql` - Initial database setup
- `setup-user-tokens.js` - Setup user token tables

## 🚀 Usage

### Most Common Operations

```bash
# Check system health
node scripts/testing/check-cron-health.js
node scripts/testing/check-recent-data.js

# Monitor integrations
node scripts/data/strava-sync-status.js
node scripts/testing/get-token.js

# Database operations
node scripts/db/get-database-schema.js
node scripts/testing/check-database-schema.js

# Historical data imports
node scripts/data/simple-historical-import.js
node scripts/data/strava-historical-import.js
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
node scripts/db/run-migration.js
node scripts/db/setup-user-tokens.js
```

## 📝 Notes

- **Run from project root:** All scripts should be executed from the project root directory
- **Environment variables:** Scripts require proper `.env` configuration
- **Database scripts:** Ensure database connection is available
- **Token scripts:** WHOOP scripts require valid authentication tokens
- **Import paths:** Scripts use relative imports: `../../src/lib/...`

## 🔧 Recent Updates (September 2025)

- **Cleaned up:** Removed temporary debugging scripts from zone data fix
- **Organized:** Kept only production-useful utilities
- **Updated:** Added cron health monitoring and token extraction tools
