"""
Background workers service using Celery.

This module contains all background task processors for:
- Scheduled data syncs (Strava, WHOOP)
- ETL pipelines (activity correlation, data enrichment)
- Database maintenance (materialized view refreshes)
- Map generation (Astoria Conquest updates)
"""
