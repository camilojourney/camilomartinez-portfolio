import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

// Cache knowledge base at module level for warm instance reuse
let knowledgeBase: string | null = null;

function loadKnowledgeBase(): string {
  if (knowledgeBase) return knowledgeBase;

  const knowledgeDir = path.join(process.cwd(), 'src', 'data', 'knowledge');
  const files = ['bio.md', 'skills.md', 'projects.md', 'faq.md', 'values.md', 'fitness.md'];

  const contents = files.map((file) => {
    try {
      return fs.readFileSync(path.join(knowledgeDir, file), 'utf-8');
    } catch {
      return '';
    }
  });

  knowledgeBase = contents.join('\n\n---\n\n');
  return knowledgeBase;
}

function retrieveContext(query: string): string {
  const kb = loadKnowledgeBase();
  const sections = kb.split(/\n(?=## )/);

  const queryWords = new Set(
    query
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 2)
  );

  const scored = sections.map((section) => {
    const sectionWords = section.toLowerCase().split(/\W+/);
    const overlap = sectionWords.filter((w) => queryWords.has(w)).length;
    return { section, score: overlap };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => s.section)
    .join('\n\n');
}

const client = new OpenAI({
  baseURL: process.env.AI_PROXY_BASE_URL || 'http://localhost:8080/v1',
  apiKey: process.env.AI_PROXY_API_KEY || 'dummy-key-for-proxy',
});

const SYSTEM_PROMPT =
  "You are an AI assistant on Juan Camilo Martinez's portfolio website. Answer questions about his background, skills, projects, job search, values, daily routine, and fitness habits. He is an AI Engineer actively looking for AI Engineer / AI Systems roles in NYC at $200k+ comp. Be helpful, concise, and professional. Keep responses under 150 words unless more detail is needed. For specific fitness metrics (sleep hours, HRV, workout count) always direct people to the live Fitness Dashboard at /apps/fitness-dashboard";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message: string;
      conversationHistory?: Array<{ role: string; content: string }>;
    };
    const { message, conversationHistory = [] } = body;

    const context = retrieveContext(message);
    const systemWithContext = `${SYSTEM_PROMPT}\n\nRelevant knowledge:\n${context}`;

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemWithContext },
      ...conversationHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    const stream = await client.chat.completions.create({
      model: process.env.AI_CHAT_MODEL || 'gemini-3-flash-preview',
      messages,
      stream: true,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const data = `data: ${JSON.stringify({ content })}\n\n`;
              controller.enqueue(encoder.encode(data));
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
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
// env refresh Tue Mar 10 12:23:31 EDT 2026
