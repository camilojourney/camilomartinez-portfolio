import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const PROMPT_TEMPLATES: Record<string, (thought: string) => string> = {
  'x-post': (t) => `Convert this raw thought into a single X (Twitter) post. Max 280 chars. No hashtags unless they add value. Punchy, direct, conversational. Output ONLY the post text, nothing else.\n\nThought: ${t}`,
  'x-thread': (t) => `Convert this into an X thread of 3 tweets. Format exactly as:\n1/ ...\n2/ ...\n3/ ...\nEach tweet max 280 chars. First tweet must hook. Output ONLY the thread, nothing else.\n\nThought: ${t}`,
  'threads': (t) => `Convert this into a Threads post. Max 500 chars. Casual, authentic, conversational. Optional 1-2 hashtags at the end. Output ONLY the post text.\n\nThought: ${t}`,
  'linkedin': (t) => `Convert this into a LinkedIn post. 150-300 words. Professional but personal. Short paragraphs. Start with a hook. End with a question or CTA. No corporate speak. Output ONLY the post.\n\nThought: ${t}`,
  'instagram': (t) => `Convert this into an Instagram caption. 100-150 words. Engaging, visual language. End with 5-8 relevant hashtags on a new line. Output ONLY the caption.\n\nThought: ${t}`,
  'facebook': (t) => `Convert this into a Facebook post. 80-150 words. Conversational, warm, community-oriented. End with a question to drive comments. Output ONLY the post.\n\nThought: ${t}`,
};

export async function POST(request: NextRequest) {
  try {
    const { thought, platforms }: { thought: string; platforms: string[] } = await request.json();

    if (!thought?.trim() || !platforms?.length) {
      return NextResponse.json({ error: 'Missing thought or platforms' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro-exp-03-25' });

    const results = await Promise.all(
      platforms.map(async (platform) => {
        const template = PROMPT_TEMPLATES[platform];
        if (!template) return { platform, content: `Unknown platform: ${platform}` };

        const result = await model.generateContent(template(thought));
        const content = result.response.text().trim();
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
