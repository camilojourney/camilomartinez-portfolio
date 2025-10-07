

# 🔧 Background Workers Service

> **Purpose**: Automated background tasks for data synchronization, ETL pipelines, and maintenance operations
> **Technology**: Celery + Redis
> **Status**: Production-ready

---

## 📋 Overview

The Workers Service handles all asynchronous and scheduled tasks that don't belong in the HTTP request/response cycle:

- **Data Synchronization**: Strava/WHOOP API polling
- **ETL Pipelines**: Activity correlation, data enrichment
- **Database Maintenance**: Materialized view refreshes
- **Map Generation**: Astoria Conquest progress updates

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Task Scheduler (Celery Beat)             │
│  Triggers tasks at scheduled times (cron-like)               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Message Broker (Redis)                    │
│  Queues: integrations, database, compute                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Celery Workers (Python)                    │
│  Process tasks from queues asynchronously                    │
│  ├─ tasks/strava.py     (integrations queue)                 │
│  ├─ tasks/database.py   (database queue)                     │
│  └─ tasks/astoria.py    (compute queue)                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    PostgreSQL + File System
```

---

## 🚀 Quick Start

### Prerequisites

```bash
# Install Redis
brew install redis
brew services start redis

# Verify Redis is running
redis-cli ping  # Should return "PONG"
```

### Running Workers Locally

```bash
# Terminal 1: Start Celery Worker
cd backend
poetry run celery -A app.workers.celery_app worker --loglevel=info

# Terminal 2: Start Celery Beat (Scheduler)
poetry run celery -A app.workers.celery_app beat --loglevel=info

# Or run both together:
poetry run celery -A app.workers.celery_app worker -B --loglevel=info
```

### Running with Docker Compose

```yaml
# docker-compose.yml
services:
  workers:
    build: ./backend
    command: celery -A app.workers.celery_app worker -B --loglevel=info
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
      - postgres

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

---

## 📊 Task Inventory

### Scheduled Tasks (Celery Beat)

| Task | Schedule | Queue | Description |
|------|----------|-------|-------------|
| `strava.sync_strava_weekly` | Mon 1:00 PM | integrations | Fetch new Strava activities (auto-refreshes tokens) |
| `strava.correlate_activities` | Mon 1:15 PM | integrations | Match Strava ↔ WHOOP workouts |
| `database.refresh_materialized_views` | Daily 2:00 AM | database | Refresh AI serving views |
| `astoria.update_progress` | Mon 1:30 PM | compute | Update Astoria map |

### Monday Workflow (Sequential Dependencies)

The Monday workflow runs in a specific sequence to ensure data dependencies:

```
1:00 PM → Strava Weekly Sync      (fetch new Strava activities)
              ↓
1:15 PM → Activity Correlation    (match Strava runs ↔ WHOOP workouts)
              ↓
1:30 PM → Astoria Conquest Update (update map with new runs)
```

Each task depends on the previous one completing successfully.

### On-Demand Tasks

```python
from app.workers.tasks.strava import correlate_activities

# Trigger immediately
result = correlate_activities.delay()

# Get result
print(result.get(timeout=30))
```

---

## 🔧 Configuration

### Schedule Configuration (`celeryconfig.py`)

```python
beat_schedule = {
    'correlate-activities': {
        'task': 'app.workers.tasks.strava.correlate_activities',
        'schedule': crontab(hour=19, minute=30),
        'options': {'expires': 1800}  # Task expires in 30 min if not picked up
    },
}
```

### Task Routing (Queues)

Tasks are routed to different queues based on their resource needs:

- **integrations**: External API calls (rate-limited, retryable)
- **database**: Database-heavy operations (serialized)
- **compute**: CPU-intensive tasks (map generation, analytics)

---

## 📈 Monitoring

### Flower (Celery Web UI)

```bash
# Install Flower
poetry add flower

# Start Flower
poetry run celery -A app.workers.celery_app flower

# Access at: http://localhost:5555
```

### Task Inspection

```bash
# List active tasks
celery -A app.workers.celery_app inspect active

# List scheduled tasks
celery -A app.workers.celery_app inspect scheduled

# List registered tasks
celery -A app.workers.celery_app inspect registered

# Purge all tasks
celery -A app.workers.celery_app purge
```

### Logs

```bash
# Worker logs
tail -f /var/log/celery/worker.log

# Beat scheduler logs
tail -f /var/log/celery/beat.log
```

---

## 🧪 Testing Tasks

### Test Individual Tasks

```python
# Test from Python shell
poetry run python

>>> from app.workers.tasks.strava import correlate_activities
>>> result = correlate_activities()
>>> print(result)
{
    'status': 'success',
    'candidates_found': 3,
    'correlations_created': 2,
    'timestamp': '2025-10-07T19:30:00'
}
```

### Test Full Monday Workflow

Test the complete sequential workflow to ensure all tasks work together:

```bash
poetry run python -c "
from app.workers.tasks.strava import sync_strava_weekly, correlate_activities
from app.workers.tasks.astoria import update_progress
from datetime import datetime

print('🔄 Testing Full Monday Workflow Sequence...\n')

# 1. Strava Sync (1:00 PM)
print('📊 Step 1/3: Strava Weekly Sync')
start = datetime.utcnow()
strava_result = sync_strava_weekly()
print(f'✅ Duration: {(datetime.utcnow() - start).total_seconds():.1f}s')
print(f'   Activities synced: {strava_result[\"activities_synced\"]}\n')

# 2. Activity Correlation (1:15 PM)
print('🔗 Step 2/3: Activity Correlation')
start = datetime.utcnow()
correlation_result = correlate_activities()
print(f'✅ Duration: {(datetime.utcnow() - start).total_seconds():.1f}s')
print(f'   Correlations created: {correlation_result[\"correlations_created\"]}\n')

# 3. Astoria Update (1:30 PM)
print('🗺️  Step 3/3: Astoria Conquest Update')
start = datetime.utcnow()
astoria_result = update_progress()
print(f'✅ Duration: {(datetime.utcnow() - start).total_seconds():.1f}s')
print(f'   Status: {astoria_result[\"status\"]}')

print('\n✅ Full Monday Workflow Completed!')
"
```

**Expected Output**:
```
🔄 Testing Full Monday Workflow Sequence...

📊 Step 1/3: Strava Weekly Sync
✅ Duration: 1.5s
   Activities synced: 0

🔗 Step 2/3: Activity Correlation
✅ Duration: 0.3s
   Correlations created: 0

🗺️  Step 3/3: Astoria Conquest Update
✅ Duration: 1.2s
   Status: success

✅ Full Monday Workflow Completed!
```

### Test with Celery

```bash
# Call task asynchronously
poetry run celery -A app.workers.celery_app call app.workers.tasks.strava.correlate_activities

# Inspect result
poetry run celery -A app.workers.celery_app result <task-id>
```

---

## 🚨 Troubleshooting

### Redis Connection Errors

```
Error: Error 61 connecting to localhost:6379. Connection refused.
```

**Fix**:
```bash
brew services start redis
```

### Task Not Running

1. Check if worker is running: `celery -A app.workers.celery_app inspect ping`
2. Check if task is registered: `celery -A app.workers.celery_app inspect registered`
3. Check beat schedule: `celery -A app.workers.celery_app inspect scheduled`

### Import Errors

```
Error: No module named 'app.workers.tasks.strava'
```

**Fix**: Make sure you're running from `/backend` directory
```bash
cd backend
poetry run celery -A app.workers.celery_app worker
```

---

## 📝 Adding New Tasks

### Step 1: Create Task Function

```python
# app/workers/tasks/my_module.py
from app.workers.celery_app import app

@app.task(name='app.workers.tasks.my_module.my_task')
def my_task(param1: str) -> dict:
    """Task description."""
    # Your logic here
    return {"status": "success"}
```

### Step 2: Register in Celery App

```python
# app/workers/celery_app.py
app = Celery(
    'camilo_analytics',
    include=[
        'app.workers.tasks.strava',
        'app.workers.tasks.my_module',  # Add here
    ]
)
```

### Step 3: Add Schedule (Optional)

```python
# app/workers/celeryconfig.py
beat_schedule = {
    'my-scheduled-task': {
        'task': 'app.workers.tasks.my_module.my_task',
        'schedule': crontab(hour=8, minute=0),
    },
}
```

---

## 🔄 Migration from Scripts

### Before (Scripts)

```bash
# Manual execution
node scripts/pipelines/activity-correlation-etl.js

# Vercel cron job
{
  "crons": [{
    "path": "/api/cron/strava-weekly-sync",
    "schedule": "0 13 * * 1"
  }]
}
```

### After (Celery Workers)

```bash
# Automatic execution via Celery Beat
# No manual intervention needed

# Or trigger manually
poetry run celery -A app.workers.celery_app call \
  app.workers.tasks.strava.correlate_activities
```

### Benefits

✅ **Reliability**: Automatic retries, error handling
✅ **Monitoring**: Built-in Flower dashboard
✅ **Scalability**: Horizontal worker scaling
✅ **Consistency**: All Python (no JS/Python mixing)
✅ **Production-Ready**: Battle-tested task queue system

---

## 📚 Resources

- [Celery Documentation](https://docs.celeryproject.org/)
- [Redis Documentation](https://redis.io/docs/)
- [Flower Documentation](https://flower.readthedocs.io/)
- [Best Practices Guide](https://docs.celeryproject.org/en/stable/userguide/tasks.html#best-practices)

---

*For production deployment, see `/docs/operations/DEPLOYMENT.md`*
