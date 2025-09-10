# Scripts Organization

This folder contains all development and maintenance scripts organized by function.

## 📁 Folder Structure

### `data/` - Data Processing & Analysis
- `analyze-sleep-data.js` - Sleep data analysis from WHOOP
- `get-workout-data.js` - Fetch workout data from APIs
- `load-astoria-streets.js` - Load Astoria street data into database

### `testing/` - Test & Validation Scripts
- `check-database-schema.js` - Validate database schema
- `check-recent-data.js` - Check for recent data in database
- `check-strava-setup.js` - Validate Strava integration
- `check-whoop-schema.js` - Validate WHOOP database schema
- `simple-strava-check.js` - Simple Strava connection test
- `test-data-insertion.js` - Test database insertion functionality
- `test-strava-integration.js` - Complete Strava integration test
- `test-token-status.js` - Check WHOOP token status

### `dev/` - Development Utilities
- `debug-token-values.js` - Debug authentication tokens
- `manual-token-store.js` - Manually store tokens
- `store-env-token.js` - Store environment tokens
- `whoop-cli.js` - WHOOP command-line interface

### `db/` - Database Operations
- `migrate-add-tokens.js` - Add token fields to database
- `run-strava-migration.js` - Run Strava database migration
- `setup-astoria-database.sql` - Initial database setup
- `setup-user-tokens.js` - Setup user token tables

## 🚀 Usage

Run scripts using npm commands:

```bash
# Data operations
npm run data:analyze-sleep
npm run data:load-streets
npm run data:get-workouts

# Testing
npm run test:strava
npm run test:whoop
npm run test:db-schema

# Development
npm run dev:whoop-cli
npm run check:strava
npm run check:recent-data

# Database
npm run db:setup
npm run db:migrate
```

Or run directly:

```bash
# From project root
node scripts/data/analyze-sleep-data.js
node scripts/testing/test-strava-integration.js
node scripts/dev/whoop-cli.js
```

## 📝 Notes

- All scripts should be run from the project root directory
- Scripts importing from `src/lib` use relative paths: `../../src/lib/...`
- Database scripts require proper environment variables
- Test scripts validate integrations and data integrity
