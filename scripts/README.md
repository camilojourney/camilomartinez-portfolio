# 🔧 Scripts Organization

> **Last Updated**: October 2, 2025  
> **Purpose**: Automation, data pipelines, and maintenance utilities

All scripts are organized by their purpose and usage pattern. Standardized on JavaScript/Python for consistency with the backend ecosystem.

---

## 📁 Folder Structure

### `pipelines/` - Repeatable Data Workflows ⚙️

**Scheduled, repeatable processes** that run regularly (cron jobs, automated syncs):

- `strava-weekly-sync.js` - **Weekly Strava data synchronization** (scheduled)
- `refresh-strava-tokens.js` - **Automatic Strava OAuth token refresh** (scheduled)
- `activity-correlation-etl.js` - **ETL for cross-platform activity correlations**
- `run-correlation-etl.js` - **Execute correlation ETL pipeline**
- `refresh-materialized-views.js` - **Refresh database materialized views** (scheduled)

**Usage Pattern**: These scripts are designed to run automatically on a schedule. They are idempotent and can be run repeatedly safely.

```bash
# Example: Run weekly Strava sync
node scripts/pipelines/strava-weekly-sync.js

# Example: Refresh database views
node scripts/pipelines/refresh-materialized-views.js
```

---

### `one-off/` - Data Fixes & Analysis 🔨

**One-time tasks** for data analysis, historical imports, and special projects:

- `analyze-sleep-data.js` - Analyze WHOOP sleep patterns and trends
- `fetch-all-strava-data-complete-with-splits.js` - Complete historical Strava import
- `fix-sleep-cycle-relationships.js` - One-time fix for sleep-cycle foreign keys
- `load-astoria-streets.js` - Load Astoria street network data
- `export-astoria-street-network.py` - Export Astoria map data
- `generate_astoria_base_map.py` - Generate Astoria base map visualization
- `update_astoria_progress.py` - Update Astoria conquest progress

**Usage Pattern**: Run once for specific tasks, data migrations, or analysis. Not designed for repeated execution.

```bash
# Example: Analyze sleep data
node scripts/one-off/analyze-sleep-data.js

# Example: Generate Astoria map
python scripts/one-off/generate_astoria_base_map.py
```

---

### `db/` - Database Operations 🗄️

**Database utilities** for migrations, schema management, and setup:

- `apply-migration.js` - Apply SQL migrations to database
- `run-migration.js` - Run specific migration files
- `get-database-schema.js` - Export complete database schema
- `check-vector-support.js` - Verify pgvector extension support
- `enable-vector-support.js` - Enable PostgreSQL vector extension
- `enable-postgis.js` - Enable PostGIS extension (legacy)
- `setup-astoria-database.sql` - Initial Astoria database setup

**Usage Pattern**: Database administration and schema management. Use sparingly and with caution.

```bash
# Example: Export current schema
node scripts/db/get-database-schema.js

# Example: Check vector support
node scripts/db/check-vector-support.js
```

**Note**: For standard migrations, use Alembic in `/backend/alembic/`. These scripts are for special database operations only.

---

### `testing/` - Testing & Debugging 🧪

**Validation, debugging, and development tools**:

- `check-database-schema.js` - Validate database schema integrity
- `check-rate-limit.js` - Test rate limiting functionality
- `check-recent-data.js` - Verify recent data in database
- `diagnose-whoop-cron.js` - Diagnose WHOOP sync cron job issues
- `debug-strava-response.js` - Debug Strava API responses
- `activity-correlation.js` - Test activity correlation logic
- `whoop-cli.js` - **WHOOP CLI for development** (interactive)

**Usage Pattern**: Development and debugging. Run as needed to test functionality or diagnose issues.

```bash
# Example: Check recent data
node scripts/testing/check-recent-data.js

# Example: Test rate limiting
node scripts/testing/check-rate-limit.js

# Example: WHOOP CLI
node scripts/testing/whoop-cli.js
```

---

## 🚀 Quick Reference

### Most Common Operations

```bash
# 📊 Data Sync (Scheduled)
node scripts/pipelines/strava-weekly-sync.js
node scripts/pipelines/refresh-strava-tokens.js
node scripts/pipelines/refresh-materialized-views.js

# 🔍 Health Checks & Diagnostics
node scripts/testing/check-recent-data.js
node scripts/testing/check-database-schema.js
node scripts/testing/diagnose-whoop-cron.js

# 🗄️ Database Operations
node scripts/db/get-database-schema.js
node scripts/db/check-vector-support.js

# 🔨 One-Time Tasks
node scripts/one-off/analyze-sleep-data.js
python scripts/one-off/generate_astoria_base_map.py
```

---

## 📋 Best Practices

### When to Use Each Category

| Category | Use When | Examples |
|----------|----------|----------|
| **pipelines/** | Setting up scheduled jobs, automating regular tasks | Cron jobs, nightly syncs, view refreshes |
| **one-off/** | Historical imports, data fixes, special analyses | Migration scripts, data backfills |
| **db/** | Database admin tasks | Schema exports, extension setup |
| **testing/** | Debugging issues, validating functionality | Checking sync status, diagnosing problems |

### Running Scripts

**All scripts should be run from the project root:**
```bash
cd /Users/camilo/camilomartinez-portfolio
node scripts/[category]/[script-name].js
```

**Environment Requirements:**
- ✅ Valid `.env` file with all required variables
- ✅ Database connection available
- ✅ API tokens valid (for integration scripts)

---

## 🔧 Recent Changes (October 2025)

### Reorganization Summary
- ✅ **Consolidated** from 4 folders (data/, db/, dev/, testing/) to 4 organized categories (pipelines/, one-off/, db/, testing/)
- ✅ **Clarified purpose** of each script category
- ✅ **Moved repeatable workflows** to `pipelines/` (5 scripts)
- ✅ **Moved one-time tasks** to `one-off/` (7 scripts)  
- ✅ **Retained database utilities** in `db/` (8 scripts)
- ✅ **Enhanced testing tools** in `testing/` (7 scripts)

### Why This Structure?
This organization makes it immediately clear:
- **What runs automatically** (pipelines)
- **What's for special tasks** (one-off)
- **What's for database work** (db)
- **What's for debugging** (testing)

---

*For database schema migrations, use Alembic in `/backend/alembic/` instead of these scripts.*

