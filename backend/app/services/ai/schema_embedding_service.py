"""
Schema Embedding Service for generating and managing embeddings of database schema descriptions.
Replaces the TypeScript embed-schema.ts functionality with Python implementation.
"""

import logging
from datetime import datetime
from pathlib import Path
from typing import Any

from sqlalchemy import text

from app.config.database import async_session_factory
from app.models.ai_query import Embedding
from app.services.ai.openai_client import openai_service

logger = logging.getLogger(__name__)


class SchemaEmbeddingService:
    """
    Service for generating and managing schema embeddings for the AI query system.

    UPDATED: Now uses unified Embedding model with embedding_type='schema' or 'profile'.

    This service handles:
    - Schema description embedding generation
    - Profile embedding generation
    - Database storage and updates using unified embeddings table
    - Batch processing of schema components
    """

    def __init__(self):
        """Initialize the schema embedding service."""
        self.embedding_model = "text-embedding-3-small"
        self.embedding_dimensions = 1536

        # Schema descriptions - matches TypeScript implementation
        self.schema_descriptions = [
            # Personal Profile & Background (NEW)
            {
                "type": "profile",
                "name": "camilo_background",
                "description": "Camilo Martinez's personal and professional background, including origins, education, work philosophy, and core values. Use this for questions about who Camilo is, his background, education, work ethic, and professional journey."
            },
            {
                "type": "profile",
                "name": "camilo_technical_expertise",
                "description": "Camilo's technical skills, programming expertise, development philosophy, and technology stack preferences. Use this for questions about his technical capabilities, programming experience, preferred tools, and development approach."
            },
            {
                "type": "profile",
                "name": "camilo_projects",
                "description": "Camilo's project portfolio, including current and past significant projects, technologies used, challenges solved, and impact achieved. Use this for questions about his work, project experience, and professional accomplishments."
            },
            {
                "type": "profile",
                "name": "camilo_fitness_philosophy",
                "description": "Camilo's approach to fitness, health, and wellness including training philosophy, health metrics focus, WHOOP and Strava usage, and holistic wellness approach. Use this for questions about his fitness methodology and health tracking approach."
            },

            # Database Schema Descriptions (EXISTING)
            {
                "type": "view",
                "name": "daily_fitness_snapshot",
                "description": "A comprehensive daily summary of all fitness and wellness metrics. Best for analyzing trends over time and the correlation between sleep, recovery, and activity. Contains daily WHOOP data (recovery score, HRV, sleep, strain) and aggregated workout data for running, boxing, meditation, and sauna use."
            },
            {
                "type": "view",
                "name": "run_performance_details",
                "description": "A granular, in-depth analysis of individual running activities. Best for answering questions about performance *during* a single run, like split times, pace changes, and heart rate zones for a specific run."
            },
            {
                "type": "view",
                "name": "boxing_performance_details",
                "description": "A detailed log of every boxing workout. Use for specific questions about boxing session duration, strain, intensity (strain_density), and time spent in each heart rate zone."
            },
            {
                "type": "view",
                "name": "weightlifting_performance_details",
                "description": "A detailed log of every weightlifting or strength training workout. Use for specific questions about lifting session duration, strain, intensity (strain_density), and cardiovascular response (heart rate zones)."
            },

            # Column-level descriptions for daily_fitness_snapshot
            {
                "type": "column",
                "view": "daily_fitness_snapshot",
                "name": "user_id",
                "description": "Type: UUID. Unique identifier for the user. Used for multi-user data segregation and relationship mapping."
            },
            {
                "type": "column",
                "view": "daily_fitness_snapshot",
                "name": "snapshot_date",
                "description": "Type: DATE (YYYY-MM-DD). The calendar date for this daily snapshot. CRITICAL: Use this column for ALL date filtering, sorting by recent/latest, time-based queries, ordering by date, finding data from specific days, weeks, months. Essential for temporal analysis, trend identification, and chronological ordering. Keywords: date, time, recent, latest, chronological, daily, when, day, week, month, yesterday, today, last week."
            },
            {
                "type": "column",
                "view": "daily_fitness_snapshot",
                "name": "whoop_recovery_score",
                "description": "Unit: Percentage (0-100, float). Daily recovery score from WHOOP. Higher scores indicate better recovery and readiness for strain. Calculated overnight from HRV, resting heart rate, sleep performance, and respiratory rate vs baseline. Scored as Green (67–100% good), Yellow (34–66% moderate), Red (0–33% low)."
            },
            {
                "type": "column",
                "view": "daily_fitness_snapshot",
                "name": "whoop_hrv",
                "description": "Unit: Milliseconds (ms, float). Heart Rate Variability using RMSSD calculation. Key indicator of autonomic nervous system recovery."
            },
            {
                "type": "column",
                "view": "daily_fitness_snapshot",
                "name": "whoop_sleep_performance_percent",
                "description": "Unit: Percentage (0-100, float). Sleep quality score indicating how well sleep met the body's needs based on cycles and disturbances."
            },
            {
                "type": "column",
                "view": "daily_fitness_snapshot",
                "name": "whoop_hours_in_bed",
                "description": "Unit: Hours (float, 3 decimal precision). Total time spent in bed including all sleep sessions (main sleep + naps) for the day, aggregated and converted from milliseconds. Comprehensive measure of total daily sleep time."
            },
            {
                "type": "column",
                "view": "daily_fitness_snapshot",
                "name": "whoop_day_strain",
                "description": "Unit: Strain points (0-21, float). Cumulative cardiovascular load score for the day. Measures total physical exertion."
            },
            {
                "type": "column",
                "view": "daily_fitness_snapshot",
                "name": "whoop_workout_count",
                "description": "Unit: Count (integer). Total number of distinct workout sessions recorded for the day."
            },
            {
                "type": "column",
                "view": "daily_fitness_snapshot",
                "name": "whoop_running_minutes",
                "description": "Unit: Minutes (float, 2 decimal precision). Total time spent running. Converted from milliseconds for endurance volume tracking."
            },
            {
                "type": "column",
                "view": "daily_fitness_snapshot",
                "name": "whoop_boxing_minutes",
                "description": "Unit: Minutes (float, 2 decimal precision). Total time spent boxing. Converted from milliseconds for combat training volume."
            },
            {
                "type": "column",
                "view": "daily_fitness_snapshot",
                "name": "whoop_weight_training_minutes",
                "description": "Unit: Minutes (float, 2 decimal precision). Total time spent weight training. Converted from milliseconds for strength volume."
            },
            {
                "type": "column",
                "view": "daily_fitness_snapshot",
                "name": "whoop_meditation_sessions",
                "description": "Unit: Count (integer). Number of distinct meditation sessions completed. Each session is a discrete practice period."
            },
            {
                "type": "column",
                "view": "daily_fitness_snapshot",
                "name": "whoop_meditation_minutes",
                "description": "Unit: Minutes (float, 2 decimal precision). Total time spent meditating. Converted from milliseconds for mental wellness tracking."
            },
            {
                "type": "column",
                "view": "daily_fitness_snapshot",
                "name": "whoop_sauna_minutes",
                "description": "Unit: Minutes (float, 2 decimal precision). Total time spent in sauna. Converted from milliseconds for heat exposure tracking."
            },
            {
                "type": "column",
                "view": "daily_fitness_snapshot",
                "name": "strava_run_count",
                "description": "Unit: Count (integer). Total number of running activities from Strava for the day. Aggregated from individual run records."
            },
            {
                "type": "column",
                "view": "daily_fitness_snapshot",
                "name": "strava_total_run_miles",
                "description": "Unit: Miles (float, 2 decimal precision). Cumulative running distance for the day from Strava. Sum of all running activities, converted from meters to miles."
            },
            {
                "type": "column",
                "view": "daily_fitness_snapshot",
                "name": "strava_avg_run_speed_mph",
                "description": "Unit: Miles per hour (mph, float). Average running speed across all Strava runs for the day. Calculated from total distance divided by total moving time."
            },
            {
                "type": "column",
                "view": "daily_fitness_snapshot",
                "name": "strava_total_suffer_score",
                "description": "Unit: Suffer Score points (integer). Cumulative Strava suffer score for all runs. Measures relative effort and intensity of running activities."
            }
        ]

        logger.info("Schema embedding service initialized")

    async def create_table_if_not_exists(self) -> None:
        """Create schema_embeddings table if it doesn't exist."""
        try:
            async with async_session_factory() as session:
                create_table_sql = """
                CREATE TABLE IF NOT EXISTS schema_embeddings (
                    id SERIAL PRIMARY KEY,
                    table_name TEXT,
                    column_name TEXT,
                    description TEXT NOT NULL,
                    embedding VECTOR(1536) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );

                -- Create HNSW index for efficient similarity search
                CREATE INDEX IF NOT EXISTS schema_embeddings_embedding_idx
                ON schema_embeddings USING hnsw (embedding vector_cosine_ops);
                """

                await session.execute(text(create_table_sql))
                await session.commit()

                logger.info("Schema embeddings table ready")

        except Exception as e:
            logger.error(f"Error creating schema embeddings table: {e}")
            raise

    async def generate_embeddings(
        self,
        clear_existing: bool = True,
        only_profile: bool = False
    ) -> dict[str, Any]:
        """
        Generate embeddings for schema descriptions and/or profile.

        Args:
            clear_existing: Whether to clear existing embeddings first
            only_profile: If True, only regenerate profile embeddings (ignores clear_existing)

        Returns:
            Dict with generation results and statistics
        """
        try:
            logger.info(f"Starting schema embedding generation (only_profile={only_profile})...")
            start_time = datetime.utcnow()

            # Ensure table exists
            await self.create_table_if_not_exists()

            async with async_session_factory() as session:
                # Handle profile-only mode (UPDATED: Use embeddings table)
                if only_profile:
                    # Clear only profile embeddings
                    await session.execute(text("DELETE FROM embeddings WHERE embedding_type = 'profile';"))
                    logger.info("Cleared existing profile embeddings only")
                elif clear_existing:
                    # Clear all schema and profile embeddings
                    await session.execute(text("DELETE FROM embeddings WHERE embedding_type IN ('schema', 'profile');"))
                    logger.info("Cleared all existing schema and profile embeddings")

                # Generate embeddings for each schema item
                successful_embeddings = 0
                failed_embeddings = 0

                # Determine what to embed
                if only_profile:
                    # Only load and embed profile
                    profile_embeddings = await self._load_profile_embeddings()
                    all_descriptions = profile_embeddings
                    logger.info(f"Profile-only mode: embedding {len(all_descriptions)} profile sections")
                else:
                    # Load and add personal profile embeddings from CAMILO_PROFILE.md
                    profile_embeddings = await self._load_profile_embeddings()
                    all_descriptions = self.schema_descriptions + profile_embeddings
                    logger.info(f"Full mode: embedding {len(self.schema_descriptions)} schema items + {len(profile_embeddings)} profile sections")

                for item in all_descriptions:
                    try:
                        # Prepare text for embedding and metadata
                        if item["type"] == "view":
                            input_text = f"View: {item['name']}. Description: {item['description']}"
                            embedding_type = "schema"
                            metadata = {
                                "table_name": item["name"],
                                "column_name": None,
                                "item_type": "view"
                            }
                        elif item["type"] == "profile":
                            input_text = f"Profile: {item['name']}. Description: {item['description']}"
                            embedding_type = "profile"
                            metadata = {
                                "table_name": "camilo_profile",
                                "column_name": item["name"],
                                "item_type": "profile"
                            }
                        else:  # column
                            input_text = f"View: {item['view']}, Column: {item['name']}. Description: {item['description']}"
                            embedding_type = "schema"
                            metadata = {
                                "table_name": item["view"],
                                "column_name": item["name"],
                                "item_type": "column"
                            }

                        logger.info(f"Generating embedding for: {item['name']}")

                        # Generate embedding using OpenAI service
                        embedding_result = await openai_service.create_embedding(input_text)
                        embedding_vector = embedding_result["embeddings"]

                        # Create Embedding object using SQLAlchemy ORM (UPDATED)
                        new_embedding = Embedding(
                            content=item["description"],
                            embedding=embedding_vector,  # pgvector handles the conversion
                            embedding_type=embedding_type,
                            metadata_=metadata,
                            is_validated=True,  # Schema embeddings are pre-validated
                            created_at=datetime.utcnow()
                        )

                        session.add(new_embedding)

                        successful_embeddings += 1
                        logger.debug(f"Embedded: {item['name']}")

                    except Exception as e:
                        logger.error(f"Failed to embed {item['name']}: {e}")
                        failed_embeddings += 1

                # Commit all changes
                await session.commit()

                processing_time = (datetime.utcnow() - start_time).total_seconds()

                result = {
                    "successful_embeddings": successful_embeddings,
                    "failed_embeddings": failed_embeddings,
                    "total_items": len(self.schema_descriptions),
                    "processing_time_seconds": processing_time,
                    "completed_at": datetime.utcnow().isoformat()
                }

                logger.info(f"Schema embedding generation completed: {result}")
                return result

        except Exception as e:
            logger.error(f"Error in schema embedding generation: {e}")
            raise

    async def update_single_embedding(
        self,
        table_name: str,
        column_name: str | None = None
    ) -> bool:
        """
        Update a single embedding efficiently.

        Args:
            table_name: Table/view name
            column_name: Column name (None for view-level descriptions)

        Returns:
            True if updated successfully, False otherwise
        """
        try:
            # Find the schema description
            target_item = None
            for item in self.schema_descriptions:
                if item["type"] == "view" and item["name"] == table_name and column_name is None:
                    target_item = item
                    break
                elif (item["type"] == "column" and
                      item.get("view") == table_name and
                      item["name"] == column_name):
                    target_item = item
                    break

            if not target_item:
                logger.error(f"Schema description not found for {table_name}.{column_name}")
                return False

            # Prepare embedding text
            if target_item["type"] == "view":
                input_text = f"View: {target_item['name']}. Description: {target_item['description']}"
            else:
                input_text = f"View: {target_item['view']}, Column: {target_item['name']}. Description: {target_item['description']}"

            logger.info(f"Updating embedding for: {input_text[:100]}...")

            # Generate new embedding
            embedding_result = await openai_service.create_embedding(input_text)
            embedding_vector = embedding_result["embeddings"]
            embedding_str = f"[{','.join(map(str, embedding_vector))}]"

            async with async_session_factory() as session:
                # Delete existing entry
                delete_sql = text("""
                DELETE FROM schema_embeddings
                WHERE table_name = :table_name AND column_name IS NOT DISTINCT FROM :column_name
                """)
                await session.execute(delete_sql, {"table_name": table_name, "column_name": column_name})

                # Insert new entry
                insert_sql = text("""
                INSERT INTO schema_embeddings (table_name, column_name, description, embedding)
                VALUES (:table_name, :column_name, :description, :embedding)
                """)
                await session.execute(
                    insert_sql,
                    {"table_name": table_name, "column_name": column_name, "description": target_item["description"], "embedding": embedding_str}
                )

                await session.commit()

            logger.info(f"Successfully updated embedding for {table_name}.{column_name}")
            return True

        except Exception as e:
            logger.error(f"Error updating single embedding: {e}")
            return False

    async def _load_profile_embeddings(self) -> list[dict[str, Any]]:
        """
        Load personal profile content from CAMILO_PROFILE.md and prepare embeddings.

        Returns:
            List of profile embedding descriptions
        """
        try:
            # Path to the profile markdown file
            profile_path = Path(__file__).parent.parent.parent.parent.parent / "docs" / "knowledge" / "CAMILO_PROFILE.md"

            if not profile_path.exists():
                logger.warning(f"CAMILO_PROFILE.md not found at {profile_path}")
                return []

            # Read the profile content
            with open(profile_path, encoding='utf-8') as f:
                content = f.read()

            logger.info(f"Loaded CAMILO_PROFILE.md ({len(content)} characters)")

            # Parse sections from the markdown
            embeddings = []

            # Split by major sections (##)
            sections = content.split('\n## ')

            for section in sections[1:]:  # Skip the title/metadata
                lines = section.split('\n', 1)
                if len(lines) < 2:
                    continue

                section_title = lines[0].strip()
                section_content = lines[1].strip() if len(lines) > 1 else ""

                # Skip very short sections or metadata
                if len(section_content) < 50:
                    continue

                # Create embedding entry for this section
                # Map section titles to profile categories
                section_lower = section_title.lower()

                if any(keyword in section_lower for keyword in ['identity', 'background']):
                    name = "camilo_background"
                    description = f"{section_title}: {section_content[:500]}"
                elif any(keyword in section_lower for keyword in ['technical', 'skills', 'mastery']):
                    name = "camilo_technical_expertise"
                    description = f"{section_title}: {section_content[:500]}"
                elif any(keyword in section_lower for keyword in ['projects', 'signature']):
                    name = "camilo_projects"
                    description = f"{section_title}: {section_content[:500]}"
                elif any(keyword in section_lower for keyword in ['health', 'fitness', 'performance']):
                    name = "camilo_fitness_philosophy"
                    description = f"{section_title}: {section_content[:500]}"
                elif any(keyword in section_lower for keyword in ['education', 'learning']):
                    name = "camilo_education"
                    description = f"{section_title}: {section_content[:500]}"
                elif any(keyword in section_lower for keyword in ['values', 'practices']):
                    name = "camilo_values"
                    description = f"{section_title}: {section_content[:500]}"
                elif any(keyword in section_lower for keyword in ['communication', 'style']):
                    name = "camilo_communication"
                    description = f"{section_title}: {section_content[:500]}"
                elif any(keyword in section_lower for keyword in ['focus', 'goals', 'current']):
                    name = "camilo_current_focus"
                    description = f"{section_title}: {section_content[:500]}"
                else:
                    # Generic profile section
                    name = f"camilo_{section_title.lower().replace(' ', '_').replace('&', 'and')[:50]}"
                    description = f"{section_title}: {section_content[:500]}"

                embeddings.append({
                    "type": "profile",
                    "name": name,
                    "description": description
                })

            logger.info(f"Extracted {len(embeddings)} profile sections from CAMILO_PROFILE.md")
            return embeddings

        except Exception as e:
            logger.error(f"Error loading profile embeddings: {e}")
            return []

    async def get_embedding_stats(self) -> dict[str, Any]:
        """Get statistics about current embeddings in the database."""
        try:
            async with async_session_factory() as session:
                # Get total count
                count_result = await session.execute(
                    text("SELECT COUNT(*) as total FROM schema_embeddings")
                )
                total_count = count_result.fetchone()[0]

                # Get breakdown by type
                breakdown_result = await session.execute(text("""
                    SELECT
                        CASE WHEN column_name IS NULL THEN 'view' ELSE 'column' END as type,
                        COUNT(*) as count
                    FROM schema_embeddings
                    GROUP BY CASE WHEN column_name IS NULL THEN 'view' ELSE 'column' END
                """))

                breakdown = {row[0]: row[1] for row in breakdown_result.fetchall()}

                # Get recent updates
                recent_result = await session.execute(text("""
                    SELECT table_name, column_name, created_at
                    FROM schema_embeddings
                    ORDER BY created_at DESC
                    LIMIT 5
                """))

                recent_updates = []
                for row in recent_result.fetchall():
                    recent_updates.append({
                        "table_name": row[0],
                        "column_name": row[1],
                        "created_at": row[2].isoformat() if row[2] else None
                    })

                return {
                    "total_embeddings": total_count,
                    "breakdown": breakdown,
                    "recent_updates": recent_updates,
                    "expected_total": len(self.schema_descriptions),
                    "is_complete": total_count == len(self.schema_descriptions)
                }

        except Exception as e:
            logger.error(f"Error getting embedding stats: {e}")
            return {"error": str(e)}


# Global service instance
schema_embedding_service = SchemaEmbeddingService()
