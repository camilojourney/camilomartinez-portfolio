import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { performVectorSearch } from '@/lib/ai/rag';
import { executeSafeQuery } from '@/lib/db/safe-query';
import { logQueryHistory } from '@/lib/db/query-history';
import { checkRateLimit, incrementQuestionCount, getClientIP } from '@/lib/db/rate-limiting';

const openai = new OpenAI();

const thinkerSystemPrompt = `You are an expert PostgreSQL data analyst. Your goal is to write accurate, efficient SQL queries based on the user's question and the provided schema context.

IMPORTANT CONTEXT: This is a SINGLE-USER fitness tracking system belonging to Camilo Martinez. All data belongs to one person (Camilo), so treat multi-user questions as personal metrics questions.

Examples of question transformations:
- "Who had the highest strain score?" → "What was your highest strain score?"
- "Which user has the highest average heart rate?" → "What is your average heart rate?"
- "Compare users' performance" → "Compare your performance across different time periods"

Rephrase every question into first-person singular (you/your) before planning the SQL. Never reference or compare multiple users because there is only Camilo's data.

You must follow these steps and respond with a single JSON object containing "thought", "plan", and "sql":
1.  **Thought:** Briefly explain your reasoning and how you'll approach the user's question based on the available views and columns. If the question asks about multiple users, acknowledge this is a single-user system.
2.  **Plan:** Create a step-by-step plan in plain English, rephrasing multi-user questions to focus on Camilo's personal metrics.
3.  **SQL:** Based on your plan, write the final PostgreSQL query.

CRITICAL RULES AND EXAMPLES:
- Only use SELECT and WITH statements (Common Table Expressions are allowed)
- Only use the views and columns PROVIDED in the context - never assume column names
- This is a SINGLE-USER system - no need to filter by user_id as all data belongs to Camilo
- The view daily_fitness_snapshot uses the column snapshot_date for every time-based filter. Always rely on snapshot_date for WHERE, ORDER BY, or GROUP BY clauses within that view. Never reference a generic column named date.
- Ensure the query is syntactically correct PostgreSQL
- Use appropriate JOINs, WHERE clauses, and ORDER BY when needed
- The query must be a single, executable SQL statement

COMMON PATTERNS AND EXAMPLES:
1. **Time-based queries**: Use DATE() function on actual date columns, not table names
   ❌ WRONG: WHERE DATE(strava_runs) = '2024-01-01'
   ✅ CORRECT: WHERE DATE(start_date_local) = '2024-01-01'

2. **Aggregation functions**: Always specify the column to aggregate
   ❌ WRONG: SELECT AVG(pace) FROM runs WHERE pace IS NULL
   ✅ CORRECT: SELECT AVG(avg_pace_ms) FROM daily_fitness_snapshot WHERE avg_pace_ms IS NOT NULL

3. **Column existence**: Only use columns that exist in the provided schema context
   ❌ WRONG: SELECT workout_date FROM whoop_workouts (if workout_date not in schema)
   ✅ CORRECT: SELECT created_at FROM whoop_workouts (if created_at is in schema)

4. **JOIN operations**: Use proper table aliases and existing foreign key relationships
   ✅ CORRECT: SELECT r.distance_meters, s.sleep_score FROM strava_runs r JOIN whoop_sleep s ON DATE(r.start_date_local) = DATE(s.created_at)

5. **WHERE clauses with dates**: Use COLUMN names, never table or view names
   ❌ WRONG: WHERE daily_fitness_snapshot >= '2024-01-01' (comparing table name to date)
   ✅ CORRECT: WHERE date >= '2024-01-01' (comparing date column to date)
   ❌ WRONG: WHERE whoop_sleep >= last_week.start_date (table name comparison)
   ✅ CORRECT: WHERE created_at >= last_week.start_date (column comparison)

CRITICAL CHECKLIST BEFORE WRITING SQL:
- Verify ALL column names exist in the provided schema context
- Never use table/view names in WHERE, GROUP BY, or ORDER BY clauses
- Use proper column names from the schema context
- Check data types for proper filtering and aggregation  
- Ensure table relationships are correct`;

const reviewerSystemPrompt = `You are a SQL validation expert. Your task is to determine if the given SQL query correctly implements the provided plan to answer the user's question.

CONTEXT: This is a single-user fitness tracking system for Camilo Martinez. All data belongs to one person.

Check if the query:
1. Uses the correct tables/views mentioned in the plan
2. Implements the logic described in the plan
3. Is syntactically valid PostgreSQL
4. Would reasonably answer the user's question
5. Appropriately handles the single-user context (no unnecessary user filtering)

Respond with only "yes" if the query correctly implements the plan, or "no" if there are significant issues.`;

async function recordQueryHistory({
  userQuestion,
  retrievedContext,
  generatedSql,
  wasSuccessful,
  latencyMs,
  failureReason,
  userFriendlyAnswer,
}: {
  userQuestion: string;
  retrievedContext?: string;
  generatedSql?: string | null;
  wasSuccessful: boolean;
  latencyMs: number;
  failureReason?: string;
  userFriendlyAnswer?: string;
}): Promise<number | null> {
  try {
    return await logQueryHistory({
      userQuestion,
      retrievedContext,
      generatedSql: generatedSql ?? undefined,
      wasSuccessful,
      latencyMs,
      failureDetails: failureReason,
      userFriendlyAnswer,
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
  let schemaRetrievalError: string | undefined;

  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(req);
    console.log(`[Rate Limit] Checking limits for IP: ${clientIP}`);
    
    // Check rate limit BEFORE processing the request
    const rateLimitStatus = await checkRateLimit(clientIP);
    
    if (rateLimitStatus.isBlocked) {
      console.log(`[Rate Limit] Blocked request from IP: ${clientIP} (${rateLimitStatus.questionsUsed}/${5} questions used today)`);
      
      // Return rate limit error with helpful information
      return NextResponse.json({
        error: `You have reached your daily limit of 5 questions. You have used ${rateLimitStatus.questionsUsed} questions today.`,
        rateLimitInfo: {
          questionsUsed: rateLimitStatus.questionsUsed,
          questionsRemaining: 0,
          resetDate: rateLimitStatus.resetDate,
          dailyLimit: 5,
        },
        timestamp: new Date().toISOString(),
      }, { status: 429 }); // 429 Too Many Requests
    }

    // Add request timeout handling
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000);
    });

    const body = await Promise.race([
      req.json(),
      timeoutPromise
    ]);

    question = body?.question;
    const debugSchema: boolean = Boolean(body?.debugSchema);

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Question must be a non-empty string.' }, { status: 400 });
    }

    // Validate question length to prevent excessive processing
    if (question.length > 500) {
      return NextResponse.json({ error: 'Question too long. Please keep it under 500 characters.' }, { status: 400 });
    }

    // Retrieve schema context with timeout and detailed error tracking
    try {
      console.log('[Schema Retrieval] Starting vector search for question:', question.substring(0, 100) + '...');
      
      // Add timeout protection to schema retrieval
      const schemaPromise = performVectorSearch(question);
      const schemaTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Schema retrieval timeout after 10 seconds')), 10000);
      });
      
      schemaContext = await Promise.race([schemaPromise, schemaTimeoutPromise]) as string;
      
      console.log('[Schema Retrieval] Result:', schemaContext ? `${schemaContext.length} characters retrieved` : 'NULL result');
      
      if (!schemaContext || schemaContext.trim().length === 0) {
        schemaRetrievalError = 'Vector search returned empty results - no relevant schema found for question. This could indicate: empty embedding table, no matching schema, or OpenAI embedding API issues.';
        throw new Error(schemaRetrievalError);
      }
    } catch (searchError: any) {
      schemaRetrievalError = `Schema retrieval failed: ${searchError?.message || 'Unknown error'}. This could be due to: OpenAI API issues, database connection problems, empty embedding results, or network timeouts.`;
      console.error('[Schema Search Error]', {
        error: searchError?.message,
        stack: searchError?.stack,
        question: question.substring(0, 100),
        timestamp: new Date().toISOString()
      });
      throw new Error(schemaRetrievalError);
    }

    if (debugSchema) {
      const historyId = await recordQueryHistory({
        userQuestion: question,
        retrievedContext: schemaContext,
        generatedSql: null,
        wasSuccessful: !!schemaContext, // Only successful if schema context was retrieved
        latencyMs: Date.now() - startTime,
        failureReason: schemaContext ? undefined : 'Debug mode: Schema retrieval returned empty context',
      });

      return NextResponse.json({ 
        schemaContext, 
        historyId, 
        debug: true,
        schemaLength: schemaContext?.length || 0,
        hasSchema: !!schemaContext
      });
    }

    // Generate query with retry mechanism and better error handling
    let thinkerResponse;
    let queryGenAttempts = 0;
    const maxQueryGenAttempts = 2;
    
    while (queryGenAttempts < maxQueryGenAttempts) {
      try {
        thinkerResponse = await openai.chat.completions.create({
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
        }, {
          timeout: 20000, // 20 second timeout in options
        });
        break;
      } catch (genError: any) {
        queryGenAttempts++;
        console.warn(`Query generation attempt ${queryGenAttempts} failed:`, genError?.message);
        if (queryGenAttempts >= maxQueryGenAttempts) {
          throw new Error(`AI query generation failed after ${maxQueryGenAttempts} attempts: ${genError?.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      }
    }

    if (!thinkerResponse) {
      throw new Error('Failed to generate query response from AI');
    }

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

    // Enhanced validation with multiple safety checks
    const sqlLower = queryData.sql.toLowerCase().trim();
    const startsWithValidKeyword = sqlLower.match(/^(select|with)\s/);
    const containsForbiddenOps = sqlLower.match(/\b(drop|delete|update|insert|truncate|alter|create|grant|revoke)\b/);
    
    // Additional syntax validation
    const hasValidSqlStructure = sqlLower.includes('from') || sqlLower.includes('values');
    const hasProperSemicolonUsage = !sqlLower.includes(';') || sqlLower.endsWith(';');
    
    // Check for common SQL injection patterns
    const hasSuspiciousPatterns = sqlLower.match(/;(\s*)?(drop|delete|update|insert)/);
    
    const validationChecks = {
      reviewerApproval: validation === 'yes',
      validKeyword: !!startsWithValidKeyword,
      noForbiddenOps: !containsForbiddenOps,
      validStructure: hasValidSqlStructure,
      properSemicolons: hasProperSemicolonUsage,
      noInjection: !hasSuspiciousPatterns
    };
    
    // STRICT validation - only accept queries that pass reviewer approval
    // The reviewer is specifically trained to catch SQL errors like table names in WHERE clauses
    const isValidQuery = validationChecks.reviewerApproval;
    
    if (!isValidQuery) {
      console.error('[Query Validation Failed]', {
        question,
        plan: queryData.plan,
        sql: queryData.sql,
        reviewerResponse: validation,
        validationChecks
      });
      
      let errorMessage = 'The generated query failed validation checks.';
      if (!validationChecks.validKeyword) {
        errorMessage += ' Query must start with SELECT or WITH.';
      }
      if (validationChecks.noForbiddenOps === false) {
        errorMessage += ' Query contains forbidden operations.';
      }
      if (!validationChecks.validStructure) {
        errorMessage += ' Query has invalid SQL structure.';
      }
      if (hasSuspiciousPatterns) {
        errorMessage += ' Query contains suspicious patterns.';
      }
      
      throw new Error(errorMessage);
    }

    // Execute query with enhanced error handling and retry mechanism
    let queryResult: any[] | undefined;
    let queryExecAttempts = 0;
    const maxQueryExecAttempts = 2;
    
    while (queryExecAttempts < maxQueryExecAttempts) {
      try {
        queryResult = await executeSafeQuery(queryData.sql);
        if (Array.isArray(queryResult)) {
          break;
        } else {
          throw new Error('Query execution did not return expected array results.');
        }
      } catch (execError: any) {
        queryExecAttempts++;
        console.warn(`Query execution attempt ${queryExecAttempts} failed:`, execError?.message);
        
        // Don't retry on certain errors
        const nonRetryableErrors = [
          'permission denied',
          'relation does not exist',
          'column does not exist',
          'syntax error',
          'forbidden operations'
        ];
        
        const isNonRetryable = nonRetryableErrors.some(pattern => 
          execError?.message?.toLowerCase().includes(pattern)
        );
        
        if (isNonRetryable || queryExecAttempts >= maxQueryExecAttempts) {
          throw new Error(`Query execution failed: ${execError?.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      }
    }

    if (!queryResult) {
      throw new Error('Query execution failed to return results after all attempts.');
    }

    // Generate natural language answer as Camilo's personal fitness assistant
    console.log('[Natural Language Response] Generating user-friendly answer...');
    let userFriendlyAnswer = '';
    
    try {
      const answerResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are Camilo Martinez's personal fitness assistant. You have access to all of Camilo's fitness data from WHOOP and Strava.

IMPORTANT CONTEXT:
- You are speaking TO Camilo about HIS personal data
- Always use "you" when referring to Camilo
- Be conversational, personal, and supportive
- Frame everything as "your data shows..." or "you did..."
- If data is empty/null, acknowledge you only have Camilo's data and suggest what might be available

RESPONSE STYLE:
- Conversational and personal (like a knowledgeable friend)
- Start responses acknowledging this is Camilo's personal data
- Include specific numbers and insights from the data
- Keep responses concise but informative (2-3 sentences max)
- Use fitness terminology appropriately

EXAMPLES:
- Instead of: "The average is 60.3%"
- Say: "Camilo, your average recovery score is 60.3%, which indicates moderate recovery levels."

- Instead of: "Query returned 5 rows"  
- Say: "Looking at your data, you had 5 boxing sessions with details on duration and strain levels."

Your job is to transform raw query results into natural, personal responses for Camilo.`
          },
          {
            role: 'user',
            content: `Original Question: "${question}"

Query Results: ${JSON.stringify(queryResult, null, 2)}

Please provide a natural, conversational response to Camilo about his fitness data. Focus on the key insights from the results.`
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
      }, {
        timeout: 15000,
      });

      userFriendlyAnswer = answerResponse.choices[0].message.content || '';
      console.log('[Natural Language Response] Generated successfully');
    } catch (answerError: any) {
      console.warn('[Natural Language Response] Failed to generate:', answerError?.message);
      userFriendlyAnswer = `Here's your fitness data, Camilo. The query returned ${queryResult.length} result${queryResult.length !== 1 ? 's' : ''}.`;
    }

    const latencyMs = Date.now() - startTime;
    
    // Increment question count for successful queries
    const updatedRateLimit = await incrementQuestionCount(clientIP);
    console.log(`[Rate Limit] Question count incremented for IP: ${clientIP} (${updatedRateLimit.questionsUsed}/${5} questions used today)`);
    
    const historyId = await recordQueryHistory({
      userQuestion: question,
      retrievedContext: schemaContext,
      generatedSql,
      wasSuccessful: true,
      latencyMs,
      userFriendlyAnswer,
    });

    return NextResponse.json({
      data: queryResult,
      answer: userFriendlyAnswer, // Natural language response
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
      rateLimitInfo: {
        questionsUsed: updatedRateLimit.questionsUsed,
        questionsRemaining: updatedRateLimit.questionsRemaining,
        resetDate: updatedRateLimit.resetDate,
        dailyLimit: 5,
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

    // Determine the specific failure reason for better debugging
    let failureReason = message;
    
    if (!schemaContext) {
      failureReason = `Schema retrieval failed: ${schemaRetrievalError || 'Unknown schema retrieval error'}`;
    } else if (!generatedSql) {
      failureReason = `SQL generation failed: ${message}`;
    } else {
      failureReason = `Query execution failed: ${message}`;
    }

    const historyId = await recordQueryHistory({
      userQuestion: question || 'Unknown question',
      retrievedContext: schemaContext || undefined,
      generatedSql,
      wasSuccessful: false,
      latencyMs: Date.now() - startTime,
      failureReason,
    });

    return NextResponse.json({
      error: message,
      timestamp: new Date().toISOString(),
      historyId,
    }, { status: statusCode });
  }
}
