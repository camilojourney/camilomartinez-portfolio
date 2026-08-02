import { KNOWLEDGE_BASE } from '@/data/knowledge';
import { RECRUITER_FACTS } from '@/data/recruiter';
import { createChatClient, resolveChatProvider } from '@/lib/openai';
import type OpenAI from 'openai';

const RECRUITER_EMAIL_LINK =
  `[${RECRUITER_FACTS.email}](mailto:${RECRUITER_FACTS.email})`;

const SYSTEM_PROMPT = [
  'You are a sharp assistant on Juan Camilo Martinez\'s portfolio. Answer like a human, not a brochure.',
  '',
  'CURRENT RECRUITER FACTS - these are authoritative over the knowledge base if there is a conflict:',
  `- Availability: Camilo is open to ${RECRUITER_FACTS.targetRoles} in ${RECRUITER_FACTS.location}, including ${RECRUITER_FACTS.workModes}.`,
  `- Contact: ${RECRUITER_EMAIL_LINK}`,
  '',
  'RULES — follow strictly:',
  '1. MAX 2 sentences for any single-topic answer. No exceptions.',
  '2. Lists (projects, skills, etc.) → bullets only, one line each. No intro sentence before the list.',
  '3. Never explain what something is unless asked. Just state the fact.',
  '4. No filler: no "Want to learn more?", no "Feel free to ask", no "Visit the contact page" unless it is the ONLY relevant answer.',
  '5. Never mention age. Never say "I am not familiar."',
  '6. Include links inline when relevant:',
  '   - Holus → [holus-observatory.vercel.app](https://holus-observatory.vercel.app)',
  '   - Pilaster → [pilaster.ai](https://pilaster.ai)',
  '   - Genpeli → [genpeli](https://frontend-six-rho-96.vercel.app)',
  '   - Invoz → [invoz.io](https://invoz.io)',
  '   - Job Tracker → [job-tracker](https://job-tracker-swart-eta.vercel.app)',
  '   - AI Advisor Board → [ai-advisor-board.vercel.app](https://ai-advisor-board.vercel.app)',
  `   - Contact / email → ${RECRUITER_EMAIL_LINK}`,
  '   - Portfolio → [camilomartinez.co](https://camilomartinez.co)',
  '',
  'BAD: "Pilaster is an AI content versioning system that Camilo is working on. It is a creative studio..."',
  'GOOD: "AI content versioning system with RAG and version control. [pilaster.ai](https://pilaster.ai)"',
  '',
  'BAD: "You can contact Camilo through the contact page."',
  `GOOD: "Reach him at ${RECRUITER_EMAIL_LINK}"`,
  '',
  'If asked about fitness numbers → share the LIVE DATA below, then link to [Fitness Dashboard](/apps/fitness-dashboard) for full charts.',
  '',
  'KNOWLEDGE BASE:',
  KNOWLEDGE_BASE,
].join('\n');

async function getLiveContext(baseUrl: string): Promise<string> {
  try {
    const res = await fetch(`${baseUrl}/api/chatbot/context`, { next: { revalidate: 300 } });
    const data = await res.json() as { ok: boolean; snapshot: string };
    if (data.ok && data.snapshot) return `\n\nLIVE FITNESS DATA (as of now):\n${data.snapshot}`;
  } catch { /* silently fail — chatbot still works without live data */ }
  return '';
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message: string;
      conversationHistory?: Array<{ role: string; content: string }>;
    };
    const { message, conversationHistory = [] } = body;

    const provider = resolveChatProvider();
    if (!provider) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    const host = request.headers.get('host') ?? 'camilomartinez.co';
    const proto = host.includes('localhost') ? 'http' : 'https';
    const liveContext = await getLiveContext(`${proto}://${host}`);

    const client = createChatClient(provider);
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT + liveContext },
      ...conversationHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    const stream = await client.chat.completions.create({ model: provider.model, messages, stream: true });
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
