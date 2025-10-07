# 🤖 Autonomous Embedding Agent

## Overview

The Autonomous Embedding Agent is a self-learning system that automatically manages embedding generation for your RAG (Retrieval-Augmented Generation) pipeline. It monitors file changes and database schema modifications, intelligently deciding when and what to re-embed.

## Architecture

Based on **2025 Agentic RAG best practices**, this implementation combines:

- **Agentic Design Patterns** (Planning, Tool Use, Memory, Reflection)
- **Event-Driven Architecture** (File system events + Database monitoring)
- **Self-Learning Capabilities** (Hash-based change detection, debouncing, history tracking)

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│         Autonomous Embedding Agent                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐        ┌─────────────────┐           │
│  │ File Watcher │───────▶│  Agent Brain    │           │
│  │  (Watchdog)  │        │  (Orchestrator) │           │
│  └──────────────┘        └─────────────────┘           │
│                                  │                       │
│  ┌──────────────┐                │                       │
│  │   Schema     │────────────────┘                       │
│  │   Monitor    │                                        │
│  └──────────────┘        ┌─────────────────┐           │
│                          │  Memory Store   │           │
│  ┌──────────────┐        │  (History)      │           │
│  │  Embedding   │◀───────└─────────────────┘           │
│  │   Pipeline   │                                        │
│  └──────────────┘                                        │
└─────────────────────────────────────────────────────────┘
```

## Features

### 1. **File System Monitoring**
- Watches `docs/knowledge/CAMILO_PROFILE.md` for changes
- Uses **watchdog** library with inotify/FSEvents
- **Debouncing** (5 seconds) to avoid redundant triggers during rapid edits
- **Hash-based change detection** to avoid re-embedding identical content

### 2. **Database Schema Monitoring**
- Polls PostgreSQL schema every 5 minutes
- Monitors relevant tables: `daily_fitness_snapshot`, `run_performance_details`, etc.
- Detects column additions, type changes, and schema modifications
- Triggers full re-embedding when schema changes

### 3. **Intelligent Decision Making**

The agent uses **planning and reflection** to decide actions:

| Trigger | Detection | Decision | Action |
|---------|-----------|----------|--------|
| Profile file modified | Hash comparison | Content changed? | Profile-only re-embed |
| Profile file modified | Hash comparison | Content unchanged | Skip (no action) |
| Schema change detected | Signature comparison | Schema modified | Full re-embed |
| Redundant trigger | Debounce timer | Within 5 seconds | Cancel and restart timer |

### 4. **Memory & History Tracking**
- Stores last 100 embedding events
- Tracks:
  - When embeddings were generated
  - What triggered the embedding
  - How many embeddings were created
  - Processing time
  - Errors and failures

### 5. **Cost Optimization**

**Profile-only mode** saves API calls:
- Only re-embeds profile sections (8-10 items)
- Keeps WHOOP/Strava schema embeddings intact (20+ items)
- **Reduces cost by ~60-70%** for profile updates

## API Endpoints

### Start the Agent
```bash
POST /api/ai/agent/embedding/start
```

**Response:**
```json
{
  "status": "success",
  "message": "Autonomous embedding agent started successfully",
  "data": {
    "is_running": true,
    "profile_path": "/path/to/CAMILO_PROFILE.md",
    "profile_exists": true,
    "recent_events": []
  }
}
```

### Stop the Agent
```bash
POST /api/ai/agent/embedding/stop
```

### Check Agent Status
```bash
GET /api/ai/agent/embedding/status
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "is_running": true,
    "profile_path": "/Users/camilo/.../CAMILO_PROFILE.md",
    "profile_exists": true,
    "last_profile_hash": "a3f7d8e9c1b2...",
    "last_schema_hash": "7b2e9f1a8c3d...",
    "recent_events": [
      {
        "timestamp": "2025-01-15T10:30:00",
        "event_type": "profile_auto_embedded",
        "metadata": {
          "trigger": "profile_modified",
          "embeddings_generated": 8,
          "processing_time": 2.3
        }
      }
    ],
    "total_events": 15
  }
}
```

## Usage Examples

### Basic Setup

1. **Install dependencies:**
```bash
cd backend
poetry install
```

2. **Start the backend:**
```bash
poetry run uvicorn app.main:app --reload --port 8000
```

3. **Start the agent:**
```bash
curl -X POST http://localhost:8000/api/ai/agent/embedding/start
```

4. **Edit your profile:**
```bash
# Edit docs/knowledge/CAMILO_PROFILE.md
# The agent will automatically detect changes and re-embed!
```

### Manual Embedding (Without Agent)

```bash
# Full re-embedding (all schema + profile)
curl -X POST "http://localhost:8000/api/ai/schema/embeddings/generate?clear_existing=true"

# Profile-only re-embedding (faster, cheaper)
curl -X POST "http://localhost:8000/api/ai/schema/embeddings/generate?only_profile=true"
```

## Technical Implementation

### File Watcher (Watchdog)

```python
class ProfileFileWatcher(FileSystemEventHandler):
    def on_modified(self, event):
        if event.src_path.endswith('CAMILO_PROFILE.md'):
            # Debounce: Wait 5 seconds
            await asyncio.sleep(5)
            # Check hash to avoid redundant work
            if content_changed():
                await agent.handle_profile_change()
```

### Schema Monitor (PostgreSQL)

```python
class DatabaseSchemaMonitor:
    async def start_monitoring(self):
        while True:
            current_schema = await get_schema_signature()
            if current_schema != last_schema:
                await agent.handle_schema_change()
            await asyncio.sleep(300)  # Check every 5 min
```

### Agent Decision Logic

```python
async def handle_profile_change(self, event_type, file_path):
    # Reflection: Did content actually change?
    if not self.memory.has_profile_changed(file_path):
        logger.info("Content unchanged, skipping")
        return

    # Planning: Decide strategy (profile-only vs full)
    logger.info("Re-embed profile only (optimized)")

    # Tool Use: Execute embedding generation
    result = await schema_embedding_service.generate_embeddings(
        only_profile=True
    )

    # Memory: Record the event
    self.memory.record_embedding_event("profile_auto_embedded", result)
```

## Benefits

### 1. **Zero Manual Work**
- No need to remember to run embedding scripts
- Automatic synchronization with documentation changes

### 2. **Cost Efficient**
- Profile-only mode reduces OpenAI API costs by 60-70%
- Hash-based detection avoids redundant embeddings

### 3. **Always Up-to-Date**
- RAG system always has latest profile information
- Database schema changes trigger automatic updates

### 4. **Production Ready**
- Error handling and retry logic
- Event history for debugging
- Status monitoring via API

### 5. **Agentic Architecture**
- Self-learning through reflection
- Intelligent planning and decision-making
- Memory-driven optimization

## Configuration

### Debounce Time (File Watcher)
```python
# In ProfileFileWatcher.__init__
self.debounce_seconds = 5  # Adjust as needed
```

### Schema Check Interval
```python
# In DatabaseSchemaMonitor.__init__
self.check_interval_seconds = 300  # 5 minutes (adjust as needed)
```

### Monitored Tables
```python
# In DatabaseSchemaMonitor.get_schema_signature()
WHERE table_name IN (
    'daily_fitness_snapshot',
    'run_performance_details',
    # Add more tables here
)
```

## Advanced: Integration with LangGraph (Future Enhancement)

For even more sophisticated orchestration, you could integrate with **LangGraph**:

```python
from langgraph.graph import StateGraph

# Define agent states
workflow = StateGraph()
workflow.add_node("detect_change", detect_file_change)
workflow.add_node("plan_strategy", decide_embedding_strategy)
workflow.add_node("execute_embedding", run_embedding_pipeline)
workflow.add_node("validate_quality", check_embedding_quality)

# Build graph
workflow.add_edge("detect_change", "plan_strategy")
workflow.add_edge("plan_strategy", "execute_embedding")
workflow.add_edge("execute_embedding", "validate_quality")
```

## Monitoring & Debugging

### View Recent Events
```bash
curl http://localhost:8000/api/ai/agent/embedding/status | jq '.data.recent_events'
```

### Check File Hash
```bash
md5 docs/knowledge/CAMILO_PROFILE.md
```

### View Backend Logs
```bash
# Look for agent emoji indicators
🤖 Starting Autonomous Embedding Agent...
📁 Watching directory: /path/to/docs/knowledge
🧠 Agent processing profile change: profile_modified
📋 Agent decision: Re-embed profile (optimized strategy)
✅ Auto-embedding complete: 8 embeddings
```

## Troubleshooting

### Agent not detecting changes?
1. Check agent is running: `GET /api/ai/agent/embedding/status`
2. Verify file path exists: Check `profile_exists` in status response
3. Check backend logs for watchdog errors

### Changes detected but not re-embedding?
1. Verify hash changed (content actually modified)
2. Check for errors in recent_events
3. Ensure OpenAI API key is configured

### Schema changes not detected?
1. Schema monitor runs every 5 minutes (wait for next check)
2. Check database connection is healthy
3. Verify monitored tables are correct

## References

- **ArXiv Paper**: [Agentic RAG Survey (2501.09136)](https://arxiv.org/abs/2501.09136)
- **IBM Agentic RAG**: [What is Agentic RAG?](https://www.ibm.com/think/topics/agentic-rag)
- **Watchdog Docs**: [Python Watchdog](https://python-watchdog.readthedocs.io/)
- **LangGraph**: [Building Agentic Systems](https://blog.langchain.com/building-langgraph/)

---

*Last Updated: January 2025*
*Architecture: Event-Driven Agentic RAG*
*Status: Production Ready ✅*
