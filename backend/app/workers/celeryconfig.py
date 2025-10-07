"""
Celery configuration and beat schedule.

Defines when and how often background tasks run.
"""

from celery.schedules import crontab

# Task execution settings
task_serializer = 'json'
accept_content = ['json']
result_serializer = 'json'
timezone = 'America/New_York'
enable_utc = True

# Result backend settings
result_expires = 3600  # 1 hour

# Worker settings
worker_prefetch_multiplier = 1
worker_max_tasks_per_child = 1000

# Beat schedule - when tasks run
beat_schedule = {
    # Strava sync every Monday at 1 PM (includes automatic token refresh)
    'strava-weekly-sync': {
        'task': 'app.workers.tasks.strava.sync_strava_weekly',
        'schedule': crontab(hour=13, minute=0, day_of_week=1),
        'options': {'expires': 3600}
    },

    # Activity correlation on Mondays at 1:15 PM (after Strava sync at 1:00 PM)
    'correlate-activities-monday': {
        'task': 'app.workers.tasks.strava.correlate_activities',
        'schedule': crontab(hour=13, minute=15, day_of_week=1),
        'options': {'expires': 1800}
    },

    # Update Astoria Conquest map on Mondays at 1:30 PM (after correlation)
    'update-astoria-progress-monday': {
        'task': 'app.workers.tasks.astoria.update_progress',
        'schedule': crontab(hour=13, minute=30, day_of_week=1),
        'options': {'expires': 3600}
    },

    # Refresh materialized views daily at 2 AM
    'refresh-materialized-views': {
        'task': 'app.workers.tasks.database.refresh_materialized_views',
        'schedule': crontab(hour=2, minute=0),
        'options': {'expires': 3600}
    },
}

# Task routing
task_routes = {
    'app.workers.tasks.strava.*': {'queue': 'integrations'},
    'app.workers.tasks.database.*': {'queue': 'database'},
    'app.workers.tasks.astoria.*': {'queue': 'compute'},
}
