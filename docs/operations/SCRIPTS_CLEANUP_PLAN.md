# 🧹 Scripts Cleanup Plan

## Summary
Many scripts have been migrated to Celery workers or are no longer needed. This document identifies what to delete.

---

## ❌ DELETE - Migrated to Celery Workers

### `scripts/pipelines/` (4/5 files to delete)

| File | Status | Reason |
|------|--------|--------|
| `strava-weekly-sync.js` | ❌ DELETE | Migrated to `app.workers.tasks.strava.sync_strava_weekly` |
| `refresh-strava-tokens.js` | ❌ DELETE | Not needed - automatic in sync task |
| `activity-correlation-etl.js` | ❌ DELETE | Migrated to `app.workers.tasks.strava.correlate_activities` |
| `run-correlation-etl.js` | ❌ DELETE | Just a wrapper for activity-correlation-etl.js |
| `refresh-materialized-views.js` | ❌ DELETE | Migrated to `app.workers.tasks.database.refresh_materialized_views` |

**Result**: Delete entire `scripts/pipelines/` directory (all 5 files obsolete)

---

## ❌ DELETE - One-Off Scripts (Already Completed)

### `scripts/one-off/` (4/9 files to delete)

| File | Status | Reason |
|------|--------|--------|
| `fetch-all-strava-data-complete-with-splits.js` | ❌ DELETE | Historical import - now handled by weekly sync |
| `fix-sleep-cycle-relationships.js` | ❌ DELETE | One-time fix already applied |
| `load-astoria-streets.js` | ❌ DELETE | Sample/test data - not used |
| `export-astoria-street-network.py` | ❌ DELETE | Export utility - not needed (data lives in backend/data/) |

**Keep**:
- ✅ `generate_astoria_base_map.py` - Still used for initial map generation
- ✅ `update_astoria_progress.py` - Called by Celery task
- ✅ `analyze-sleep-data.js` - Useful analysis tool

---

## 🤔 REVIEW - Testing Scripts

### `scripts/testing/` (Keep all for now - useful for debugging)

| File | Status | Reason |
|------|--------|--------|
| `activity-correlation.js` | ✅ KEEP | Useful for testing correlation logic |
| `check-database-schema.js` | ✅ KEEP | Database validation tool |
| `check-rate-limit.js` | ✅ KEEP | API testing |
| `check-recent-data.js` | ✅ KEEP | Data verification |
| `debug-strava-response.js` | ✅ KEEP | API debugging |
| `diagnose-whoop-cron.js` | ✅ KEEP | WHOOP sync diagnostics |
| `whoop-cli.js` | ✅ KEEP | Interactive WHOOP CLI |

**Result**: Keep all 7 testing scripts

---

## ✅ KEEP - Database Utilities

### `scripts/db/` (Keep all - database admin tools)

All database scripts are useful utilities:
- ✅ `apply-migration.js`
- ✅ `run-migration.js`
- ✅ `get-database-schema.js`
- ✅ `check-vector-support.js`
- ✅ `enable-vector-support.js`
- ✅ `enable-postgis.js`

**Result**: Keep all database scripts

---

## 📊 Cleanup Summary

| Category | Total | Delete | Keep |
|----------|-------|--------|------|
| **pipelines/** | 5 | 5 | 0 |
| **one-off/** | 9 | 4 | 5 |
| **testing/** | 7 | 0 | 7 |
| **db/** | 8 | 0 | 8 |
| **TOTAL** | 29 | 9 | 20 |

---

## 🎯 Action Items

1. Delete entire `scripts/pipelines/` directory (5 files)
2. Delete 4 obsolete one-off scripts
3. Update `docs/operations/scripts/README.md` to reflect new structure
4. Update any references to deleted scripts

---

## ⚠️ Migration Notes

### Where to Find Migrated Functionality

| Old Script | New Location |
|-----------|--------------|
| `pipelines/strava-weekly-sync.js` | `backend/app/workers/tasks/strava.py:sync_strava_weekly()` |
| `pipelines/refresh-strava-tokens.js` | **Not needed** - automatic |
| `pipelines/activity-correlation-etl.js` | `backend/app/workers/tasks/strava.py:correlate_activities()` |
| `pipelines/refresh-materialized-views.js` | `backend/app/workers/tasks/database.py:refresh_materialized_views()` |

### How to Run Tasks Now

**Before** (manual scripts):
```bash
node scripts/pipelines/strava-weekly-sync.js
```

**After** (Celery tasks):
```bash
# Automatic via Celery Beat (Monday 1:00 PM)
# Or trigger manually:
poetry run python -c "from app.workers.tasks.strava import sync_strava_weekly; sync_strava_weekly()"
```

---

*Generated: 2025-10-07*
