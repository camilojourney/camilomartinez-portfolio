"""
Astoria Conquest map generation background tasks.

Tasks:
- update_progress: Update Astoria Conquest progress map
"""

import logging
import subprocess
from typing import Dict, Any
from datetime import datetime
from pathlib import Path

from app.workers.celery_app import app

logger = logging.getLogger(__name__)


@app.task(name='app.workers.tasks.astoria.update_progress')
def update_progress() -> Dict[str, Any]:
    """
    Update Astoria Conquest progress map.

    Runs the Python script: backend/app/scripts/astoria/update_progress.py

    This task:
    1. Fetches all Strava runs with polylines
    2. Matches them against Astoria street network
    3. Generates updated map visualization
    4. Exports to src/data/astoria-conquest/

    Returns:
        Dict with update statistics
    """
    logger.info("🗺️ Starting Astoria Conquest progress update...")

    # Get script path (backend/app/workers/tasks -> backend/app/scripts/astoria)
    backend_dir = Path(__file__).parent.parent.parent
    script_path = backend_dir / "scripts" / "astoria" / "update_progress.py"
    project_root = backend_dir.parent

    if not script_path.exists():
        error_msg = f"Script not found: {script_path}"
        logger.error(f"❌ {error_msg}")
        return {
            "status": "error",
            "error": error_msg,
            "timestamp": datetime.utcnow().isoformat()
        }

    try:
        start_time = datetime.utcnow()

        # Run the Python script
        result = subprocess.run(
            ["python3", str(script_path)],
            cwd=str(project_root),
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )

        duration = (datetime.utcnow() - start_time).total_seconds()

        if result.returncode == 0:
            logger.info(f"✅ Astoria Conquest update completed in {duration:.2f}s")
            return {
                "status": "success",
                "duration_seconds": duration,
                "stdout": result.stdout,
                "timestamp": datetime.utcnow().isoformat()
            }
        else:
            logger.error(f"❌ Astoria update failed: {result.stderr}")
            return {
                "status": "error",
                "error": result.stderr,
                "duration_seconds": duration,
                "timestamp": datetime.utcnow().isoformat()
            }

    except subprocess.TimeoutExpired:
        logger.error("❌ Astoria update timed out after 5 minutes")
        return {
            "status": "error",
            "error": "Task timed out after 5 minutes",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"❌ Astoria update failed: {str(e)}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
