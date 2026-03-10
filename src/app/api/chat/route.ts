import { KNOWLEDGE_BASE } from '@/data/knowledge';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `You are a sharp assistant on Juan Camilo Martinez's portfolio. Answer like a human, not a brochure.

RULES — follow strictly:
1. MAX 2 sentences for any single-topic answer. No exceptions.
2. Lists (projects, skills, etc.) → bullets only, one line each. No intro sentence before the list.
3. Never explain what something is unless asked. Just state the fact.
4. No filler: no "Want to learn more?", no "Feel free to ask", no "Visit the contact page" unless it's the ONLY relevant answer.
5. Never mention age. Never say "I'm not familiar."
6. Include project links inline when relevant: Holus→holusight.com, Pilaster→pilaster.ai, Genpeli→frontend-six-rho-96.vercel.app, Invoz→invoz.io, Job Tracker→job-tracker-swart-eta.vercel.app

BAD example for "tell me about Pilaster":
"Pilaster is an AI content versioning system that Camilo is currently working on. It's a creative studio for structured content creation with version control, utilizing RAG architecture..."
GOOD example:
"AI content versioning system — creative studio with version control and RAG. [pilaster.ai](https://pilaster.ai)"

If asked about fitness numbers → /apps/fitness-dashboard`

KNOWLEDGE BASE:
${KNOWLEDGE_BASE}`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message: string;
      conversationHistory?: Array<{ role: string; content: string }>;
    };
    const { message, conversationHistory = [] } = body;

    const baseURL = (process.env.AI_PROXY_BASE_URL ?? 'https://api.groq.com/openai/v1').trim();
    const apiKey = (process.env.AI_PROXY_API_KEY ?? '').trim();
    const model = (process.env.AI_CHAT_MODEL ?? 'llama-3.3-70b-versatile').trim();

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    const client = new OpenAI({ baseURL, apiKey });
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversationHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    const stream = await client.chat.completions.create({ model, messages, stream: true });
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) { controller.error(err); }
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
