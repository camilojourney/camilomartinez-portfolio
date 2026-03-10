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
  knowledgeBase = contents.join('\n\n---\n\n');
  return knowledgeBase;
}

function retrieveContext(query: string): string {
  const kb = loadKnowledgeBase();
  const sections = kb.split(/\n(?=## )/);
  const queryWords = new Set(query.toLowerCase().split(/\W+/).filter((w) => w.length > 2));
  const scored = sections.map((section) => {
    const overlap = section.toLowerCase().split(/\W+/).filter((w) => queryWords.has(w)).length;
    return { section, score: overlap };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, 5).map((s) => s.section).join('\n\n');
}

const GROQ_BASE = process.env.AI_PROXY_BASE_URL ?? 'https://api.groq.com/openai/v1';
const GROQ_KEY = process.env.AI_PROXY_API_KEY ?? '';
const CHAT_MODEL = process.env.AI_CHAT_MODEL ?? 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = "You are an AI assistant on Juan Camilo Martinez's portfolio website. Answer questions about his background, skills, projects, job search, values, daily routine, and fitness habits. He is an AI Engineer actively looking for AI Engineer / AI Systems roles in NYC at $200k+ comp. Be helpful, concise, and professional. Keep responses under 150 words unless more detail is needed. For specific fitness metrics (sleep hours, HRV, workout count) always direct people to the live Fitness Dashboard at /apps/fitness-dashboard";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { message: string; conversationHistory?: Array<{ role: string; content: string }> };
    const { message, conversationHistory = [] } = body;

    const baseURL = GROQ_BASE;
    const apiKey = GROQ_KEY;
    const model = CHAT_MODEL;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'No API key configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const client = new OpenAI({ baseURL, apiKey });
    const context = retrieveContext(message);
    const systemWithContext = `${SYSTEM_PROMPT}\n\nRelevant knowledge:\n${context}`;

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemWithContext },
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
