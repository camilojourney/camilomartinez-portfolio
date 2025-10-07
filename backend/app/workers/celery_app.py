"""
Celery application configuration for background workers.

Usage:
    # Start worker
    celery -A app.workers.celery_app worker --loglevel=info

    # Start beat scheduler
    celery -A app.workers.celery_app beat --loglevel=info

    # Start both
    celery -A app.workers.celery_app worker -B --loglevel=info
"""

from celery import Celery
from app.config.settings import settings

# Create Celery app
app = Celery(
    'camilo_analytics',
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        'app.workers.tasks.strava',
        'app.workers.tasks.database',
        'app.workers.tasks.astoria',
    ]
)

# Load configuration from module
app.config_from_object('app.workers.celeryconfig')

if __name__ == '__main__':
    app.start()
