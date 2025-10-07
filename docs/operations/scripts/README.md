# 🔧 Scripts Organization

> **Last Updated**: October 7, 2025
> **Purpose**: Development utilities, testing tools, and database administration

**⚠️ Important**: Most automated workflows have been migrated to **Celery Workers** in `backend/app/workers/`. See [`docs/backend/workers/README.md`](../../backend/workers/README.md) for details.

---

## 📁 Folder Structure

### `one-off/` - Special Purpose Scripts 🔨

**One-time or special-purpose tasks**:

- `generate_astoria_base_map.py` - Generate Astoria street network base map (one-time setup)
- `update_astoria_progress.py` - Update Astoria conquest progress (called by Celery task)
- `analyze-sleep-data.js` - Analyze WHOOP sleep patterns and trends

**Usage Pattern**: Run for specific tasks, analysis, or initial setup. The Astoria scripts are integrated with the Celery worker pipeline.

```bash
# Example: Generate initial Astoria map
python scripts/one-off/generate_astoria_base_map.py

# Example: Analyze sleep data
node scripts/one-off/analyze-sleep-data.js
```

---

### `db/` - Database Operations 🗄️

**Database utilities** for migrations, schema management, and setup:

- `apply-migration.js` - Apply SQL migrations to database
- `run-migration.js` - Run specific migration files
- `get-database-schema.js` - Export complete database schema
- `check-vector-support.js` - Verify pgvector extension support
- `enable-vector-support.js` - Enable PostgreSQL vector extension
- `enable-postgis.js` - Enable PostGIS extension

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
# 🔍 Health Checks & Diagnostics
node scripts/testing/check-recent-data.js
node scripts/testing/check-database-schema.js
node scripts/testing/diagnose-whoop-cron.js

# 🗄️ Database Operations
node scripts/db/get-database-schema.js
node scripts/db/check-vector-support.js

# 🗺️ Astoria Conquest Setup
python scripts/one-off/generate_astoria_base_map.py
python scripts/one-off/update_astoria_progress.py
```

---

## 🔄 Migrated to Celery Workers

The following automated workflows have been **migrated to Celery** (no longer in scripts/):

| Old Script | New Location | Schedule |
|-----------|--------------|----------|
| `strava-weekly-sync.js` | `app.workers.tasks.strava.sync_strava_weekly` | Mon 1:00 PM |
| `activity-correlation-etl.js` | `app.workers.tasks.strava.correlate_activities` | Mon 1:15 PM |
| `refresh-materialized-views.js` | `app.workers.tasks.database.refresh_materialized_views` | Daily 2:00 AM |
| `refresh-strava-tokens.js` | **Not needed** (automatic in sync) | N/A |

**See**: [`docs/backend/workers/README.md`](../../backend/workers/README.md) for the complete Celery worker documentation.

**How to run tasks manually**:
```bash
# From backend directory
cd backend

# Run specific task
poetry run python -c "
from app.workers.tasks.strava import sync_strava_weekly
result = sync_strava_weekly()
print(result)
"
```

---

## 📋 Best Practices

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

### Migration to Celery Workers
- ✅ **Migrated** all automated pipelines to Celery workers (`backend/app/workers/`)
- ✅ **Deleted** `scripts/pipelines/` directory (5 files)
- ✅ **Deleted** obsolete one-off scripts (4 files)
- ✅ **Retained** useful testing, database, and special-purpose scripts (20 files)

### Why Celery?
- ⚡ **Automatic scheduling** via Celery Beat (no manual cron setup)
- 🔄 **Built-in retries** and error handling
- 📊 **Monitoring** with Flower dashboard
- 🚀 **Scalability** with horizontal worker scaling
- 🐍 **Consistency** - all Python (no JS/Python mixing)

---

*For automated workflows and scheduled tasks, see [`docs/backend/workers/README.md`](../../backend/workers/README.md).*
