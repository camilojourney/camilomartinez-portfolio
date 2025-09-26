import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { performVectorSearch } from '@/lib/ai/rag';
import { executeSafeQuery } from '@/lib/db/safe-query';

// Initialize OpenAI client
const openai = new OpenAI();

/**
 * System prompt for the SQL generation model.
 * This prompt ensures the model follows a structured approach to query generation.
 */
const thinkerSystemPrompt = `You are an expert PostgreSQL data analyst. Your goal is to write accurate, efficient SQL queries based on the user's question and the provided schema context.

You must follow these steps and respond with a single JSON object containing "thought", "plan", and "sql":
1.  **Thought:** Briefly explain your reasoning and how you'll approach the user's question based on the available views and columns.
2.  **Plan:** Create a step-by-step plan in plain English.
3.  **SQL:** Based on your plan, write the final PostgreSQL query.

Only use the views and columns provided in the context. The query must be a single, executable SQL statement.`;

/**
 * System prompt for the query validation model.
 * Ensures generated SQL matches the intended plan and question.
 */
const reviewerSystemPrompt = `You are a SQL validation expert. Your task is to determine if the given SQL query correctly implements the provided plan to answer the user's question. Respond with only "yes" or "no".`;

/**
 * Main API route handler for AI-powered database queries.
 * Implements a multi-stage pipeline:
 * 1. Schema Context Retrieval (RAG)
 * 2. Query Generation
 * 3. Query Validation
 * 4. Safe Execution
 */
export async function POST(req: NextRequest) {
  try {
    // Input validation
    const { question } = await req.json();
    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question must be a non-empty string.' }, 
        { status: 400 }
      );
    }

    // 1. Schema Linking (RAG)
    const schemaContext = await performVectorSearch(question);
    if (!schemaContext) {
      throw new Error('Failed to retrieve relevant schema context.');
    }

    // 2. Decomposition & SQL Generation (The "Thinker")
    const thinkerResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: thinkerSystemPrompt },
        { 
          role: 'user', 
          content: `User Question: "${question}"\n\nSchema Context:\n${schemaContext}` 
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0 // Ensure deterministic output
    });
    
    const queryData = JSON.parse(thinkerResponse.choices[0].message.content || '{}');
    if (!queryData.sql || !queryData.plan || !queryData.thought) {
      throw new Error("The AI failed to generate a complete query plan.");
    }

    // 3. Self-Correction & Validation (The "Reviewer")
    const reviewerResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: reviewerSystemPrompt },
        { 
          role: 'user', 
          content: `Question: "${question}"\n\nPlan: ${queryData.plan}\n\nSQL: ${queryData.sql}` 
        }
      ],
      temperature: 0 // Ensure deterministic output
    });

    const validation = reviewerResponse.choices[0].message.content?.toLowerCase().trim();
    if (validation !== 'yes') {
      throw new Error('The generated query failed validation checks.');
    }

    // 4. Safe Execution
    const queryResult = await executeSafeQuery(queryData.sql);
    if (!Array.isArray(queryResult)) {
      throw new Error('Query execution did not return expected results.');
    }

    // 5. Final Response
    return NextResponse.json({
      data: queryResult,
      explanation: {
        thought: queryData.thought,
        plan: queryData.plan,
        sql: queryData.sql
      },
      metadata: {
        timestamp: new Date().toISOString(),
        rowCount: queryResult.length
      }
    });

  } catch (error: any) {
    // Error handling with specific error types
    console.error('[AI Query API Error]', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    // Determine appropriate status code based on error type
    let statusCode = 500;
    if (error.message.includes('must be a non-empty string')) {
      statusCode = 400;
    } else if (error.message.includes('permission denied')) {
      statusCode = 403;
    }

    return NextResponse.json({ 
      error: error.message || 'An unexpected error occurred.',
      timestamp: new Date().toISOString()
    }, { 
      status: statusCode 
    });
  }
}