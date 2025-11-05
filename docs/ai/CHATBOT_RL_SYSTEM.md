# 🤖 Self-Improving Chatbot with Reinforcement Learning

> **Status:** Live in Production · **Last Updated:** November 5, 2025
> **Owner:** Camilo Martinez · **Tech Stack:** RAG + RLHF + LLM-as-a-Judge

---

## TL;DR

The `/about` chatbot is a **RAG-powered, self-improving AI system** that:
- Loads your complete professional profile from `docs/knowledge/CAMILO_PROFILE.md`
- Logs all conversations for offline RL training
- Collects user feedback (thumbs up/down) for RLHF
- Self-evaluates answers using LLM-as-a-Judge pattern
- Continuously improves through feedback loops

---

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [RAG System](#rag-system)
- [Self-Improvement Loop](#self-improvement-loop)
- [How to Use Feedback for RL](#how-to-use-feedback-for-rl)
- [Monitoring & Metrics](#monitoring--metrics)
- [Future Enhancements](#future-enhancements)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface                          │
│                   /about page chatbot                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  POST /api/chat                             │
│  1. Load knowledge base (CAMILO_PROFILE.md)                │
│  2. Create rich system prompt with context                 │
│  3. Call OpenAI GPT-4o                                     │
│  4. Return answer                                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
           ┌──────────┴──────────┐
           ▼                     ▼
┌──────────────────┐   ┌─────────────────────┐
│ POST /api/chat/log│   │POST /api/chat/      │
│ - Save conversation│   │evaluate             │
│ - Store metadata  │   │- LLM judges quality │
│                   │   │- Score 0-1          │
└──────────────────┘   └─────────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ POST /api/chat/feedback      │
│ - User thumbs up/down        │
│ - Optional comment           │
│ - Expected answer            │
└──────────────────────────────┘
           │
           ▼
┌──────────────────────────────┐
│   .chat-logs/ (dev)          │
│   PostgreSQL (prod)          │
│   - Training dataset         │
│   - RLHF signals             │
└──────────────────────────────┘
```

---

## RAG System

### Knowledge Base Loading

**File:** `src/app/api/chat/route.ts`

```typescript
async function getKnowledgeContext(): Promise<string> {
  const knowledgePath = path.join(process.cwd(), 'docs', 'knowledge', 'CAMILO_PROFILE.md');
  const knowledge = await fs.readFile(knowledgePath, 'utf-8');

  // Add project details
  const projectsInfo = `
    Fitness Dashboard, Astoria Conquest, AI Advisor Board, etc.
  `;

  return knowledge + projectsInfo;
}
```

### Rich System Prompt

The system prompt includes:
1. **Role definition**: "You are an AI assistant representing Camilo Martinez..."
2. **Context**: Full professional profile, projects, skills, education
3. **Guidelines**: Tone, length, voice (first person)
4. **Constraints**: Direct to contact page for collaboration

### Current Context Includes:
- ✅ Professional identity & mission
- ✅ Education (MS Business Analytics, BS Petroleum Engineering)
- ✅ Technical skills (AI, backend, data, frontend, DevOps)
- ✅ All 6 major projects with tech stacks
- ✅ Professional values & practices
- ✅ Health & performance philosophy
- ✅ Communication style preferences

---

## Self-Improvement Loop

### 1. Conversation Logging

**Endpoint:** `POST /api/chat/log`

Every conversation is logged with:
```typescript
{
  id: string,
  messages: ChatMessage[],
  feedback?: {
    rating: 'positive' | 'negative',
    comment?: string,
    timestamp: string
  },
  metadata: {
    sessionId: string,
    createdAt: string,
    responseTime: number
  }
}
```

**Storage:**
- **Dev**: `.chat-logs/*.json`
- **Prod**: PostgreSQL database (to implement)

### 2. User Feedback Collection

**Endpoint:** `POST /api/chat/feedback`

Users can provide:
- 👍/👎 ratings
- Written comments
- Expected answers (for fine-tuning)

**Data format:**
```typescript
{
  conversationId: string,
  messageIndex: number,
  rating: 'positive' | 'negative',
  comment?: string,
  expectedAnswer?: string
}
```

### 3. Self-Evaluation (LLM-as-a-Judge)

**Endpoint:** `POST /api/chat/evaluate`

Uses GPT-4o-mini to judge answer quality based on:
1. **Accuracy** - Factually correct?
2. **Relevance** - Addresses the question?
3. **Completeness** - Sufficient detail?
4. **Clarity** - Easy to understand?
5. **Tone** - Appropriately professional?

**Returns:**
```json
{
  "score": 0.85,
  "reasoning": "Clear and comprehensive answer...",
  "strengths": ["Good technical detail", "Friendly tone"],
  "improvements": ["Could mention specific dates"],
  "missing_information": ["Might add links to projects"]
}
```

---

## How to Use Feedback for RL

### Phase 1: Data Collection (Current)
✅ **Status**: Live

- Conversations logged automatically
- Feedback collection endpoints ready
- Self-evaluation scoring available

### Phase 2: Dataset Preparation (Next)
🔄 **To Implement**:

1. **Export training data**:
   ```bash
   # Convert logs to training format
   python scripts/prepare_rl_dataset.py
   ```

2. **Create preference pairs**:
   ```json
   {
     "question": "What are your technical skills?",
     "good_answer": "I specialize in AI engineering...",
     "bad_answer": "I know stuff about computers.",
     "preference": "good"
   }
   ```

### Phase 3: RLHF Training
📋 **Planned**:

1. **Collect 500+ conversations** with feedback
2. **Train reward model** on preference data
3. **Fine-tune with PPO** (Proximal Policy Optimization)
4. **Deploy updated model** as custom deployment

### Phase 4: Continuous Learning
🎯 **Future**:

- Weekly retraining on new feedback
- A/B testing between models
- Automated quality monitoring
- Knowledge base updates from conversations

---

## Monitoring & Metrics

### Key Metrics to Track

| Metric | Target | Current |
|--------|--------|---------|
| Average Response Time | < 3s | ~2.5s |
| Positive Feedback Rate | > 80% | TBD |
| Self-Evaluation Score | > 0.75 | TBD |
| Questions Answered | Growing | TBD |
| Knowledge Gap Rate | < 10% | TBD |

### Dashboards (To Build)

1. **Quality Dashboard**
   - Daily feedback trends
   - Self-evaluation scores
   - Common questions
   - Knowledge gaps

2. **Usage Dashboard**
   - Conversations per day
   - Average session length
   - Peak usage times
   - User retention

3. **Training Dashboard**
   - Dataset size growth
   - Model performance over time
   - A/B test results
   - Retraining triggers

---

## Future Enhancements

### Short Term (Next Sprint)
- [ ] Add feedback buttons to chat UI
- [ ] Implement session tracking
- [ ] Build admin dashboard for logs
- [ ] Set up PostgreSQL conversation storage

### Medium Term (1-2 Months)
- [ ] Collect 500+ rated conversations
- [ ] Build preference dataset
- [ ] Train initial reward model
- [ ] Implement A/B testing framework

### Long Term (3-6 Months)
- [ ] Deploy custom fine-tuned model
- [ ] Automated retraining pipeline
- [ ] Multi-turn conversation optimization
- [ ] Personalization based on user history
- [ ] Voice interface integration

---

## API Reference

### Chat Endpoint
```typescript
POST /api/chat
Body: { messages: ChatMessage[] }
Response: { role: 'assistant', content: string }
```

### Logging Endpoint
```typescript
POST /api/chat/log
Body: ConversationLog
Response: { success: boolean }
```

### Feedback Endpoint
```typescript
POST /api/chat/feedback
Body: FeedbackData
Response: { success: boolean }
```

### Evaluation Endpoint
```typescript
POST /api/chat/evaluate
Body: { question: string, answer: string, context: string }
Response: { score: number, reasoning: string, ... }
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `src/app/api/chat/route.ts` | Main RAG chatbot endpoint |
| `src/app/api/chat/log/route.ts` | Conversation logging |
| `src/app/api/chat/feedback/route.ts` | User feedback collection |
| `src/app/api/chat/evaluate/route.ts` | Self-evaluation (LLM-as-judge) |
| `src/lib/chat/feedback.ts` | TypeScript types & helpers |
| `docs/knowledge/CAMILO_PROFILE.md` | Knowledge base source |
| `.chat-logs/` | Dev storage for conversations |

---

## Testing the System

### Test Basic RAG
```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What are your technical skills?"}]}'
```

### Test Self-Evaluation
```bash
curl -X POST http://localhost:3001/api/chat/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are your skills?",
    "answer": "I know Python and React.",
    "context": "Camilo specializes in AI engineering, RAG, FastAPI, Next.js..."
  }'
```

---

## Production Deployment

1. ✅ **RAG system** - Deployed
2. ✅ **Logging endpoints** - Deployed
3. ✅ **Evaluation endpoint** - Deployed
4. 🔄 **Feedback UI** - To implement in chat component
5. 📋 **PostgreSQL storage** - To configure
6. 📋 **Analytics dashboard** - To build

---

**Last Updated:** November 5, 2025
**Next Review:** After collecting first 100 conversations
