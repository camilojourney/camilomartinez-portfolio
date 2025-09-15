-- Add foreign key constraint for whoop_recovery.cycle_id → whoop_cycles.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'whoop_recovery'
        AND constraint_name = 'fk_whoop_recovery_cycle_id'
    ) THEN
        ALTER TABLE whoop_recovery
        ADD CONSTRAINT fk_whoop_recovery_cycle_id FOREIGN KEY (cycle_id)
        REFERENCES whoop_cycles (id)
        ON DELETE CASCADE;
    END IF;
END $$;
