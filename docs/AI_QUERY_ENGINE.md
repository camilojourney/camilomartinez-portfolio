# AI Query Engine: Architecture & Implementation Plan

> A sophisticated RAG (Retrieval-Augmented Generation) and Text-to-SQL engine designed for secure, performant natural language queries against fitness data.

## 1. Overview

This system translates natural language questions into safe, executable PostgreSQL queries using our pre-built materialized views. It implements a state-of-the-art RAG pipeline with self-correction mechanisms to ensure reliable and accurate results.

### Core Objectives

- **Safety**: All queries execute in a controlled, read-only environment
- **Performance**: Leverages materialized views for optimal query speed
- **Accuracy**: Multi-step validation prevents logical errors
- **Simplicity**: Direct view access eliminates complex join inference

## 2. Data Foundation: The Source of Truth
The AI agent interacts exclusively with four carefully designed materialized views, each serving a specific analytical purpose:

### 2.1 Daily Fitness Snapshot
```sql
daily_fitness_snapshot
```
- **Purpose**: High-level daily trend analysis
- **Key Features**: 
  - Cross-domain correlations (sleep vs. activity)
  - Aggregated daily metrics
  - Recovery and strain analysis

### 2.2 Run Performance Details
```sql
run_performance_details
```
- **Purpose**: Granular running workout analysis
- **Key Features**:
  - Split-by-split breakdown
  - Pace and distance metrics
  - Heart rate zone distribution

### 2.3 Boxing Performance Details
```sql
boxing_performance_details
```
- **Purpose**: Boxing session analysis
- **Key Features**:
  - Intensity metrics
  - Cardiovascular response
  - Zone-based effort distribution

### 2.4 Weightlifting Performance Details
```sql
weightlifting_performance_details
```
- **Purpose**: Strength training analysis
- **Key Features**:
  - Session volume metrics
  - Strain and recovery patterns
  - Heart rate response

## 3. The Intelligent Query Pipeline
Our engine implements a sophisticated multi-step, self-correcting pipeline:

### 3.1 Schema Linking (RAG)
1. Embed user question
2. Search schema_embeddings table
3. Retrieve relevant views/columns
4. Build context for query generation

```mermaid
graph LR
    A[User Question] --> B[Embed Question]
    B --> C[Vector Search]
    C --> D[Schema Context]
    D --> E[Query Generation]
```

### 3.2 Decomposition & SQL Generation
1. "Thinker" LLM receives:
   - Original question
   - Retrieved schema
   - View documentation
2. Generates:
   - Step-by-step plan
   - Corresponding SQL query

### 3.3 Self-Correction & Validation
1. "Reviewer" LLM validates:
   - Query matches plan
   - SQL syntax correctness
   - Logic verification
   - Safety checks

### 3.4 Safe Execution
- Read-only user context
- Strict query timeouts
- Result size limits
- Error handling

## 4. Implementation Structure

The system is implemented across four key files:

### 4.1 Schema Embedding Generator
```typescript
// src/scripts/ai/embed-schema.ts
```
One-time script to:
- Parse view definitions
- Generate embeddings
- Store in schema_embeddings table

### 4.2 RAG Helper
```typescript
// src/lib/ai/rag.ts
```
Manages:
- Vector search operations
- Context assembly
- Relevance scoring

### 4.3 Safe Query Executor
```typescript
// src/lib/db/safe-query.ts
```
Handles:
- Query sanitization
- Execution timeouts
- Result streaming
- Error management

### 4.4 API Endpoint
```typescript
// src/app/api/ai-query/route.ts
```
Orchestrates:
- Request processing
- Pipeline execution
- Response formatting
- Error handling

## 5. Example Interactions

### 5.1 Simple Query
```
User: "What was my average recovery score last week?"
```
Pipeline:
1. Identifies `daily_fitness_snapshot` as relevant view
2. Generates time-windowed aggregation query
3. Validates and executes

### 5.2 Complex Analysis
```
User: "How does my running pace change when my recovery score is below 60%?"
```
Pipeline:
1. Identifies multiple relevant views
2. Generates correlated subquery
3. Ensures proper temporal alignment
4. Validates and executes

## 6. Security & Performance

### 6.1 Security Measures
- Read-only database user
- Query whitelisting
- Input sanitization
- Result size limits

### 6.2 Performance Optimization
- Materialized view usage
- Index optimization
- Query timeout limits
- Result streaming

## 7. Future Enhancements

### 7.1 Planned Features
- Query caching layer
- Enhanced error explanations
- Query suggestion system
- Performance analytics

### 7.2 Potential Optimizations
- Parallel query execution
- Advanced result caching
- Dynamic timeout adjustment
- Query plan optimization

---

*Last Updated: September 25, 2025*