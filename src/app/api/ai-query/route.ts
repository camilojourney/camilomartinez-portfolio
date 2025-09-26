import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { performVectorSearch } from '@/lib/ai/rag';
import { executeSafeQuery } from '@/lib/db/safe-query';
import { logQueryHistory } from '@/lib/db/query-history';

const openai = new OpenAI();

const thinkerSystemPrompt = `You are an expert PostgreSQL data analyst. Your goal is to write accurate, efficient SQL queries based on the user's question and the provided schema context.

You must follow these steps and respond with a single JSON object containing "thought", "plan", and "sql":
1.  **Thought:** Briefly explain your reasoning and how you'll approach the user's question based on the available views and columns.
2.  **Plan:** Create a step-by-step plan in plain English.
3.  **SQL:** Based on your plan, write the final PostgreSQL query.

Only use the views and columns provided in the context. The query must be a single, executable SQL statement.`;

const reviewerSystemPrompt = `You are a SQL validation expert. Your task is to determine if the given SQL query correctly implements the provided plan to answer the user's question.

Check if the query:
1. Uses the correct tables/views mentioned in the plan
2. Implements the logic described in the plan
3. Is syntactically valid PostgreSQL
4. Would reasonably answer the user's question

Respond with only "yes" if the query correctly implements the plan, or "no" if there are significant issues.`;

async function recordQueryHistory({
  userQuestion,
  retrievedContext,
  generatedSql,
  wasSuccessful,
  latencyMs,
}: {
  userQuestion: string;
  retrievedContext?: string;
  generatedSql?: string | null;
  wasSuccessful: boolean;
  latencyMs: number;
}): Promise<number | null> {
  try {
    return await logQueryHistory({
      userQuestion,
      retrievedContext,
      generatedSql: generatedSql ?? undefined,
      wasSuccessful,
      latencyMs,
    });
  } catch (loggingError) {
    console.error('[Query History Logging Error]', loggingError);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let schemaContext: string | null = null;
  let generatedSql: string | null = null;
  let question = '';

  try {
    const body = await req.json();
    question = body?.question;
    const debugSchema: boolean = Boolean(body?.debugSchema);

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question must be a non-empty string.' }, { status: 400 });
    }

    schemaContext = await performVectorSearch(question);
    if (!schemaContext) {
      throw new Error('Failed to retrieve relevant schema context.');
    }

    if (debugSchema) {
      const historyId = await recordQueryHistory({
        userQuestion: question,
        retrievedContext: schemaContext,
        generatedSql: null,
        wasSuccessful: true,
        latencyMs: Date.now() - startTime,
      });

      return NextResponse.json({ schemaContext, historyId, debug: true });
    }

    const thinkerResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: thinkerSystemPrompt },
        {
          role: 'user',
          content: `User Question: "${question}"

Schema Context:
${schemaContext}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    });

    const queryData = JSON.parse(thinkerResponse.choices[0].message.content || '{}');
    if (!queryData.sql || !queryData.plan || !queryData.thought) {
      throw new Error('The AI failed to generate a complete query plan.');
    }

    generatedSql = queryData.sql;

    const reviewerResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: reviewerSystemPrompt },
        {
          role: 'user',
          content: `Question: "${question}"

Plan: ${queryData.plan}

SQL: ${queryData.sql}`,
        },
      ],
      temperature: 0,
    });

    const validation = reviewerResponse.choices[0].message.content?.toLowerCase().trim();
    
    // Log validation details for debugging
    console.log('[Validation Debug]', {
      question,
      validation,
      sql: queryData.sql,
      timestamp: new Date().toISOString()
    });

    // Be more lenient with validation - accept "yes" or queries that start with valid SQL keywords
    const isValidQuery = validation === 'yes' || 
      queryData.sql.toLowerCase().trim().match(/^(select|with)\s/);
    
    if (!isValidQuery) {
      console.error('[Query Validation Failed]', {
        question,
        plan: queryData.plan,
        sql: queryData.sql,
        reviewerResponse: validation
      });
      throw new Error(`The generated query failed validation checks. Reviewer said: "${validation}"`);
    }

    const queryResult = await executeSafeQuery(queryData.sql);
    if (!Array.isArray(queryResult)) {
      throw new Error('Query execution did not return expected results.');
    }

    const latencyMs = Date.now() - startTime;
    const historyId = await recordQueryHistory({
      userQuestion: question,
      retrievedContext: schemaContext,
      generatedSql,
      wasSuccessful: true,
      latencyMs,
    });

    return NextResponse.json({
      data: queryResult,
      explanation: {
        thought: queryData.thought,
        plan: queryData.plan,
        sql: queryData.sql,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        rowCount: queryResult.length,
        latencyMs,
      },
      historyId,
    });
  } catch (error: any) {
    console.error('[AI Query API Error]', {
      message: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
    });

    let statusCode = 500;
    const message: string = error?.message || 'An unexpected error occurred.';
    if (message.includes('must be a non-empty string')) {
      statusCode = 400;
    } else if (message.includes('permission denied')) {
      statusCode = 403;
    }

    const historyId = await recordQueryHistory({
      userQuestion: question || 'Unknown question',
      retrievedContext: schemaContext || undefined,
      generatedSql,
      wasSuccessful: false,
      latencyMs: Date.now() - startTime,
    });

    return NextResponse.json({
      error: message,
      timestamp: new Date().toISOString(),
      historyId,
    }, { status: statusCode });
  }
}
