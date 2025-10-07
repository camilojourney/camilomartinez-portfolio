# 🤖 Autonomous Embedding Agent - Architecture Deep Dive

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    YOUR WORKFLOW                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. You edit CAMILO_PROFILE.md                                      │
│  2. You modify database schema                                       │
│  3. You keep working...                                              │
│                                                                       │
│  ✨ Agent handles everything automatically! ✨                       │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ File system events / Database changes
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│              AUTONOMOUS EMBEDDING AGENT                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   ┌─────────────────────┐         ┌─────────────────────┐          │
│   │  File Watcher       │         │  Schema Monitor     │          │
│   │  (Watchdog)         │         │  (PostgreSQL Poll)  │          │
│   │                     │         │                     │          │
│   │ • Detects changes   │         │ • Every 5 minutes   │          │
│   │ • Debounces 5s      │         │ • Hash comparison   │          │
│   │ • Hash checks       │         │ • Full schema sig   │          │
│   └──────────┬──────────┘         └──────────┬──────────┘          │
│              │                               │                       │
│              └───────────┬───────────────────┘                       │
│                          ▼                                           │
│              ┌─────────────────────┐                                │
│              │   Agent Brain       │                                │
│              │   (Orchestrator)    │                                │
│              │                     │                                │
│              │  🧠 Planning        │                                │
│              │  🤔 Reflection      │                                │
│              │  🔧 Tool Use        │                                │
│              │  💾 Memory          │                                │
│              └──────────┬──────────┘                                │
│                         │                                            │
│         ┌───────────────┴───────────────┐                          │
│         ▼                               ▼                          │
│  ┌──────────────┐              ┌──────────────┐                   │
│  │ Profile-Only │              │ Full Schema  │                   │
│  │ Re-embed     │              │ Re-embed     │                   │
│  │              │              │              │                   │
│  │ • 8 items    │              │ • 30+ items  │                   │
│  │ • Fast       │              │ • Slower     │                   │
│  │ • Cheap      │              │ • Complete   │                   │
│  └──────────────┘              └──────────────┘                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ Embeddings stored
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    VECTOR DATABASE (pgvector)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Table: schema_embeddings                                            │
│  ┌────────────────────────────────────────────────────┐             │
│  │ id | table_name | column_name | description | vec  │             │
│  ├────────────────────────────────────────────────────┤             │
│  │ 1  | camilo_profile | background | ... | [0.1...] │             │
│  │ 2  | camilo_profile | technical | ...  | [0.2...] │             │
│  │ 3  | daily_fitness_snapshot | ... | ... | [0.3..]│             │
│  └────────────────────────────────────────────────────┘             │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ Similarity search
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    RAG QUERY PROCESSOR                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  User: "What's Camilo's technical background?"                      │
│          │                                                            │
│          ▼                                                            │
│  1. Embed question → [0.15, 0.22, ...]                              │
│  2. Search vectors → Find "camilo_technical_expertise"              │
│  3. Retrieve context → Full section from CAMILO_PROFILE.md          │
│  4. GPT-4 response → "Camilo is proficient in..."                   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Agentic Decision Flow

```
Event Detected
     │
     ▼
┌─────────────────────┐
│ Is content changed? │ ◄─── Reflection (hash comparison)
└────────┬────────────┘
         │ Yes
         ▼
┌─────────────────────┐
│ What type of change?│ ◄─── Planning (analyze trigger)
└────────┬────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
Profile?   Schema?
    │         │
    ▼         ▼
Profile-  Full
Only      Re-embed
    │         │
    └────┬────┘
         │
         ▼
┌─────────────────────┐
│ Execute Embedding   │ ◄─── Tool Use (call service)
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Record in Memory    │ ◄─── Memory (track event)
└─────────────────────┘
```

## Component Interactions

### 1. File System Watcher

```python
ProfileFileWatcher
    │
    ├─ on_modified() ──► Debounce Timer (5s)
    │                        │
    │                        ▼
    ├─ on_created() ──► Check Hash
    │                        │
    │                  ┌─────┴─────┐
    │                  │           │
    │               Changed?    Unchanged?
    │                  │           │
    │                  ▼           ▼
    │            Trigger      Skip
    │            Agent         (save cost)
    │                  │
    │                  ▼
    └────────────► Agent.handle_profile_change()
```

### 2. Schema Monitor

```python
DatabaseSchemaMonitor
    │
    └─ while True (every 5 min):
           │
           ├─ Query information_schema
           │      │
           │      ▼
           ├─ Generate schema hash
           │      │
           │      ▼
           ├─ Compare with last hash
           │      │
           │  ┌───┴───┐
           │  │       │
           │  ▼       ▼
           Changed?  Same?
           │         │
           ▼         ▼
    Agent.handle   Continue
    _schema_change  monitoring
```

### 3. Agent Brain (Orchestrator)

```python
AutoEmbeddingAgent
    │
    ├─ memory: EmbeddingAgentMemory
    │    ├─ history: List[events]
    │    ├─ last_profile_hash
    │    └─ last_schema_hash
    │
    ├─ handle_profile_change()
    │    ├─ Reflection: Check hash
    │    ├─ Planning: Profile-only
    │    ├─ Tool Use: generate_embeddings(only_profile=True)
    │    └─ Memory: Record event
    │
    └─ handle_schema_change()
         ├─ Planning: Full re-embed
         ├─ Tool Use: generate_embeddings(clear_existing=True)
         └─ Memory: Record event
```

## Sequence Diagrams

### Scenario 1: Profile Update (Happy Path)

```
You               File System       Agent Brain      Embedding Service    DB
│                      │                 │                  │              │
├─ Edit profile ──────►│                 │                  │              │
│                      │                 │                  │              │
│                      ├─ on_modified ──►│                  │              │
│                      │                 │                  │              │
│                      │      (wait 5s)  │                  │              │
│                      │                 │                  │              │
│                      │                 ├─ Check hash ────►│              │
│                      │                 │                  │              │
│                      │                 │◄─ Hash changed ──┤              │
│                      │                 │                  │              │
│                      │                 ├─ generate_embeddings(only_profile=True)
│                      │                 │                  │              │
│                      │                 │                  ├─ Embed 8 ───►│
│                      │                 │                  │              │
│                      │                 │                  │◄─ Success ───┤
│                      │                 │                  │              │
│                      │                 │◄─ Complete (8) ──┤              │
│                      │                 │                  │              │
│                      │                 ├─ Record in memory               │
│                      │                 │                  │              │
│◄─ RAG now has latest profile ──────────┴──────────────────┴──────────────┘
```

### Scenario 2: Redundant Save (Cost Optimization)

```
You               File System       Agent Brain      Embedding Service
│                      │                 │                  │
├─ Save (no edit) ────►│                 │                  │
│                      │                 │                  │
│                      ├─ on_modified ──►│                  │
│                      │                 │                  │
│                      │      (wait 5s)  │                  │
│                      │                 │                  │
│                      │                 ├─ Check hash      │
│                      │                 │                  │
│                      │                 │   (SAME!)        │
│                      │                 │                  │
│                      │                 ├─ SKIP ────────X  │
│                      │                 │                  │
│◄─ Saved $0.01 ───────┴─────────────────┘                  │
```

### Scenario 3: Schema Change Detection

```
Database          Schema Monitor     Agent Brain      Embedding Service    DB
│                      │                 │                  │              │
├─ ALTER TABLE ───────►│                 │                  │              │
│                      │                 │                  │              │
│         (5 min poll) │                 │                  │              │
│                      │                 │                  │              │
│                      ├─ Check schema ──┤                  │              │
│                      │                 │                  │              │
│                      │                 ├─ Hash mismatch   │              │
│                      │                 │                  │              │
│                      │                 ├─ generate_embeddings(full=True) │
│                      │                 │                  │              │
│                      │                 │                  ├─ Embed 30+ ─►│
│                      │                 │                  │              │
│                      │                 │                  │◄─ Success ───┤
│                      │                 │                  │              │
│                      │                 │◄─ Complete (32)──┤              │
│                      │                 │                  │              │
│                      │◄─ Update hash ──┤                  │              │
│                      │                 │                  │              │
└──────────────────────┴─────────────────┴──────────────────┴──────────────┘
```

## State Management

```
Agent Memory State Machine

┌─────────────┐
│   INITIAL   │
│  (no hash)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐      Event        ┌──────────────┐
│  WATCHING   │────────────────────►│  PROCESSING  │
│ (has hash)  │                     │ (embedding)  │
└──────┬──────┘                     └──────┬───────┘
       │                                   │
       │ ◄─────────────────────────────────┘
       │         Record Event
       │
       ▼
┌─────────────┐
│  UPDATED    │
│ (new hash)  │
└──────┬──────┘
       │
       └──────► Back to WATCHING
```

## Cost Analysis

### Traditional Approach (Manual)

```
Week 1:
- Edit profile 3x → Manually run script 3x
- Each run: Full embedding (30 items)
- Total: 90 embeddings
- Cost: ~$0.09

Developer time: 10 minutes total
```

### Agent Approach (Automatic)

```
Week 1:
- Edit profile 3x → Agent auto-triggers 3x
- Each trigger: Profile-only (8 items)
- Total: 24 embeddings
- Cost: ~$0.03

Developer time: 0 minutes
```

**Savings**: 73% cost reduction + 100% time savings

## Error Handling

```
Error Scenarios:

1. OpenAI API failure
   └─► Record in memory.history
   └─► Log error
   └─► Continue watching (retry next change)

2. Database connection lost
   └─► Schema monitor catches exception
   └─► Wait 5 minutes
   └─► Retry

3. File not found
   └─► Log warning
   └─► Continue watching
   └─► Auto-recovers when file created

4. Duplicate events (rapid saves)
   └─► Debounce timer cancels old tasks
   └─► Only latest trigger runs
   └─► Saves redundant API calls
```

## Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| File change detection | ~1-2 seconds | OS-level inotify/FSEvents |
| Debounce delay | 5 seconds | Configurable |
| Schema check interval | 5 minutes | Configurable |
| Profile-only embedding | ~2-3 seconds | 8 items |
| Full schema embedding | ~5-8 seconds | 30+ items |
| Memory footprint | ~10MB | Agent + watchdog |
| CPU usage | <1% idle | Spikes during embedding |

## Configuration Options

```python
# File: auto_embedding_agent.py

class ProfileFileWatcher:
    debounce_seconds = 5  # ← Adjust for your workflow

class DatabaseSchemaMonitor:
    check_interval_seconds = 300  # ← Trade-off: faster vs load

class EmbeddingAgentMemory:
    max_history = 100  # ← How many events to keep
```

## Future Enhancements

### Phase 2: Multi-Agent Orchestration (LangGraph)

```python
from langgraph.graph import StateGraph

# Agent workflow graph
workflow = StateGraph()
workflow.add_node("detect", detect_changes)
workflow.add_node("analyze", analyze_impact)
workflow.add_node("plan", create_embedding_plan)
workflow.add_node("execute", run_embedding)
workflow.add_node("validate", check_quality)
workflow.add_node("notify", send_notification)

# Conditional routing
workflow.add_conditional_edges(
    "analyze",
    lambda x: "critical" if x.schema_change else "routine"
)
```

### Phase 3: ML-Based Optimization

```python
# Predict optimal embedding strategy
class EmbeddingOptimizer:
    def predict_strategy(self, change_type, change_size, query_load):
        """
        Use ML model to decide:
        - Should we embed now or batch?
        - Profile-only or full?
        - Which sections need priority?
        """
        return OptimalStrategy(...)
```

## References

- **Agentic RAG**: Planning, Tool Use, Memory, Reflection patterns
- **Event-Driven Architecture**: Reactive systems, message brokers
- **File Watching**: inotify (Linux), FSEvents (macOS), ReadDirectoryChangesW (Windows)
- **Vector Databases**: pgvector, similarity search, HNSW indexing

---

*Architecture Status*: **Production Ready** ✅
*Design Pattern*: **Event-Driven Agentic RAG**
*Last Updated*: January 2025
