"""
Simple FastAPI webhook API for triggering Astoria updates from Vercel cron.

This service runs on Render.com and receives webhook calls from Vercel.
"""

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import JSONResponse
import subprocess
import os
from pathlib import Path
import logging
from typing import Optional

app = FastAPI()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Secret for webhook authentication
WEBHOOK_SECRET = os.getenv('WORKER_WEBHOOK_SECRET', 'change-me-in-production')


def verify_auth(authorization: Optional[str] = Header(None)):
    """Verify webhook authentication"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    token = authorization.replace('Bearer ', '').strip()
    if token != WEBHOOK_SECRET:
        logger.error('❌ Unauthorized webhook request')
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get('/health')
def health_check():
    """Health check endpoint for Render.com"""
    return {
        'status': 'healthy',
        'service': 'astoria-worker',
        'version': '1.0.0'
    }


@app.post('/webhook/correlate-activities')
def correlate_activities_webhook(authorization: Optional[str] = Header(None)):
    """
    Webhook endpoint to trigger activity correlation.

    Matches Strava runs with WHOOP workouts based on time proximity.

    Expected request:
    POST /webhook/correlate-activities
    Headers:
      Authorization: Bearer <WORKER_WEBHOOK_SECRET>
    """
    try:
        # Verify authorization
        verify_auth(authorization)

        logger.info('🔄 Starting activity correlation...')

        # Import and run the correlation task
        from app.workers.tasks.strava import correlate_activities
        result = correlate_activities()

        logger.info(f'✅ Activity correlation completed: {result.get("correlations_created", 0)} matches created')
        return result

    except ImportError as e:
        logger.error(f'❌ Failed to import correlation module: {str(e)}')
        raise HTTPException(
            status_code=500,
            detail={
                'success': False,
                'error': 'Correlation module not available',
                'details': str(e)
            }
        )

    except Exception as e:
        logger.error(f'❌ Correlation failed: {str(e)}')
        raise HTTPException(
            status_code=500,
            detail={
                'success': False,
                'error': str(e)
            }
        )


@app.post('/webhook/astoria-update')
def astoria_update_webhook(authorization: Optional[str] = Header(None)):
    """
    Webhook endpoint to trigger Astoria Conquest map update.

    Expected request:
    POST /webhook/astoria-update
    Headers:
      Authorization: Bearer <WORKER_WEBHOOK_SECRET>
    """
    try:
        # Verify authorization
        verify_auth(authorization)

        logger.info('🗺️ Starting Astoria Conquest map update...')

        # Get script path
        backend_dir = Path(__file__).parent.parent
        script_path = backend_dir / 'scripts' / 'astoria' / 'update_progress.py'

        if not script_path.exists():
            logger.error(f'❌ Script not found: {script_path}')
            raise HTTPException(status_code=500, detail={'error': 'Script not found'})

        # Run the Python script
        result = subprocess.run(
            ['python3', str(script_path)],
            cwd=str(backend_dir.parent),
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes
        )

        if result.returncode == 0:
            logger.info('✅ Astoria map update completed successfully')
            return {
                'success': True,
                'message': 'Astoria map updated successfully',
                'output': result.stdout[-500:]  # Last 500 chars
            }
        else:
            logger.error(f'❌ Script failed: {result.stderr}')
            raise HTTPException(
                status_code=500,
                detail={
                    'success': False,
                    'error': 'Script execution failed',
                    'stderr': result.stderr[-500:]
                }
            )

    except subprocess.TimeoutExpired:
        logger.error('❌ Script timed out after 5 minutes')
        raise HTTPException(
            status_code=408,
            detail={
                'success': False,
                'error': 'Script execution timed out'
            }
        )

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f'❌ Unexpected error: {str(e)}')
        raise HTTPException(
            status_code=500,
            detail={
                'success': False,
                'error': str(e)
            }
        )


if __name__ == '__main__':
    import uvicorn
    port = int(os.getenv('PORT', 8000))
    uvicorn.run(app, host='0.0.0.0', port=port)
