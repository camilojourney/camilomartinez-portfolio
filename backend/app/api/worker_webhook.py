"""
Simple Flask webhook API for triggering Astoria updates from Vercel cron.

This service runs on Render.com and receives webhook calls from Vercel.
"""

from flask import Flask, request, jsonify
import subprocess
import os
from pathlib import Path
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Secret for webhook authentication
WEBHOOK_SECRET = os.getenv('WORKER_WEBHOOK_SECRET', 'change-me-in-production')


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for Render.com"""
    return jsonify({
        'status': 'healthy',
        'service': 'astoria-worker',
        'version': '1.0.0'
    })


@app.route('/webhook/astoria-update', methods=['POST'])
def astoria_update_webhook():
    """
    Webhook endpoint to trigger Astoria Conquest map update.

    Expected request:
    POST /webhook/astoria-update
    Headers:
      Authorization: Bearer <WORKER_WEBHOOK_SECRET>
    """
    try:
        # Verify authorization
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.replace('Bearer ', '').strip()

        if token != WEBHOOK_SECRET:
            logger.error('❌ Unauthorized webhook request')
            return jsonify({'error': 'Unauthorized'}), 401

        logger.info('🗺️ Starting Astoria Conquest map update...')

        # Get script path
        backend_dir = Path(__file__).parent.parent
        script_path = backend_dir / 'scripts' / 'astoria' / 'update_progress.py'

        if not script_path.exists():
            logger.error(f'❌ Script not found: {script_path}')
            return jsonify({'error': 'Script not found'}), 500

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
            return jsonify({
                'success': True,
                'message': 'Astoria map updated successfully',
                'output': result.stdout[-500:]  # Last 500 chars
            })
        else:
            logger.error(f'❌ Script failed: {result.stderr}')
            return jsonify({
                'success': False,
                'error': 'Script execution failed',
                'stderr': result.stderr[-500:]
            }), 500

    except subprocess.TimeoutExpired:
        logger.error('❌ Script timed out after 5 minutes')
        return jsonify({
            'success': False,
            'error': 'Script execution timed out'
        }), 408

    except Exception as e:
        logger.error(f'❌ Unexpected error: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
