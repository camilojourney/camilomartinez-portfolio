-- Check if the column "activity_v1_id" exists in the "whoop_sleep" table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'whoop_sleep'
        AND column_name = 'activity_v1_id'
    ) THEN
        -- Rename "activity_v1_id" to "v1_id"
        ALTER TABLE whoop_sleep RENAME COLUMN activity_v1_id TO v1_id;
    END IF;
END $$;

-- Ensure the "v1_id" column exists in the "whoop_sleep" table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'whoop_sleep'
        AND column_name = 'v1_id'
    ) THEN
        -- Add the "v1_id" column
        ALTER TABLE whoop_sleep ADD COLUMN v1_id BIGINT;
    END IF;
END $$;

-- Add unique constraint to whoop_workouts.v1_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'whoop_workouts'
        AND constraint_name = 'unique_whoop_workouts_v1_id'
    ) THEN
        ALTER TABLE whoop_workouts
        ADD CONSTRAINT unique_whoop_workouts_v1_id UNIQUE (v1_id);
    END IF;
END $$;

-- Clean up orphaned v1_id values in whoop_sleep that don't exist in whoop_workouts
DO $$
BEGIN
    UPDATE whoop_sleep 
    SET v1_id = NULL 
    WHERE v1_id IS NOT NULL 
    AND v1_id NOT IN (SELECT v1_id FROM whoop_workouts WHERE v1_id IS NOT NULL);
END $$;

-- Add a foreign key constraint to establish the relationship with "whoop_workouts"
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'whoop_sleep'
        AND constraint_name = 'fk_whoop_sleep_v1_id'
    ) THEN
        ALTER TABLE whoop_sleep
        ADD CONSTRAINT fk_whoop_sleep_v1_id FOREIGN KEY (v1_id)
        REFERENCES whoop_workouts (v1_id)
        ON DELETE SET NULL;
    END IF;
END $$;
