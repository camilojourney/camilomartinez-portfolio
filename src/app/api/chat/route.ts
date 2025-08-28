import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const systemPrompt = "You are a helpful AI assistant representing Camilo Martinez on his portfolio website. You are speaking to a visitor. Answer questions about Camilo's skills, experience, and projects based on his resume and the context of the portfolio. Be friendly, professional, and concise.";

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // or another preferred model
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    });

    return NextResponse.json(response.choices[0].message);
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Failed to get response from AI." }, { status: 500 });
  }
}
