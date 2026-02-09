"""Add HNSW index for schema embeddings"""

from textwrap import dedent

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "0015_add_schema_embedding_index"
down_revision = "0014_create_materialized_views"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(sa.text("CREATE EXTENSION IF NOT EXISTS vector;"))
    op.execute(
        sa.text(
            dedent(
                """
                CREATE INDEX IF NOT EXISTS idx_schema_embeddings_hnsw
                ON schema_embeddings USING hnsw (embedding vector_cosine_ops);

                COMMENT ON INDEX idx_schema_embeddings_hnsw IS
                    'HNSW index for fast approximate nearest neighbor search on schema embeddings.\nOptimized for text-embedding-3-small (1536 dimensions).';
                """
            )
        )
    )


def downgrade() -> None:
    op.execute(sa.text("DROP INDEX IF EXISTS idx_schema_embeddings_hnsw;"))
