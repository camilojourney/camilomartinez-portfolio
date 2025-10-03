"""Add recovery cycle foreign key"""

from alembic import op
import sqlalchemy as sa
from textwrap import dedent

# revision identifiers, used by Alembic.
revision = "0010_add_recovery_cycle_fk"
down_revision = "0009_add_whoop_sleep_relationship"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text(
            dedent(
                """
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
                """
            )
        )
    )


def downgrade() -> None:
    op.execute(sa.text("ALTER TABLE whoop_recovery DROP CONSTRAINT IF EXISTS fk_whoop_recovery_cycle_id;"))
