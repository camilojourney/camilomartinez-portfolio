# AI Trainer Agent: Implementation Plan

## 🎯 Vision & Goal

The AI Trainer Agent creates a synthetic, automated loop for refining our Text-to-SQL chatbot. This system moves us from reactive, manual bug fixing to a proactive, continuous improvement workflow.

**Success Metric**: Achieve and maintain a >95% accuracy rate on dynamically generated test queries, tracked and visualized on a dedicated dashboard.

## 🏗️ Core Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Trainer System                        │
├─────────────────────────────────────────────────────────────┤
│  Frontend Dashboard  │  API Endpoint  │  Trainer Engine     │
│  (/ai-trainer)       │  (/api/ai-     │  (run-evaluation-   │
│                      │   trainer/     │   cycle.ts)         │
│  • One-click trigger │   run-cycle)   │                     │
│  • Progress tracking │                │  • Question Gen     │
│  • Results viz       │  • Async       │  • Query Execution  │
│  • Historical data   │    trigger     │  • Result Judging   │
│                      │  • Status      │  • Pattern Analysis │
│                      │    updates     │                     │
└─────────────────────────────────────────────────────────────┘
│
v
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                           │
├─────────────────────────────────────────────────────────────┤
│  evaluation_cycles           │  query_history (enhanced)    │
│  • Cycle metadata           │  • Individual query results  │
│  • Success rates            │  • Success/failure tracking  │
│  • Analysis reports         │  • Cycle ID references       │
│  • Trend data               │  • Judge reasoning           │
└─────────────────────────────────────────────────────────────┘
```

### The Four-Step Evaluation Workflow

#### 1. **Generate** 🎲
- **Question Crafter LLM** receives full schema of materialized views
- Generates diverse set of test questions covering:
  - Simple lookups and filters
  - Aggregations and grouping
  - Time-based queries
  - Complex joins across views
  - Edge cases and boundary conditions

#### 2. **Execute** ⚡
- Iterates through each generated question
- Sends to existing `/api/ai-query` endpoint
- Captures:
  - Generated SQL query
  - Execution results
  - Error states
  - Performance metrics

#### 3. **Judge** ⚖️
- **Self-Consistency Check LLM** acts as evaluator
- Analyzes three components:
  - Original question intent
  - Generated SQL logic
  - Returned data results
- Provides binary judgment + detailed reasoning
- Logs results to `query_history` table

#### 4. **Analyze** 📊
- **AI Consultant LLM** reviews all failures from cycle
- Identifies recurring patterns and root causes
- Generates actionable recommendations:
  - Schema description improvements
  - System prompt refinements
  - Query validation enhancements
- Stores analysis in `evaluation_cycles` table

## 🗃️ Database Schema

### New Table: `evaluation_cycles`
```sql
CREATE TABLE evaluation_cycles (
  id SERIAL PRIMARY KEY,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  total_questions INTEGER,
  success_count INTEGER,
  success_rate NUMERIC(5, 2),
  failure_analysis TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Enhanced Table: `query_history`
```sql
-- Add cycle tracking column
ALTER TABLE query_history ADD COLUMN IF NOT EXISTS cycle_id INTEGER REFERENCES evaluation_cycles(id);
```

## 🚀 Implementation Details

### Frontend Dashboard Features
- **One-Click Evaluation**: Single button to trigger new evaluation cycle
- **Real-time Progress**: WebSocket or polling for live updates
- **Historical Trends**: Line chart showing accuracy over time
- **Latest Analysis**: Display AI consultant's findings and recommendations
- **Cycle Details**: Drill-down into individual cycle results

### API Endpoint Specifications
```typescript
POST /api/ai-trainer/run-cycle
Response: {
  message: "AI Trainer evaluation cycle started",
  cycleId: number,
  estimatedDuration: string
}

GET /api/ai-trainer/history
Response: {
  cycles: CycleHistory[],
  latest: LatestCycle
}
```

### Trainer Engine Specifications
- **Asynchronous Execution**: Runs as background process
- **Error Handling**: Graceful failure recovery and logging
- **Progress Reporting**: Updates database with intermediate status
- **Configurable Parameters**: 
  - Number of test questions
  - Question difficulty distribution
  - Timeout settings

## 🎯 Success Metrics & KPIs

### Primary Metrics
- **Overall Accuracy Rate**: >95% target
- **Trend Stability**: Consistent improvement over time
- **Error Pattern Reduction**: Decreasing frequency of repeated failures

### Secondary Metrics
- **Query Complexity Coverage**: Distribution across simple to complex queries
- **Response Time**: Average evaluation cycle duration
- **Pattern Detection Accuracy**: AI consultant's recommendation effectiveness

## 🔄 Continuous Improvement Loop

```
Generate Questions → Execute Queries → Judge Results → Analyze Patterns
        ↑                                                      ↓
Update Schema/Prompts ←─────────── Implement Recommendations ←┘
```

### Feedback Integration
1. **Schema Refinement**: Update embedding descriptions based on failure patterns
2. **Prompt Engineering**: Enhance system prompts for better query generation
3. **Query Validation**: Improve safety checks and error handling
4. **Question Generation**: Refine test question diversity and coverage

## 🛡️ Safety & Security

### Safeguards
- **Query Validation**: All generated queries pass through existing safety checks
- **Resource Limits**: Timeout protection and connection pooling
- **Error Isolation**: Individual query failures don't crash entire cycle
- **Data Privacy**: No sensitive data exposure in logs or analysis

### Monitoring
- **Cycle Health**: Track completion rates and execution times
- **System Load**: Monitor database and API performance impact
- **Alert Thresholds**: Notify on significant accuracy drops or system errors

## 🎛️ Configuration & Deployment

### Environment Variables
```bash
AI_TRAINER_ENABLED=true
AI_TRAINER_QUESTION_COUNT=10
AI_TRAINER_TIMEOUT_MS=30000
AI_TRAINER_WEBHOOK_URL=optional_slack_webhook
```

### Deployment Considerations
- **Background Processing**: Execute trainer cycles without blocking main application
- **Database Migrations**: Ensure schema updates are applied before first run
- **API Rate Limits**: Respect OpenAI API limits with proper spacing
- **Log Management**: Structured logging for debugging and monitoring

## 📈 Roadmap & Future Enhancements

### Phase 1 (Current): Core Implementation
- Basic evaluation cycle workflow
- Simple dashboard with key metrics
- Manual trigger capability

### Phase 2: Advanced Analytics
- A/B testing for prompt variations
- Regression detection and alerting
- Advanced visualization and reporting

### Phase 3: Intelligent Automation
- Automatic prompt refinement
- Self-healing schema descriptions
- Predictive failure analysis

This AI Trainer Agent represents a significant step toward autonomous system improvement, enabling continuous refinement of our Text-to-SQL capabilities through synthetic evaluation and intelligent analysis.