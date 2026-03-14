import { NextRequest, NextResponse } from 'next/server';

const PROMPT_TEMPLATES: Record<string, (thought: string) => string> = {
  'x-post': (t: string) => `Convert this raw thought into a single X post. Max 280 chars. No hashtags unless they add value. Punchy, direct. Just the post text.

Thought: ${t}`,
  'x-thread': (t: string) => `Convert this into an X thread of 3 tweets. Format:
1/ ...
2/ ...
3/ ...

First tweet must hook.

Thought: ${t}`,
  'threads': (t: string) => `Convert this into a Threads post. Max 500 chars. Casual, authentic. Optional 1-2 hashtags.

Thought: ${t}`,
  'linkedin': (t: string) => `Convert this into a LinkedIn post. 150-300 words. Professional but personal. Short paragraphs. Hook first. End with question or CTA.

Thought: ${t}`,
  'instagram': (t: string) => `Convert this into an Instagram caption. 100-150 words. Engaging. End with 5-8 hashtags.

Thought: ${t}`,
  'facebook': (t: string) => `Convert this into a Facebook post. 80-150 words. Conversational, warm. Ask a question at end.

Thought: ${t}`,
};

export async function POST(request: NextRequest) {
  try {
    const { thought, platforms }: { thought: string; platforms: string[] } = await request.json();

    if (!thought?.trim() || !platforms || platforms.length === 0) {
      return NextResponse.json({ error: 'Missing thought or platforms' }, { status: 400 });
    }

    const results = await Promise.all(
      platforms.map(async (platform) => {
        const template = PROMPT_TEMPLATES[platform as keyof typeof PROMPT_TEMPLATES];
        if (!template) {
          throw new Error(`Unknown platform: ${platform}`);
        }

        const prompt = template(thought);

        const llmResponse = await fetch('http://localhost:8080/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'anthropic/claude-sonnet-4-6',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 2000,
            temperature: 0.7,
          }),
        });

        if (!llmResponse.ok) {
          const errorText = await llmResponse.text();
          throw new Error(`LLM API error: ${llmResponse.status} ${errorText}`);
        }

        const data = await llmResponse.json();
        const content = data.choices?.[0]?.message?.content?.trim() || 'No content generated';

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
