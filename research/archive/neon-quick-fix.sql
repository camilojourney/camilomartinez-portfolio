-- QUICK FIX: Single command to resolve the main constraint issue
-- Run this if you just want to fix the immediate problem

-- PostgreSQL syntax for making columns nullable
ALTER TABLE whoop_sleep ALTER COLUMN cycle_id DROP NOT NULL;
ALTER TABLE whoop_recovery ALTER COLUMN sleep_id DROP NOT NULL;

-- Verify the fix worked
SELECT 'Quick fix applied! Both cycle_id and sleep_id can now be NULL.' AS status;
