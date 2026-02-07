import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
}

// Load Camilo's knowledge base for RAG context
async function getKnowledgeContext(): Promise<string> {
  try {
    const knowledgePath = path.join(process.cwd(), 'docs', 'knowledge', 'CAMILO_PROFILE.md');
    const knowledge = await fs.readFile(knowledgePath, 'utf-8');

    // Add detailed project information
    const projectsInfo = `

## Detailed Projects Portfolio

### Fitness Dashboard (Live)
Real-time health analytics combining WHOOP + Strava data pipelines. Built with Next.js, FastAPI, and PostgreSQL. Features data engineering, API integrations, and real-time dashboards. View at /apps/fitness-dashboard

### Astoria Conquest (Live)
Geospatial routing and map visualization project to run every street in Astoria, Queens. Uses graph theory, mapping algorithms, and interactive visualization. Built with Next.js, React, Leaflet maps, and GeoJSON processing. Tracks progress running every street in the neighborhood with beautiful map overlays. View at /apps/astoria-conquest

### Social Media Pipeline (Live)
LLM-powered content generator that translates raw insights into polished social media posts. Uses GPT-4 for content creation and multi-format optimization. Automates content creation workflow. View at /apps/social-media-pipeline

### AI Advisor Board (Live)
Multi-agent advisory system where specialized AI directors debate strategy, risk, and customer voice. Features collaborative problem-solving between AI agents with different perspectives. Live at https://ai-advisor-board.vercel.app

### Interactive Chatbot (Live - You!)
RAG-powered conversational agent (this chatbot!) that evaluates its answers and expands knowledge autonomously. Features self-improving capabilities with retrieval-augmented generation. View at /about

### Invoz.ai (In Progress)
Privacy-first, on-device speech coach with dictation, real-time grammar correction, and personalized pronunciation feedback powered by federated learning. Focuses on speech AI, accessibility, and productivity tools.
`;

    return knowledge + projectsInfo;
  } catch (error) {
    console.error('Failed to load knowledge base:', error);
    // Fallback to basic info if file read fails
    return `
# About Camilo Martinez

## Professional Identity
Camilo Martinez is a New York-based AI/data engineer and full-stack developer specializing in:
- Retrieval-Augmented Generation (RAG) systems
- Fitness analytics and biometric data processing
- Full-stack development (Next.js, FastAPI, Python, TypeScript)
- Documentation excellence and AI operations

## Education
- M.S. Business Analytics (Big Data) – Baruch College, Zicklin School of Business (CUNY)
- B.S. Petroleum Engineering

## Technical Skills
- **AI Engineering**: RAG, embeddings, AI evaluation loops, agent orchestration
- **Backend**: FastAPI, Python asyncio, SQLAlchemy, REST design
- **Frontend**: Next.js, React Server Components, Tailwind CSS
- **Data**: PostgreSQL (pgvector), ETL pipelines, analytics modeling
- **DevOps**: Vercel/Railway, Docker, CI/CD, observability

## Key Projects
1. **AI Fitness Analytics Platform**: WHOOP + Strava integration with RAG and real-time dashboards
2. **AI Advisor Board**: Multi-agent advisory system with strategic deliberation
3. **Astoria Conquest**: Geospatial routing to run every street in Astoria, Queens
4. **Social Media Pipeline**: LLM-powered content generation
5. **Interactive Chatbot**: RAG-powered self-improving conversational agent

## Professional Values
- Continuous improvement and iteration
- Evidence-driven decisions
- Documentation as product
- Open collaboration and mentorship
- Integrity and accountability
    `;
  }
}

const getSystemPrompt = (knowledge: string) => `You are an AI assistant representing Camilo Martinez on his portfolio website at camilomartinez.co. You are speaking directly to a visitor who wants to learn about Camilo.

# Your Role
- Answer questions about Camilo's background, skills, experience, and projects
- Be friendly, professional, conversational, and concise
- Use specific details from the context below
- If you don't know something, say so honestly
- Speak in first person when discussing Camilo ("I built...", "My expertise is...")

# Context About Camilo
${knowledge}

# Guidelines
- Keep responses focused and under 3 paragraphs unless more detail is requested
- Highlight specific projects, technologies, or achievements when relevant
- Be enthusiastic but authentic about Camilo's work
- If asked about contact or collaboration, direct them to use the contact page or LinkedIn`;

export async function POST(req: Request) {
  try {
    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured on the server.' },
        { status: 503 }
      );
    }

    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages must be provided as a non-empty array' },
        { status: 400 }
      );
    }

    // Load knowledge base for RAG context
    const knowledge = await getKnowledgeContext();
    const systemPrompt = getSystemPrompt(knowledge);

    const startTime = Date.now();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.7, // Balanced creativity and consistency
      max_tokens: 500, // Keep responses concise
    });

    const responseTime = Date.now() - startTime;
    const choice = response.choices[0];
    if (!choice) {
      return NextResponse.json({ error: 'No response from AI.' }, { status: 500 });
    }
    const answer = choice.message;

    // AUTOMATIC EVALUATION: Sample 10% of responses for quality monitoring
    // This runs async (fire-and-forget) so it doesn't slow down chat
    const shouldEvaluate = Math.random() < 0.1; // 10% sampling rate
    if (shouldEvaluate && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];

      // Evaluate in background (don't wait)
      evaluateAnswerAsync(
        openai,
        lastUserMessage.content,
        answer.content || '',
        knowledge,
        responseTime
      ).catch(err => console.error('Background evaluation failed:', err));
    }

    return NextResponse.json(answer);
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Failed to get response from AI.' }, { status: 500 });
  }
}

/**
 * Background self-evaluation (fire-and-forget)
 * Automatically evaluates 10% of answers for quality monitoring
 */
async function evaluateAnswerAsync(
  openai: OpenAI,
  question: string,
  answer: string,
  context: string,
  responseTime: number
): Promise<void> {
  try {
    const evaluationPrompt = `You are an expert evaluator assessing chatbot response quality.

Evaluate this answer on a 0.0-1.0 scale across 5 criteria:
1. Accuracy: Factually correct per context?
2. Relevance: Directly addresses question?
3. Completeness: Sufficient detail?
4. Clarity: Easy to understand?
5. Tone: Professional and friendly?

Question: ${question}
Answer: ${answer}
Context: ${context.substring(0, 1500)}...

Respond with JSON only:
{
  "score": 0.85,
  "reasoning": "Clear answer with specific details",
  "improvements": ["Could add project links"],
  "category": "technical_skills|project_info|background|other"
}`;

    const evalResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cheaper model for evaluation
      messages: [{ role: 'user', content: evaluationPrompt }],
      temperature: 0.3, // Low temp for consistent scoring
      response_format: { type: 'json_object' },
    });

    const evalChoice = evalResponse.choices[0];
    const evalContent = evalChoice?.message?.content || '{}';
    const evaluation = JSON.parse(evalContent);

    // Log to console (in production, save to database)
    console.log('[Auto-Evaluation]', {
      timestamp: new Date().toISOString(),
      score: evaluation.score,
      category: evaluation.category,
      responseTime: `${responseTime}ms`,
      questionPreview: question.substring(0, 60) + '...',
    });

    // TODO: Save to database for analytics dashboard
    // await prisma.chatEvaluation.create({
    //   data: {
    //     question, answer, score: evaluation.score,
    //     reasoning: evaluation.reasoning,
    //     category: evaluation.category,
    //     responseTime
    //   }
    // });

  } catch (error) {
    // Silent fail - evaluation errors shouldn't break chat
    console.error('[Auto-Evaluation Error]', error);
  }
}
