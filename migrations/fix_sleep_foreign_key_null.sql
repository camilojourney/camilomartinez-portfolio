-- Fix whoop_sleep foreign key constraint to allow NULL values
-- Sleep records don't always have associated workouts in WHOOP API v2

-- Drop the existing constraint
ALTER TABLE whoop_sleep DROP CONSTRAINT IF EXISTS fk_whoop_sleep_v1_id;

-- Add a new constraint that allows NULL values
ALTER TABLE whoop_sleep 
ADD CONSTRAINT fk_whoop_sleep_v1_id 
FOREIGN KEY (v1_id) REFERENCES whoop_workouts(v1_id) 
ON DELETE SET NULL;
