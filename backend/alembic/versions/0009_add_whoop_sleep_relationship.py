"""Align WHOOP sleep/workout relationships"""

from alembic import op
import sqlalchemy as sa
from textwrap import dedent

# revision identifiers, used by Alembic.
revision = "0009_whoop_sleep_relation"
down_revision = "0008_add_ai_trainer_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text(
            dedent(
                """
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'whoop_sleep' AND column_name = 'activity_v1_id'
                    ) THEN
                        ALTER TABLE whoop_sleep RENAME COLUMN activity_v1_id TO v1_id;
                    END IF;
                END $$;

                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'whoop_sleep' AND column_name = 'v1_id'
                    ) THEN
                        ALTER TABLE whoop_sleep ADD COLUMN v1_id BIGINT;
                    END IF;
                END $$;

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

                DO $$
                BEGIN
                    UPDATE whoop_sleep
                    SET v1_id = NULL
                    WHERE v1_id IS NOT NULL
                      AND v1_id NOT IN (SELECT v1_id FROM whoop_workouts WHERE v1_id IS NOT NULL);
                END $$;

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
                """
            )
        )
    )


def downgrade() -> None:
    op.execute(sa.text("ALTER TABLE whoop_sleep DROP CONSTRAINT IF EXISTS fk_whoop_sleep_v1_id;"))
    op.execute(sa.text("ALTER TABLE whoop_workouts DROP CONSTRAINT IF EXISTS unique_whoop_workouts_v1_id;"))
