"""Allow nullable WHOOP sleep foreign key"""

from textwrap import dedent

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "0011_nullable_sleep_fk"
down_revision = "0010_add_recovery_cycle_fk"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text(
            dedent(
                """
                ALTER TABLE whoop_sleep DROP CONSTRAINT IF EXISTS fk_whoop_sleep_v1_id;

                ALTER TABLE whoop_sleep
                    ADD CONSTRAINT fk_whoop_sleep_v1_id
                    FOREIGN KEY (v1_id) REFERENCES whoop_workouts(v1_id)
                    ON DELETE SET NULL;
                """
            )
        )
    )


def downgrade() -> None:
    op.execute(sa.text("ALTER TABLE whoop_sleep DROP CONSTRAINT IF EXISTS fk_whoop_sleep_v1_id;"))
