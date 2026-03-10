import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

let knowledgeBase: string | null = null;

function loadKnowledgeBase(): string {
  if (knowledgeBase) return knowledgeBase;
  const knowledgeDir = path.join(process.cwd(), 'src', 'data', 'knowledge');
  const files = ['bio.md', 'skills.md', 'projects.md', 'faq.md', 'values.md', 'fitness.md'];
  const contents = files.map((file) => {
    try { return fs.readFileSync(path.join(knowledgeDir, file), 'utf-8'); }
    catch { return ''; }
  });
  knowledgeBase = contents.filter(Boolean).join('\n\n---\n\n');
  return knowledgeBase;
}

const SYSTEM_PROMPT = `You are an AI assistant on Juan Camilo Martinez's portfolio. You have detailed knowledge about him below. Use it to answer every question specifically and accurately. Do not say "I'm not familiar" — the knowledge base has the answer.

Juan (also called Camilo) is an AI Engineer, 31, based in NYC, actively looking for AI Engineer / AI Systems roles at $200k+ total comp. Available immediately.

Answer concisely (2-4 sentences). After 3+ exchanges offer: "Want to reach out to Camilo directly? [Contact page]"

KNOWLEDGE BASE:
{KNOWLEDGE}`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { message: string; conversationHistory?: Array<{ role: string; content: string }> };
    const { message, conversationHistory = [] } = body;

    const baseURL = process.env.AI_PROXY_BASE_URL ?? 'https://api.groq.com/openai/v1';
    const apiKey = process.env.AI_PROXY_API_KEY ?? '';
    const model = (process.env.AI_CHAT_MODEL ?? 'llama-3.3-70b-versatile').trim();

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'No API key configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const client = new OpenAI({ baseURL, apiKey });
    const kb = loadKnowledgeBase();
    const systemWithKnowledge = SYSTEM_PROMPT.replace('{KNOWLEDGE}', kb);

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemWithKnowledge },
      ...conversationHistory.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: message },
    ];

    const stream = await client.chat.completions.create({ model, messages, stream: true });
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
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
    console.error('Chat API error:', msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
