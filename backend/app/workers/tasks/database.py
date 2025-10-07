"""
Database maintenance background tasks.

Tasks:
- refresh_materialized_views: Refresh all materialized views for AI serving
"""

import logging
from typing import Dict, Any
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.workers.celery_app import app
from app.config.database import async_session_factory

logger = logging.getLogger(__name__)


@app.task(name='app.workers.tasks.database.refresh_materialized_views')
def refresh_materialized_views() -> Dict[str, Any]:
    """
    Refresh all materialized views used for AI serving.

    Views refreshed:
    - daily_fitness_snapshot
    - run_performance_details
    - boxing_performance_details
    - weightlifting_performance_details

    Returns:
        Dict with refresh statistics
    """
    import asyncio
    return asyncio.run(_refresh_views_async())


async def _refresh_views_async() -> Dict[str, Any]:
    """Async implementation of view refresh."""
    logger.info("🔄 Starting materialized view refresh...")

    views = [
        'daily_fitness_snapshot',
        'run_performance_details',
        'boxing_performance_details',
        'weightlifting_performance_details'
    ]

    results = {}
    start_time = datetime.utcnow()

    async with async_session_factory() as db:
        for view_name in views:
            try:
                view_start = datetime.utcnow()

                # Refresh the materialized view
                await db.execute(text(f"REFRESH MATERIALIZED VIEW CONCURRENTLY {view_name}"))
                await db.commit()

                view_duration = (datetime.utcnow() - view_start).total_seconds()
                results[view_name] = {
                    "status": "success",
                    "duration_seconds": view_duration
                }

                logger.info(f"✅ Refreshed {view_name} in {view_duration:.2f}s")

            except Exception as e:
                logger.error(f"❌ Failed to refresh {view_name}: {str(e)}")
                results[view_name] = {
                    "status": "error",
                    "error": str(e)
                }

    total_duration = (datetime.utcnow() - start_time).total_seconds()
    success_count = sum(1 for r in results.values() if r['status'] == 'success')

    logger.info(f"✅ View refresh completed: {success_count}/{len(views)} successful in {total_duration:.2f}s")

    return {
        "status": "completed",
        "total_views": len(views),
        "successful": success_count,
        "failed": len(views) - success_count,
        "duration_seconds": total_duration,
        "results": results,
        "timestamp": datetime.utcnow().isoformat()
    }
