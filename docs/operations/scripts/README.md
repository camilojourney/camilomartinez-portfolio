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

- `get-database-schema.js` - Export complete database schema
- `check-vector-support.js` - Verify pgvector extension support
- `enable-vector-support.js` - Enable PostgreSQL vector extension
- `enable-postgis.js` - Enable PostGIS extension
- `setup-astoria-database.sql` - Create Astoria-specific tables and materialized views

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

## 📊 Audit Snapshot

- **Total active scripts:** 15 (12 JavaScript, 2 Python, 1 SQL).
- **Automation migrated to Celery:** 5 tasks now live in `backend/app/workers/`.
- **Deprecated scripts:** Legacy `scripts/pipelines/*.js` set retired during the Celery migration.
- **Ownership:** Camilo Martinez · Keep aligned with backend worker schedules.

| Category | Active | Language Mix | Notes |
|----------|--------|--------------|-------|
| One-off Utilities | 3 | 2× Python, 1× JavaScript | Astoria project setup + WHOOP analysis |
| Database Admin | 5 | 4× JavaScript, 1× SQL | Extension enablement, schema exports, validation |
| Testing & Diagnostics | 7 | 7× JavaScript | Rate limits, WHOOP/Strava debugging, data freshness |
| Pipelines | 0 | — | Replaced by Celery workers |

### 🎛️ Active Inventory

| Script | Language | Category | Purpose |
|--------|----------|----------|---------|
| `scripts/one-off/generate_astoria_base_map.py` | Python | One-off | Build base GeoJSON map for Astoria conquest project. |
| `scripts/one-off/update_astoria_progress.py` | Python | One-off | Refresh covered streets + stats (invoked by Celery). |
| `scripts/one-off/analyze-sleep-data.js` | JavaScript | One-off | Exploratory WHOOP sleep analysis. |
| `scripts/db/enable-vector-support.js` | JavaScript | Database | Install the pgvector extension. |
| `scripts/db/enable-postgis.js` | JavaScript | Database | Install the PostGIS extension. |
| `scripts/db/check-vector-support.js` | JavaScript | Database | Verify pgvector availability. |
| `scripts/db/get-database-schema.js` | JavaScript | Database | Export a schema snapshot for docs and audits. |
| `scripts/db/setup-astoria-database.sql` | SQL | Database | Seed Astoria-specific tables and views. |
| `scripts/testing/check-database-schema.js` | JavaScript | Testing | Validate that critical tables/views exist. |
| `scripts/testing/check-rate-limit.js` | JavaScript | Testing | Exercise rate limiting middleware. |
| `scripts/testing/check-recent-data.js` | JavaScript | Testing | Inspect the latest WHOOP/Strava data ingests. |
| `scripts/testing/diagnose-whoop-cron.js` | JavaScript | Testing | Investigate WHOOP cron job issues. |
| `scripts/testing/debug-strava-response.js` | JavaScript | Testing | Inspect and log raw Strava API payloads. |
| `scripts/testing/activity-correlation.js` | JavaScript | Testing | Test Strava ↔ WHOOP correlation logic. |
| `scripts/testing/whoop-cli.js` | JavaScript | Testing | Manual WHOOP CLI for quick sync/testing. |

---

## 🔗 Connection Maps

### Astoria Conquest Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│  STEP 1: Initial Setup (One-time)                             │
└──────────────────────────────────────────────────────────────┘
    ↓
    python scripts/one-off/generate_astoria_base_map.py
    ↓
    Creates:
      - backend/data/astoria-conquest/cache/astoria_graph.pkl
      - public/data/astoria-conquest/astoria-base-map.geojson

┌──────────────────────────────────────────────────────────────┐
│  STEP 2: Weekly Update (Automated via Celery)                │
└──────────────────────────────────────────────────────────────┘
    ↓
    Celery Task: `app.workers.tasks.astoria.update_progress`
    ↓
    Calls: `backend/app/scripts/astoria/update_progress.py`
    ↓
    Queries:
      - `strava_runs.detailed_polyline`
      - `activity_correlations`
      - `whoop_workouts` (heart rate, strain)
    ↓
    Compares:
      - GPS tracks vs street network
      - Marks streets within 20m as "covered"
    ↓
    Enriches:
      - Adds WHOOP metrics (HR zones, strain)
    ↓
    Updates:
      - `public/data/astoria-conquest/astoria-covered-streets.geojson`
      - `public/data/astoria-conquest/astoria-progress-stats.json`

┌──────────────────────────────────────────────────────────────┐
│  STEP 3: Frontend Display                                     │
└──────────────────────────────────────────────────────────────┘
    ↓
    Next.js page: `/projects/astoria`
    ↓
    Loads GeoJSON files
    ↓
    Renders interactive map with progress overlays
```

### Data Sync Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│  AUTOMATED: Celery Beat Schedule                              │
└──────────────────────────────────────────────────────────────┘
    ↓
    Monday 1:00 PM: `sync_strava_weekly()`
    ↓
    Fetches new Strava runs from API
    ↓
    Stores in: `strava_runs`
    ↓
    Monday 1:15 PM: `correlate_activities()`
    ↓
    Matches Strava runs ↔ WHOOP workouts
    ↓
    Stores in: `activity_correlations`
    ↓
    Daily 2:00 AM: `refresh_materialized_views()`
    ↓
    Updates analytics views:
      - `run_performance_details`
      - `boxing_performance_details`
      - `weightlifting_performance_details`

┌──────────────────────────────────────────────────────────────┐
│  MANUAL TESTING                                               │
└──────────────────────────────────────────────────────────────┘
    ↓
    node scripts/testing/check-recent-data.js
    ↓
    node scripts/testing/diagnose-whoop-cron.js
    ↓
    node scripts/testing/activity-correlation.js
    ↓
    node scripts/testing/whoop-cli.js
```

### Database Setup Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│  INITIAL SETUP                                                │
└──────────────────────────────────────────────────────────────┘
    ↓
    node scripts/db/enable-vector-support.js
    ↓
    node scripts/db/enable-postgis.js
    ↓
    poetry run alembic upgrade head   (from /backend)
    ↓
    psql $DATABASE_URL < scripts/db/setup-astoria-database.sql

┌──────────────────────────────────────────────────────────────┐
│  VERIFICATION                                                 │
└──────────────────────────────────────────────────────────────┘
    ↓
    node scripts/db/check-vector-support.js
    ↓
    node scripts/testing/check-database-schema.js
    ↓
    node scripts/db/get-database-schema.js
```

---

## 📋 Usage Matrix

| Script | Used By | Frequency | Purpose |
|--------|---------|-----------|---------|
| `generate_astoria_base_map.py` | Developer | Once | Initial Astoria map setup. |
| `update_astoria_progress.py` | Celery Worker | Weekly | Update covered streets + stats. |
| `analyze-sleep-data.js` | Analyst | Ad-hoc | WHOOP sleep analysis. |
| `get-database-schema.js` | Developer | Rare | Documentation snapshot. |
| `check-vector-support.js` | DevOps | Setup | Confirm pgvector extension. |
| `enable-vector-support.js` | DevOps | Setup | Install pgvector. |
| `enable-postgis.js` | DevOps | Setup | Install PostGIS. |
| `setup-astoria-database.sql` | DevOps | Setup | Seed Astoria tables/views. |
| `check-database-schema.js` | CI/CD | Release | Validate schema before deploy. |
| `check-rate-limit.js` | Developer | Debug | Investigate throttling issues. |
| `check-recent-data.js` | Developer | Daily | Verify telemetry freshness. |
| `diagnose-whoop-cron.js` | Developer | Debug | Investigate WHOOP automation. |
| `debug-strava-response.js` | Developer | Debug | Inspect raw Strava responses. |
| `activity-correlation.js` | Developer | Debug | Test Strava↔WHOOP matching. |
| `whoop-cli.js` | Developer | Often | Manual WHOOP sync/testing. |

---

## 🎯 High-Impact Scripts

### Daily Development MVPs
1. **`whoop-cli.js`** – Manual WHOOP sync in seconds; validates OAuth tokens.
2. **`check-recent-data.js`** – Instant health check across key tables.
3. **`activity-correlation.js`** – Spot-check correlation logic before deploying worker changes.

### Setup & DevOps Essentials
1. **`enable-vector-support.js`** – Required for embeddings + pgvector indexes.
2. **`generate_astoria_base_map.py`** – Seeds the Astoria conquest data pipeline.
3. **`check-database-schema.js`** – Final verification before production rollout.

---

## 🚀 Quick Reference

### Daily Development
```bash
# Check latest ingest status
node scripts/testing/check-recent-data.js

# Manual WHOOP sync (includes new workouts)
node scripts/testing/whoop-cli.js daily

# Update Astoria map assets
python scripts/one-off/update_astoria_progress.py
```

### Debugging
```bash
# Diagnose WHOOP automation issues
node scripts/testing/diagnose-whoop-cron.js

# Inspect Strava API payloads
node scripts/testing/debug-strava-response.js

# Validate correlation logic
node scripts/testing/activity-correlation.js

# Check rate limiting behaviour
node scripts/testing/check-rate-limit.js
```

### Database Operations
```bash
# Export current schema snapshot
node scripts/db/get-database-schema.js

# Verify pgvector availability
node scripts/db/check-vector-support.js

# Validate schema integrity
node scripts/testing/check-database-schema.js
```

### One-Time Setup
```bash
# Enable pgvector extension
node scripts/db/enable-vector-support.js

# Enable PostGIS extension
node scripts/db/enable-postgis.js

# Generate Astoria base map
python scripts/one-off/generate_astoria_base_map.py

# Seed Astoria tables
psql "$DATABASE_URL" < scripts/db/setup-astoria-database.sql
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
- ✅ **Retained** curated testing, database, and special-purpose scripts (15 files)

### Why Celery?
- ⚡ **Automatic scheduling** via Celery Beat (no manual cron setup)
- 🔄 **Built-in retries** and error handling
- 📊 **Monitoring** with Flower dashboard
- 🚀 **Scalability** with horizontal worker scaling
- 🐍 **Consistency** - all Python (no JS/Python mixing)

---

*For automated workflows and scheduled tasks, see [`docs/backend/workers/README.md`](../../backend/workers/README.md).*
