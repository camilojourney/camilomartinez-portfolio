import OpenAI from 'openai';
import { NextResponse } from 'next/server';

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
}

/**
 * Self-Evaluation Endpoint
 *
 * Uses LLM-as-a-Judge pattern to evaluate answer quality
 * This enables:
 * - Automated quality scoring
 * - Continuous improvement feedback loop
 * - Identification of knowledge gaps
 * - Training data quality assessment
 */
export async function POST(req: Request) {
  try {
    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured on the server.' },
        { status: 503 }
      );
    }

    const { question, answer, context } = await req.json();

    const evaluationPrompt = `You are an expert evaluator assessing the quality of chatbot responses.

# Task
Evaluate how well the ANSWER addresses the QUESTION given the available CONTEXT.

# Evaluation Criteria
1. **Accuracy**: Is the information factually correct based on the context?
2. **Relevance**: Does it directly address what was asked?
3. **Completeness**: Does it provide sufficient detail?
4. **Clarity**: Is it easy to understand?
5. **Tone**: Is it appropriately friendly and professional?

# Question
${question}

# Answer
${answer}

# Available Context
${context.substring(0, 2000)}... [truncated]

# Your Response Format
Provide a JSON response with:
{
  "score": 0.0-1.0,
  "reasoning": "brief explanation of the score",
  "strengths": ["strength1", "strength2"],
  "improvements": ["suggestion1", "suggestion2"],
  "missing_information": ["what's missing", "what could be added"]
}

Be strict but fair. A score of 0.8+ means excellent, 0.6-0.8 is good, 0.4-0.6 needs improvement, below 0.4 is poor.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Faster and cheaper for evaluation
      messages: [{ role: 'user', content: evaluationPrompt }],
      temperature: 0.3, // Low temperature for consistent evaluation
      response_format: { type: 'json_object' },
    });

    const evaluation = JSON.parse(response.choices[0].message.content || '{}');

    // Log evaluation for monitoring
    console.log('Answer evaluated:', {
      score: evaluation.score,
      questionLength: question.length,
      answerLength: answer.length,
    });

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('Evaluation error:', error);
    return NextResponse.json(
      {
        score: 0.5,
        reasoning: 'Evaluation failed',
        error: 'Could not evaluate answer',
      },
      { status: 500 }
    );
  }
}
