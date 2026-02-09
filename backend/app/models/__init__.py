"""Application models package.

SQLAlchemy and Pydantic models are defined in:
- `ai_query.py`
- `strava.py`
- `user.py`
- `whoop.py`

Note: We intentionally import these modules in `app.config.database` so SQLAlchemy
registers all model metadata at startup.
"""

