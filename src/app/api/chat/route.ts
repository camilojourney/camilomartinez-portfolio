import { KNOWLEDGE_BASE } from '@/data/knowledge';
import OpenAI from 'openai';

const SYSTEM_PROMPT = `You are an AI assistant on Juan Camilo Martinez's portfolio. Use the knowledge base below to answer every question specifically and accurately. Never say "I'm not familiar" — if it's about Camilo, the answer is in the knowledge base.

Juan (also called Camilo) is an AI Engineer, 31, NYC-based, looking for AI Engineer / AI Systems roles at $200k+ comp. Available immediately.

Answer concisely (2-4 sentences). After 3+ exchanges naturally offer: "Want to reach out to Camilo directly? Visit the contact page."

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
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Chat API error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
