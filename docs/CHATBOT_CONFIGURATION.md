# 🤖 Chatbot Configuration Overview

> **Status:** Current State · **Last Updated:** October 7, 2025  
> **Owner:** Full Stack Team · **For:** Understanding current AI chatbot setup

---

## 📋 Table of Contents
- [System Overview](#system-overview)
- [Architecture](#architecture)
- [Components](#components)
- [Configuration](#configuration)
- [Models & APIs](#models--apis)
- [Features](#features)
- [Endpoints](#endpoints)
- [Next Steps](#next-steps)

---

## 🎯 System Overview

You have **3 different chatbot implementations** across your platform:

### 1. **Global Chatbot** (Floating Button)
- **Location:** `src/components/features/GlobalChatbot.tsx`
- **Purpose:** Site-wide AI assistant accessible from any page
- **Features:** Auto-opens on first visit, minimizable, uses FastAPI backend
- **Status:** ✅ Active

### 2. **Portfolio Chatbot** (About Page)
- **Location:** `src/app/(main)/about/chat.tsx`
- **Purpose:** Interactive chat on the about page for portfolio questions
- **Features:** Avatar with Camilo's image, portfolio-specific context
- **Status:** ✅ Active

### 3. **AI Trainer Chatbot**
- **Location:** `src/app/ai-trainer/page.tsx`
- **Purpose:** Advanced fitness AI with RAG, evaluation cycles, performance analysis
- **Features:** Training recommendations, performance tracking, data visualization
- **Status:** ✅ Active (most sophisticated)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ GlobalChatbot│  │Portfolio Chat│  │ AI Trainer   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         └──────────────────┴──────────────────┘               │
│                             │                                 │
└─────────────────────────────┼─────────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   API Layer        │
                    │  (aiService)       │
                    └─────────┬──────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
┌───────▼──────────┐                   ┌───────────▼──────────┐
│  FastAPI Backend │                   │ Next.js API Routes   │
│  (Primary)       │                   │  (Fallback)          │
│                  │                   │                      │
│ /api/ai/chat/*   │                   │ /api/chat           │
│ /api/ai/trainer  │                   │                      │
└───────┬──────────┘                   └──────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────────┐
│                    OpenAI GPT-4                             │
│  - gpt-4 (main chat)                                        │
│  - gpt-4o (AI trainer)                                      │
│  - gpt-4o-mini (fallback)                                   │
│  - text-embedding-3-small (RAG)                             │
└────────────────────────────────────────────────────────────┘
```

---

## 🧩 Components

### Frontend Components

#### 1. **GlobalChatbot** 
**File:** `src/components/features/GlobalChatbot.tsx`

```tsx
export function GlobalChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Auto-open after 3 seconds on first visit
  useEffect(() => {
    const hasSeenChatbot = localStorage.getItem('hasSeenChatbot');
    if (!hasSeenChatbot) {
      setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem('hasSeenChatbot', 'true');
      }, 3000);
    }
  }, []);
}
```

**Features:**
- ⚡ Floating action button (bottom-right corner)
- 🎨 Liquid glass design with gradient effects
- 📱 Minimizable panel
- 💾 Remembers user's first visit
- 🔌 Connects to FastAPI `/api/ai/chat/query`

#### 2. **Chatbot** (Reusable Component)
**File:** `src/components/features/Chatbot.tsx`

```tsx
const suggestedQuestions = [
  "What was my fastest mile during my last run?",
  "Summarize my WHOOP recovery trend this week.",
  "What project best shows Camilo's AI expertise?",
];

const handleSend = async () => {
  const response = await aiService.query(question, true, 30);
  // Handles feedback, typing indicators, message history
};
```

**Features:**
- 💬 Message history with role distinction
- 👍👎 Feedback system
- 📊 Data visualization support
- ⌨️ Typing indicators
- 🎯 Suggested questions

#### 3. **About Page Chat**
**File:** `src/app/(main)/about/chat.tsx`

```tsx
const systemPrompt = 
  "You are a helpful AI assistant representing Camilo Martinez...";

// Uses aiService.query() with portfolio-specific context
```

**Features:**
- 🖼️ Camilo's avatar image
- 📝 Portfolio-focused responses
- 🎨 Glass morphism design
- 🔄 Auto-scroll to latest message

### Backend Services

#### 1. **OpenAI Service**
**File:** `backend/app/services/ai/openai_client.py`

```python
class OpenAIService:
    def __init__(self):
        self.chat_model = "gpt-4"
        self.embedding_model = "text-embedding-3-small"
        self.max_tokens_chat = 1000
    
    async def create_chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        # Automatic retry with exponential backoff
        # Token usage tracking
        # Comprehensive error handling
```

**Features:**
- ♻️ Auto-retry on rate limits (3 attempts)
- 📊 Token usage tracking
- ⏱️ 30-second timeout
- 🔐 User ID tracking
- 📝 Structured logging

#### 2. **AI Trainer Service**
**File:** `backend/app/services/ai/trainer_service.py`

```python
class TrainingRecommendationEngine:
    async def generate_training_recommendations(
        self,
        user_id: str,
        performance_analysis: Dict[str, Any],
        user_goals: Optional[str] = None,
        upcoming_events: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        # Generates personalized training plans
        # Uses GPT-4 with temperature=0.3
        # Returns action items, confidence scores
```

**Features:**
- 🏃 Performance analysis
- 📈 Trend detection
- 🎯 Goal-based recommendations
- 📊 Confidence scoring
- 💪 Action item generation

---

## ⚙️ Configuration

### Environment Variables

**File:** `backend/app/config/settings.py`

```python
class Settings(BaseSettings):
    # OpenAI Configuration
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    
    # Rate Limiting
    RATE_LIMIT_DEFAULT: int = 5
    RATE_LIMIT_PER_DAY: int = 5
    RATE_LIMIT_WINDOW: int = 86400  # 24 hours
    
    # Database
    DATABASE_URL: str
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
```

### Current `.env` Values

```bash
# OpenAI
OPENAI_API_KEY=sk-proj-...  # ✅ Configured

# Database
DATABASE_URL=postgresql+asyncpg://...@neondb  # ✅ Configured

# Redis (for caching)
REDIS_URL=redis://localhost:6379/0  # ⚠️ Connection refused (not critical)

# Rate Limiting
RATE_LIMIT_PER_DAY=5
```

---

## 🤖 Models & APIs

### OpenAI Models in Use

| Component | Model | Temperature | Max Tokens | Purpose |
|-----------|-------|-------------|------------|---------|
| **Main Chat** | `gpt-4` | 0.7 | 1000 | General Q&A, portfolio info |
| **AI Trainer** | `gpt-4o` | 0.3 | 1200 | Training recommendations |
| **Fallback Chat** | `gpt-4o-mini` | 0.7 | 500 | Cost-effective responses |
| **Embeddings** | `text-embedding-3-small` | N/A | N/A | RAG vector search |

### API Client Configuration

**File:** `src/lib/api/config.ts`

```typescript
export const aiService = {
  async query(query: string, includeContext = true, contextDays = 30) {
    try {
      // Primary: FastAPI backend
      return await ApiClient.post(API_ENDPOINTS.AI.CHAT_QUERY, {
        query,
        include_context: includeContext,
        context_days: contextDays,
      });
    } catch (error) {
      // Fallback: Next.js API route
      const chatResponse = await ApiClient.post('/api/chat', {
        messages: [{ role: 'user', content: query }]
      });
      // Convert to FastAPI format
    }
  }
}
```

---

## ✨ Features

### 1. **Contextual Responses**
- ✅ Access to WHOOP fitness data
- ✅ Access to Strava running data
- ✅ Portfolio project information
- ✅ Skills and experience context

### 2. **RAG (Retrieval-Augmented Generation)**
**File:** `backend/app/services/ai/query_service.py`

```python
# 1. Embed user question
embedding = await openai_service.create_embedding(question)

# 2. Vector search in pgvector
relevant_schema = await find_similar_schemas(embedding)

# 3. Generate SQL with context
sql = await llm.generate_sql(question, relevant_schema)

# 4. Execute and format response
```

### 3. **Feedback System**
- 👍 Positive feedback
- 👎 Negative feedback
- 💾 Stored in `query_history` table
- 📊 Used for model evaluation

### 4. **Rate Limiting**
**File:** `backend/app/middleware/rate_limiter.py`

```python
# Default: 5 queries per day
# Bypass tokens available for development
# Stored in PostgreSQL (not Redis)
```

### 5. **Auto-Open Behavior**
```typescript
// GlobalChatbot.tsx
useEffect(() => {
  const hasSeenChatbot = localStorage.getItem('hasSeenChatbot');
  if (!hasSeenChatbot) {
    setTimeout(() => {
      setIsOpen(true);
      localStorage.setItem('hasSeenChatbot', 'true');
    }, 3000);  // 3 second delay
  }
}, []);
```

---

## 🔌 Endpoints

### FastAPI Backend (Primary)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/chat/completion` | POST | GPT-4 chat completion |
| `/api/ai/chat/query` | POST | **Main chatbot endpoint** (with RAG) |
| `/api/ai/chat/history` | GET | Query history |
| `/api/ai/trainer/evaluate` | POST | AI trainer evaluation |
| `/api/ai/trainer/history` | GET | Evaluation history |
| `/api/ai/embeddings/create` | POST | Create embeddings |
| `/api/ai/embeddings/search` | POST | Vector similarity search |

### Next.js API Routes (Fallback)

| Route | Purpose |
|-------|---------|
| `/api/chat` | Simple GPT-4 chat (no RAG) |
| `/api/openai/completion` | OpenAI completion wrapper |

---

## 🎯 System Prompts

### 1. **Portfolio Chat**
**File:** `src/app/api/chat/route.ts`

```typescript
const systemPrompt = 
  "You are a helpful AI assistant representing Camilo Martinez on his " +
  "portfolio website. You are speaking to a visitor. Answer questions " +
  "about Camilo's skills, experience, and projects based on his resume " +
  "and the context of the portfolio. Be friendly, professional, and concise.";
```

### 2. **AI Trainer**
**File:** `backend/app/services/ai/trainer_service.py`

```python
system_message = {
  "role": "system",
  "content": "You are an expert running coach with deep knowledge of " +
             "exercise physiology, training periodization, and performance " +
             "optimization. Provide evidence-based, personalized recommendations."
}
```

### 3. **About Page Chat**
Similar to portfolio chat but with more context about Camilo's background.

---

## 🔍 Data Flow Example

### User asks: "What was my fastest mile last week?"

```
1. Frontend (GlobalChatbot)
   ↓ aiService.query("What was my fastest mile last week?", true, 30)
   
2. API Client (src/lib/api/config.ts)
   ↓ POST /api/ai/chat/query
   
3. FastAPI Router (backend/app/routers/ai.py)
   ↓ @router.post("/chat/query")
   
4. AI Query Service (backend/app/services/ai/query_service.py)
   ↓ Generate embedding → Vector search → Build context
   
5. OpenAI Service (backend/app/services/ai/openai_client.py)
   ↓ create_chat_completion(messages=[...])
   
6. OpenAI API
   ↓ GPT-4 processes request
   
7. Response Chain (back to frontend)
   ↓ Extract answer, metadata, usage
   
8. Frontend Display
   ✓ Show message with typing animation
   ✓ Display data in structured format
   ✓ Enable feedback buttons
```

---

## 🚀 Next Steps / Potential Improvements

### 1. **Redis Integration** (Currently Disabled)
**Status:** ⚠️ Connection refused
**Impact:** No caching, higher latency
**Fix:**
```bash
# Install Redis
brew install redis

# Start Redis
redis-server

# Or use Docker
docker run -d -p 6379:6379 redis:latest
```

### 2. **Model Upgrades**
**Current:** `gpt-4`, `gpt-4o`, `gpt-4o-mini`
**Consider:**
- `gpt-4-turbo` for faster responses
- `gpt-4o-2024-08-06` for latest features
- Fine-tuned model for fitness domain

### 3. **Enhanced RAG**
**Current:** Vector search on schema embeddings
**Potential:**
- Document embeddings (workout summaries, training logs)
- Hybrid search (vector + keyword)
- Re-ranking for better relevance

### 4. **Streaming Responses**
**Current:** Wait for complete response
**Improvement:**
```typescript
// Stream tokens as they arrive
for await (const chunk of stream) {
  setMessages(prev => updateLastMessage(prev, chunk));
}
```

### 5. **Multi-Modal Support**
- Upload workout screenshots
- Analyze training graphs
- GPT-4 Vision integration

### 6. **Conversation Memory**
**Current:** Each query is independent
**Improvement:**
```python
# Store last N messages
conversation_history = get_recent_messages(user_id, limit=10)
messages = conversation_history + [new_message]
```

### 7. **Voice Input**
```typescript
// Web Speech API
const recognition = new webkitSpeechRecognition();
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  handleSend(transcript);
};
```

---

## 📊 Current Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| **5 queries/day** | Restrictive for testing | Use bypass tokens |
| **No Redis** | Slower responses | Fix Redis connection |
| **No streaming** | Perceived latency | Add loading states |
| **Single model** | No fallback chain | Already implemented for chat |
| **No conversation memory** | Each query isolated | Store message history |

---

## 🛠️ Configuration Files Reference

```
Configuration Files:
├── backend/app/config/settings.py          # Main config
├── backend/app/services/ai/openai_client.py # OpenAI setup
├── src/lib/api/config.ts                   # Frontend API client
├── src/app/api/chat/route.ts               # Next.js fallback
└── .env                                     # Environment variables

Component Files:
├── src/components/features/GlobalChatbot.tsx
├── src/components/features/Chatbot.tsx
├── src/app/(main)/about/chat.tsx
└── src/app/ai-trainer/page.tsx

Backend Services:
├── backend/app/routers/ai.py
├── backend/app/services/ai/query_service.py
├── backend/app/services/ai/trainer_service.py
└── backend/app/services/ai/openai_client.py
```

---

## 📝 Quick Commands

```bash
# Check backend status
curl http://localhost:9000/api/system/health

# Test chat endpoint
curl -X POST http://localhost:9000/api/ai/chat/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is my fastest mile?"}'

# Check OpenAI model
python -c "from backend.app.config.settings import settings; print(settings.OPENAI_MODEL)"

# View rate limits
psql $DATABASE_URL -c "SELECT * FROM question_rate_limits;"
```

---

*Last Updated: October 7, 2025*
