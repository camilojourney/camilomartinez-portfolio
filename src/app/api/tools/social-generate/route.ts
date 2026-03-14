import { NextRequest, NextResponse } from 'next/server';

const PROMPT_TEMPLATES: Record<string, (thought: string) => string> = {
  'x-post': (t) => `Convert this raw thought into a single X (Twitter) post. Max 280 chars. No hashtags unless they add value. Punchy, direct, conversational. Output ONLY the post text.\n\nThought: ${t}`,
  'x-thread': (t) => `Convert this into an X thread of 3 tweets. Format:\n1/ ...\n2/ ...\n3/ ...\nEach tweet max 280 chars. First tweet must hook. Output ONLY the thread.\n\nThought: ${t}`,
  'threads': (t) => `Convert this into a Threads post. Max 500 chars. Casual, authentic. Optional 1-2 hashtags at end. Output ONLY the post.\n\nThought: ${t}`,
  'linkedin': (t) => `Convert this into a LinkedIn post. 150-300 words. Professional but personal. Short paragraphs. Hook first. End with question or CTA. Output ONLY the post.\n\nThought: ${t}`,
  'instagram': (t) => `Convert this into an Instagram caption. 100-150 words. Engaging. End with 5-8 hashtags on a new line. Output ONLY the caption.\n\nThought: ${t}`,
  'facebook': (t) => `Convert this into a Facebook post. 80-150 words. Conversational, warm. End with a question. Output ONLY the post.\n\nThought: ${t}`,
};

async function callLLM(prompt: string): Promise<string> {
  // Try local proxy first (works when running locally on Juan's Mac)
  try {
    const r = await fetch('http://localhost:8080/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer dummy' },
      body: JSON.stringify({ model: 'google/gemini-2.5-pro', messages: [{ role: 'user', content: prompt }], max_tokens: 500, temperature: 0.8 }),
      signal: AbortSignal.timeout(5000),
    });
    if (r.ok) {
      const data = await r.json();
      return data.choices?.[0]?.message?.content?.trim() ?? '';
    }
  } catch {
    // proxy not available — fall through to Groq
  }

  // Fallback: Groq (free tier, works on Vercel)
  const groqKey = process.env.GROQ_API_KEY ?? '';
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
    body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 500, temperature: 0.8 }),
  });

  if (!r.ok) throw new Error(`Groq error: ${r.status}`);
  const data = await r.json();
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

export async function POST(request: NextRequest) {
  try {
    const { thought, platforms }: { thought: string; platforms: string[] } = await request.json();

    if (!thought?.trim() || !platforms?.length) {
      return NextResponse.json({ error: 'Missing thought or platforms' }, { status: 400 });
    }

    const results = await Promise.all(
      platforms.map(async (platform) => {
        const template = PROMPT_TEMPLATES[platform];
        if (!template) return { platform, content: `Unknown platform: ${platform}` };
        const content = await callLLM(template(thought));
        return { platform, content };
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Social generate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
