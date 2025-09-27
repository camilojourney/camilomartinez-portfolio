import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const systemPrompt =
  "You are a helpful AI assistant representing Camilo Martinez on his portfolio website. You are speaking to a visitor. Answer questions about Camilo's skills, experience, and projects based on his resume and the context of the portfolio. Be friendly, professional, and concise.";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages must be provided as a non-empty array' },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    });

    return NextResponse.json(response.choices[0].message);
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Failed to get response from AI.' }, { status: 500 });
  }
}
