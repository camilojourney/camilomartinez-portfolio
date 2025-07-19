# WHOOP V1 to V2 Database Migration Guide for Neon

## 🚀 **RECOMMENDED: Fresh V2 Setup (For 1 Year of Data)**

Since you only have one year of data, the **simplest and cleanest approach** is to drop and recreate the tables with the v2 schema. This eliminates migration complexity entirely.

### **Quick Fresh Setup**

Run the `fresh-v2-setup.sql` script in your Neon SQL Editor:

1. **Backup your data** (optional - uncomment backup lines in the script)
2. **Drop all existing tables**
3. **Create v2-ready tables with UUID support**
4. **Deploy your v2 code**
5. **Start collecting data fresh**

**Benefits:**
- ✅ Clean v2 schema from day one
- ✅ No migration complexity
- ✅ No backwards compatibility overhead
- ✅ Only ~10 minutes to re-collect recent data
- ✅ Better performance with proper v2 indexes

---

## 🔄 **ALTERNATIVE: Complex Migration (If You Need Historical Data)**

If you absolutely need to preserve your existing data, use the complex migration below.

## Phase 1: Create Backups and Add V2 Columns

Run these commands in your Neon SQL Editor:

```sql
-- 1. Create backup tables
CREATE TABLE whoop_sleep_v1_backup AS SELECT * FROM whoop_sleep;
CREATE TABLE whoop_workouts_v1_backup AS SELECT * FROM whoop_workouts;
CREATE TABLE whoop_recovery_v1_backup AS SELECT * FROM whoop_recovery;

-- 2. Verify backups were created
SELECT
    'whoop_sleep' as table_name,
    COUNT(*) as original_count,
    (SELECT COUNT(*) FROM whoop_sleep_v1_backup) as backup_count
FROM whoop_sleep
UNION ALL
SELECT
    'whoop_workouts' as table_name,
    COUNT(*) as original_count,
    (SELECT COUNT(*) FROM whoop_workouts_v1_backup) as backup_count
FROM whoop_workouts
UNION ALL
SELECT
    'whoop_recovery' as table_name,
    COUNT(*) as original_count,
    (SELECT COUNT(*) FROM whoop_recovery_v1_backup) as backup_count
FROM whoop_recovery;
```

## Phase 2: Modify Schema for V2 Compatibility

```sql
-- 1. Drop foreign key constraints temporarily
ALTER TABLE whoop_recovery DROP CONSTRAINT IF EXISTS whoop_recovery_sleep_id_fkey;

-- 2. Add new columns to whoop_sleep
ALTER TABLE whoop_sleep ADD COLUMN id_v2 VARCHAR(36);
ALTER TABLE whoop_sleep ADD COLUMN activity_v1_id BIGINT;

-- 3. Add new columns to whoop_workouts
ALTER TABLE whoop_workouts ADD COLUMN id_v2 VARCHAR(36);
ALTER TABLE whoop_workouts ADD COLUMN activity_v1_id BIGINT;

-- 4. Add new column to whoop_recovery
ALTER TABLE whoop_recovery ADD COLUMN sleep_id_v2 VARCHAR(36);

-- 5. Preserve existing v1 IDs
UPDATE whoop_sleep SET activity_v1_id = id;
UPDATE whoop_workouts SET activity_v1_id = id;

-- 6. Verify schema changes
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('whoop_sleep', 'whoop_workouts', 'whoop_recovery')
    AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

## Phase 3: Deploy V2 Code

At this point, deploy your updated code that uses the `WhoopV2Client`. The application will:
- Continue reading existing data using `activity_v1_id` fields
- Start writing new data with UUID IDs in `id_v2` columns
- Gradually populate the UUID fields as new data comes in

## Phase 4: Final Migration (After V2 Data Collection)

**⚠️ Only run this after you have UUID data in the `id_v2` columns!**

First, check if you have UUID data:
```sql
-- Check if UUID data exists
SELECT
    'Sleep UUIDs' as data_type,
    COUNT(*) as total_records,
    COUNT(id_v2) as uuid_records,
    COUNT(activity_v1_id) as v1_records
FROM whoop_sleep
UNION ALL
SELECT
    'Workout UUIDs' as data_type,
    COUNT(*) as total_records,
    COUNT(id_v2) as uuid_records,
    COUNT(activity_v1_id) as v1_records
FROM whoop_workouts;
```

If you have UUID data, proceed with the final migration:

```sql
-- 1. Update recovery table references
UPDATE whoop_recovery
SET sleep_id_v2 = (
    SELECT id_v2
    FROM whoop_sleep
    WHERE whoop_sleep.activity_v1_id = whoop_recovery.sleep_id
        AND whoop_sleep.id_v2 IS NOT NULL
)
WHERE sleep_id_v2 IS NULL;

-- 2. Drop old primary key constraints
ALTER TABLE whoop_sleep DROP CONSTRAINT whoop_sleep_pkey;
ALTER TABLE whoop_workouts DROP CONSTRAINT whoop_workouts_pkey;

-- 3. Rename columns to complete migration
ALTER TABLE whoop_sleep RENAME COLUMN id TO id_v1_deprecated;
ALTER TABLE whoop_sleep RENAME COLUMN id_v2 TO id;

ALTER TABLE whoop_workouts RENAME COLUMN id TO id_v1_deprecated;
ALTER TABLE whoop_workouts RENAME COLUMN id_v2 TO id;

ALTER TABLE whoop_recovery RENAME COLUMN sleep_id TO sleep_id_v1_deprecated;
ALTER TABLE whoop_recovery RENAME COLUMN sleep_id_v2 TO sleep_id;

-- 4. Add new primary key constraints
ALTER TABLE whoop_sleep ADD CONSTRAINT whoop_sleep_pkey PRIMARY KEY (id);
ALTER TABLE whoop_workouts ADD CONSTRAINT whoop_workouts_pkey PRIMARY KEY (id);

-- 5. Recreate foreign key constraints
ALTER TABLE whoop_recovery
    ADD CONSTRAINT whoop_recovery_sleep_id_fkey
    FOREIGN KEY (sleep_id) REFERENCES whoop_sleep(id) ON DELETE CASCADE;

-- 6. Add performance indexes
CREATE INDEX idx_whoop_sleep_activity_v1_id ON whoop_sleep(activity_v1_id);
CREATE INDEX idx_whoop_workouts_activity_v1_id ON whoop_workouts(activity_v1_id);
CREATE INDEX idx_whoop_sleep_user_id ON whoop_sleep(user_id);
CREATE INDEX idx_whoop_workouts_user_id ON whoop_workouts(user_id);

-- 7. Update table comments
COMMENT ON TABLE whoop_sleep IS 'Stores WHOOP sleep activity data (V2 API with UUID IDs)';
COMMENT ON TABLE whoop_workouts IS 'Stores WHOOP workout data (V2 API with UUID IDs)';
COMMENT ON TABLE whoop_recovery IS 'Stores WHOOP daily recovery scores (V2 API)';
```

## Verification Queries

After each phase, run these to verify everything is working:

```sql
-- Check table structure
\d whoop_sleep
\d whoop_workouts
\d whoop_recovery

-- Verify data integrity
SELECT
    'whoop_sleep' as table_name,
    COUNT(*) as current_count,
    (SELECT COUNT(*) FROM whoop_sleep_v1_backup) as backup_count
FROM whoop_sleep
UNION ALL
SELECT
    'whoop_workouts' as table_name,
    COUNT(*) as current_count,
    (SELECT COUNT(*) FROM whoop_workouts_v1_backup) as backup_count
FROM whoop_workouts;

-- Check for UUID data (after Phase 3)
SELECT
    table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 1 END) as uuid_format_count
FROM (
    SELECT 'whoop_sleep' as table_name, id FROM whoop_sleep WHERE id IS NOT NULL
    UNION ALL
    SELECT 'whoop_workouts' as table_name, id FROM whoop_workouts WHERE id IS NOT NULL
) t
GROUP BY table_name;
```

## Rollback Plan (Emergency Only)

If something goes wrong, you can rollback using the backup tables:

```sql
-- ⚠️ EMERGENCY ROLLBACK ONLY ⚠️
DROP TABLE whoop_sleep CASCADE;
DROP TABLE whoop_workouts CASCADE;
DROP TABLE whoop_recovery CASCADE;

-- Restore from backups
ALTER TABLE whoop_sleep_v1_backup RENAME TO whoop_sleep;
ALTER TABLE whoop_workouts_v1_backup RENAME TO whoop_workouts;
ALTER TABLE whoop_recovery_v1_backup RENAME TO whoop_recovery;

-- Recreate constraints (run your original schema)
```

## Next Steps After Migration

1. **Monitor Data Collection**: Ensure new WHOOP data is being collected with UUID IDs
2. **Test All Features**: Verify charts, analytics, and data exports work correctly
3. **Performance Check**: Monitor query performance with new indexes
4. **Clean Up**: After 30 days of successful operation, optionally drop backup tables
5. **Documentation**: Update any documentation that references the old schema

## Timeline Recommendation

- **Phase 1 & 2**: Run immediately (low risk, adds compatibility)
- **Phase 3**: Deploy code after schema changes are verified
- **Phase 4**: Wait 1-7 days after Phase 3 to ensure UUID data collection
- **Cleanup**: Wait 30 days after Phase 4 for confidence

## Support

If you encounter issues:
1. Check the verification queries for data integrity
2. Ensure your application code is using the new `WhoopV2Client`
3. Verify WHOOP API v2 is returning UUID-formatted IDs
4. Use backup tables for emergency rollback if needed
