"""
Autonomous Embedding Agent Service

This service implements an agentic architecture for automatic embedding generation
triggered by file system changes and database schema modifications.

Architecture Pattern: Event-Driven Agentic RAG with Self-Learning Capabilities

Components:
1. File System Monitor (Watchdog) - Detects changes to CAMILO_PROFILE.md
2. Database Schema Monitor - Detects changes to PostgreSQL schema
3. Agent Orchestrator - Decides when and what to re-embed
4. Embedding Pipeline - Executes the re-embedding process
5. Memory Store - Tracks embedding history and performance

Based on 2025 best practices from:
- Agentic RAG (IBM, NVIDIA, ArXiv 2501.09136)
- LangGraph orchestration patterns
- Supabase automatic embeddings architecture
"""

import logging
import asyncio
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileModifiedEvent, FileCreatedEvent
from sqlalchemy import text
import hashlib

from app.config.database import async_session_factory
from app.services.ai.schema_embedding_service import schema_embedding_service

logger = logging.getLogger(__name__)


class EmbeddingAgentMemory:
    """
    Memory store for the embedding agent.
    Tracks what has been embedded, when, and performance metrics.
    """

    def __init__(self):
        self.history: List[Dict[str, Any]] = []
        self.last_profile_hash: Optional[str] = None
        self.last_schema_hash: Optional[str] = None

    def get_file_hash(self, file_path: Path) -> str:
        """Calculate MD5 hash of a file."""
        try:
            with open(file_path, 'rb') as f:
                return hashlib.md5(f.read()).hexdigest()
        except Exception as e:
            logger.error(f"Error calculating file hash: {e}")
            return ""

    def has_profile_changed(self, profile_path: Path) -> bool:
        """Check if profile file has changed since last embedding."""
        current_hash = self.get_file_hash(profile_path)
        if self.last_profile_hash is None or current_hash != self.last_profile_hash:
            self.last_profile_hash = current_hash
            return True
        return False

    def record_embedding_event(self, event_type: str, metadata: Dict[str, Any]):
        """Record an embedding event in memory."""
        self.history.append({
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "metadata": metadata
        })
        # Keep only last 100 events
        if len(self.history) > 100:
            self.history = self.history[-100:]


class ProfileFileWatcher(FileSystemEventHandler):
    """
    Watchdog event handler for CAMILO_PROFILE.md changes.
    Triggers automatic re-embedding when the profile is modified.
    """

    def __init__(self, agent: 'AutoEmbeddingAgent'):
        self.agent = agent
        self.debounce_seconds = 5  # Wait 5 seconds after last change
        self.pending_task: Optional[asyncio.Task] = None

    def on_modified(self, event):
        """Handle file modification events."""
        if isinstance(event, FileModifiedEvent) and event.src_path.endswith('CAMILO_PROFILE.md'):
            logger.info(f"Profile file modified: {event.src_path}")
            self._trigger_re_embedding("profile_modified", event.src_path)

    def on_created(self, event):
        """Handle file creation events."""
        if isinstance(event, FileCreatedEvent) and event.src_path.endswith('CAMILO_PROFILE.md'):
            logger.info(f"Profile file created: {event.src_path}")
            self._trigger_re_embedding("profile_created", event.src_path)

    def _trigger_re_embedding(self, event_type: str, file_path: str):
        """
        Trigger re-embedding with debouncing.
        Waits for changes to settle before triggering.
        """
        # Cancel pending task if exists
        if self.pending_task and not self.pending_task.done():
            self.pending_task.cancel()

        # Schedule new task
        async def debounced_embed():
            await asyncio.sleep(self.debounce_seconds)
            await self.agent.handle_profile_change(event_type, file_path)

        # Run in event loop
        try:
            loop = asyncio.get_event_loop()
            self.pending_task = loop.create_task(debounced_embed())
        except RuntimeError:
            logger.warning("No event loop running, skipping debounced re-embedding")


class DatabaseSchemaMonitor:
    """
    Monitors PostgreSQL database schema changes.
    Uses PostgreSQL's pg_stat and information_schema to detect modifications.
    """

    def __init__(self, agent: 'AutoEmbeddingAgent'):
        self.agent = agent
        self.check_interval_seconds = 300  # Check every 5 minutes
        self.monitoring_task: Optional[asyncio.Task] = None

    async def get_schema_signature(self) -> str:
        """
        Generate a signature of current database schema.
        Includes table definitions, column types, and view definitions.
        """
        try:
            async with async_session_factory() as session:
                # Get schema information for relevant tables/views
                schema_query = """
                SELECT
                    table_schema,
                    table_name,
                    column_name,
                    data_type
                FROM information_schema.columns
                WHERE table_schema IN ('public')
                    AND table_name IN (
                        'daily_fitness_snapshot',
                        'run_performance_details',
                        'boxing_performance_details',
                        'weightlifting_performance_details'
                    )
                ORDER BY table_schema, table_name, ordinal_position;
                """

                result = await session.execute(text(schema_query))
                schema_data = result.fetchall()

                # Create hash of schema
                schema_str = "\n".join([
                    f"{row[0]}.{row[1]}.{row[2]}:{row[3]}"
                    for row in schema_data
                ])

                return hashlib.md5(schema_str.encode()).hexdigest()

        except Exception as e:
            logger.error(f"Error getting schema signature: {e}")
            return ""

    async def start_monitoring(self):
        """Start continuous schema monitoring."""
        logger.info("Starting database schema monitoring...")

        while True:
            try:
                current_signature = await self.get_schema_signature()

                if self.agent.memory.last_schema_hash is None:
                    # First run, just store the hash
                    self.agent.memory.last_schema_hash = current_signature
                    logger.info("Initial schema signature captured")
                elif current_signature != self.agent.memory.last_schema_hash:
                    # Schema has changed!
                    logger.warning("Database schema change detected!")
                    await self.agent.handle_schema_change(current_signature)
                    self.agent.memory.last_schema_hash = current_signature

                # Wait before next check
                await asyncio.sleep(self.check_interval_seconds)

            except Exception as e:
                logger.error(f"Error in schema monitoring loop: {e}")
                await asyncio.sleep(self.check_interval_seconds)


class AutoEmbeddingAgent:
    """
    Autonomous agent that orchestrates automatic embedding generation.

    Uses agentic design patterns:
    - Planning: Decides what needs to be re-embedded based on changes
    - Tool Use: Invokes embedding generation service
    - Memory: Tracks history and avoids redundant work
    - Reflection: Monitors embedding quality and adjusts strategy
    """

    def __init__(self):
        self.memory = EmbeddingAgentMemory()
        self.file_watcher: Optional[ProfileFileWatcher] = None
        self.schema_monitor: Optional[DatabaseSchemaMonitor] = None
        self.observer: Optional[Observer] = None
        self.is_running = False

        # Agent configuration
        self.profile_path = Path(__file__).parent.parent.parent.parent.parent / "docs" / "knowledge" / "CAMILO_PROFILE.md"

    async def start(self):
        """Start the autonomous embedding agent."""
        if self.is_running:
            logger.warning("Agent is already running")
            return

        logger.info("🤖 Starting Autonomous Embedding Agent...")
        self.is_running = True

        # Initialize file watcher
        self.file_watcher = ProfileFileWatcher(self)
        self.observer = Observer()

        # Watch the docs/knowledge directory
        watch_dir = self.profile_path.parent
        if watch_dir.exists():
            self.observer.schedule(self.file_watcher, str(watch_dir), recursive=False)
            self.observer.start()
            logger.info(f"📁 Watching directory: {watch_dir}")
        else:
            logger.warning(f"Watch directory does not exist: {watch_dir}")

        # Initialize schema monitor
        self.schema_monitor = DatabaseSchemaMonitor(self)

        # Start schema monitoring in background
        asyncio.create_task(self.schema_monitor.start_monitoring())

        logger.info("✅ Autonomous Embedding Agent is now active!")

    async def stop(self):
        """Stop the autonomous embedding agent."""
        logger.info("Stopping Autonomous Embedding Agent...")
        self.is_running = False

        if self.observer:
            self.observer.stop()
            self.observer.join()

        logger.info("Agent stopped")

    async def handle_profile_change(self, event_type: str, file_path: str):
        """
        Agent decision-making for profile changes.
        Uses planning and reflection to decide if re-embedding is needed.
        """
        logger.info(f"🧠 Agent processing profile change: {event_type}")

        # Check if content actually changed (reflection)
        if not self.memory.has_profile_changed(self.profile_path):
            logger.info("Content unchanged (hash match), skipping re-embedding")
            return

        # Plan: Decide to re-embed profile only
        logger.info("📋 Agent decision: Re-embed profile (optimized strategy)")

        try:
            # Execute embedding generation (tool use)
            result = await schema_embedding_service.generate_embeddings(
                only_profile=True
            )

            # Record success in memory
            self.memory.record_embedding_event("profile_auto_embedded", {
                "trigger": event_type,
                "file_path": file_path,
                "embeddings_generated": result.get("successful_embeddings", 0),
                "processing_time": result.get("processing_time_seconds", 0)
            })

            logger.info(f"✅ Auto-embedding complete: {result.get('successful_embeddings', 0)} embeddings")

        except Exception as e:
            logger.error(f"❌ Auto-embedding failed: {e}")
            self.memory.record_embedding_event("profile_auto_embed_failed", {
                "trigger": event_type,
                "error": str(e)
            })

    async def handle_schema_change(self, new_signature: str):
        """
        Agent decision-making for schema changes.
        More conservative - requires full re-embedding.
        """
        logger.info("🧠 Agent processing schema change")

        # Plan: Schema changes require full re-embedding
        logger.info("📋 Agent decision: Full schema re-embedding required")

        try:
            # Execute full embedding generation
            result = await schema_embedding_service.generate_embeddings(
                clear_existing=True,
                only_profile=False
            )

            # Record success
            self.memory.record_embedding_event("schema_auto_embedded", {
                "trigger": "schema_change",
                "schema_signature": new_signature,
                "embeddings_generated": result.get("successful_embeddings", 0),
                "processing_time": result.get("processing_time_seconds", 0)
            })

            logger.info(f"✅ Schema auto-embedding complete: {result.get('successful_embeddings', 0)} embeddings")

        except Exception as e:
            logger.error(f"❌ Schema auto-embedding failed: {e}")
            self.memory.record_embedding_event("schema_auto_embed_failed", {
                "trigger": "schema_change",
                "error": str(e)
            })

    def get_agent_status(self) -> Dict[str, Any]:
        """Get current agent status and memory."""
        return {
            "is_running": self.is_running,
            "profile_path": str(self.profile_path),
            "profile_exists": self.profile_path.exists(),
            "last_profile_hash": self.memory.last_profile_hash,
            "last_schema_hash": self.memory.last_schema_hash,
            "recent_events": self.memory.history[-10:],  # Last 10 events
            "total_events": len(self.memory.history)
        }


# Global agent instance
auto_embedding_agent = AutoEmbeddingAgent()
