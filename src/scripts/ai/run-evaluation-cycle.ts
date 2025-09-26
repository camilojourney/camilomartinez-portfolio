import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import OpenAI from 'openai';
import fetch from 'node-fetch';

// Import schema descriptions for generating relevant test questions
import { schemaDescriptions } from '../../../scripts/ai/embed-schema';

const openai = new OpenAI();
const pool = new Pool({ 
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Helper function to create a simplified schema string for the prompt
function getSimpleSchemaForPrompt(): string {
  const views: { [key: string]: string[] } = {};
  
  for (const item of schemaDescriptions) {
    if (item.type === 'view') {
      if (!views[item.name]) views[item.name] = [];
    } else if (item.type === 'column' && item.view) {
      if (!views[item.view]) views[item.view] = [];
      views[item.view].push(item.name);
    }
  }
  
  return JSON.stringify(views, null, 2);
}

// Helper function to get detailed schema descriptions for context
function getDetailedSchemaContext(): string {
  return schemaDescriptions
    .map(item => {
      if (item.type === 'view') {
        return `VIEW: ${item.name}\nDescription: ${item.description}\n`;
      } else {
        return `COLUMN: ${item.view}.${item.name}\nDescription: ${item.description}\n`;
      }
    })
    .join('\n');
}

async function runEvaluationCycle() {
  console.log('🚀 Starting New AI Trainer Evaluation Cycle');
  console.log('=====================================');
  
  const client = await pool.connect();
  let cycleId: string | null = null;
  let cycleDbId: number | null = null;
  const startTime = Date.now();

  try {
    // Step 0: Ensure the evaluation_cycles table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS evaluation_cycles (
        id SERIAL PRIMARY KEY,
        start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        end_time TIMESTAMP WITH TIME ZONE,
        total_questions INTEGER,
        success_count INTEGER,
        success_rate NUMERIC(5, 2),
        failure_analysis TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create a new record for this evaluation cycle
    const cycleRes = await client.query(
      'INSERT INTO evaluation_cycles (total_questions) VALUES (0) RETURNING id'
    );
    cycleDbId = cycleRes.rows[0].id;
    
    // Generate a UUID string for the query_history table
    cycleId = `00000000-0000-0000-0000-${cycleDbId!.toString().padStart(12, '0')}`;
    console.log(`📋 Created evaluation cycle #${cycleDbId} (UUID: ${cycleId})`);

    // --- STEP 1: GENERATE QUESTIONS ---
    console.log('\n🎲 Step 1: Generating Test Questions');
    console.log('-----------------------------------');
    
    // Determine how many questions to request (default to 10 for richer coverage)
    const numQuestions = parseInt(process.env.NUM_QUESTIONS || '10', 10);
    console.log(`🎯 Generating ${numQuestions} test questions`);

    const targetViews = [
      'daily_fitness_snapshot',
      'run_performance_details',
      'boxing_performance_details',
      'weightlifting_performance_details'
    ];

    const questionCrafterPrompt = `You are a meticulous data quality analyst. Generate ${numQuestions} unique, natural-language questions to stress test a single-user fitness Text-to-SQL agent.

Every question must:
- Be phrased from Camilo's perspective ("I" / "my")
- Target ONE primary view from this list: ${targetViews.join(', ')}
- Explore a fresh metric, calculation, or comparison not covered by the other questions

Coverage constraints:
1. Include at least one question for each view (${targetViews.join(', ')}).
2. Use at least three distinct time horizons (single day, week, month, quarter, year-to-date, rolling window, etc.).
3. Include at least two comparison or trend questions (e.g., compare activities, time periods, or metrics).
4. Avoid repeating phrasing, metrics, or time windows.

Return ONLY valid JSON exactly like this:
{
  "questions": [
    {
      "question": "string",
      "primary_view": "${targetViews.join('" | "')}",
      "skills": ["aggregation" | "filter" | "time_series" | "comparison" | "edge_case" | "join"]
    }
  ]
}

Database Schema:
${getSimpleSchemaForPrompt()}

Detailed Schema Context:
${getDetailedSchemaContext()}`;

    const maxQuestionAttempts = 3;
    let questions: Array<{ question: string; primary_view?: string; skills?: string[] }> = [];

    for (let attempt = 1; attempt <= maxQuestionAttempts; attempt++) {
      console.log(`   🔁 Question generation attempt ${attempt}/${maxQuestionAttempts}`);
      const questionResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: questionCrafterPrompt }],
        response_format: { type: 'json_object' },
        temperature: 0.85
      });

      let parsed: any;
      try {
        parsed = JSON.parse(questionResponse.choices[0].message.content || '{"questions": []}');
      } catch (parseError) {
        console.warn('   ⚠️ Failed to parse question JSON, retrying...', parseError);
        continue;
      }

      const unique = new Map<string, { question: string; primary_view?: string; skills?: string[] }>();
      for (const entry of parsed.questions || []) {
        if (!entry?.question) continue;
        const text = String(entry.question).trim();
        if (!text) continue;
        const key = text.toLowerCase();
        if (!unique.has(key)) {
          unique.set(key, {
            question: text,
            primary_view: entry.primary_view ? String(entry.primary_view).trim() : undefined,
            skills: Array.isArray(entry.skills) ? entry.skills : undefined
          });
        }
      }

      const candidateQuestions = Array.from(unique.values());
      const coveredViews = new Set(
        candidateQuestions
          .map(q => (q.primary_view || '').toLowerCase())
          .filter(Boolean)
      );

      const hasAllViews = targetViews.every(view => coveredViews.has(view));
      const hasEnoughQuestions = candidateQuestions.length >= numQuestions;

      if (hasAllViews && hasEnoughQuestions) {
        questions = candidateQuestions.slice(0, numQuestions);
        break;
      }

      console.warn('   ⚠️ Question set failed diversity checks. Retrying...');
    }

    if (questions.length < numQuestions) {
      throw new Error('Question generation failed to produce a diverse set after multiple attempts.');
    }

    console.log(`✅ Generated ${questions.length} test questions with full coverage:`);
    questions.forEach((q, i) => {
      console.log(`   ${i + 1}. [${q.primary_view ?? 'unknown'}] ${q.question}`);
    });

    const questionTexts = questions.map(q => q.question);

    // Update cycle with question count
    await client.query(
      'UPDATE evaluation_cycles SET total_questions = $1 WHERE id = $2',
      [questionTexts.length, cycleDbId]
    );

    // --- STEP 2 & 3: EXECUTE & JUDGE ---
    console.log('\n⚡ Step 2 & 3: Execute Queries and Judge Results');
    console.log('-----------------------------------------------');
    
    const failures: Array<{question: string, reasoning: string, sql?: string, error?: string}> = [];
    let successCount = 0;

    for (let i = 0; i < questionTexts.length; i++) {
      const question = questionTexts[i];
      console.log(`\n🔍 Testing Question ${i + 1}/${questionTexts.length}:`);
      console.log(`   "${question}"`);
      
      try {
        // A. Execute query via your main AI agent API
        console.log('   → Executing via AI agent...');
        const baseUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}` 
          : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        
        const response = await fetch(`${baseUrl}/api/ai-query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            question,
            bypassRateLimit: true // Bypass rate limiting for AI trainer evaluations
          }),
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const queryResult = await response.json() as any;
        
        if (queryResult.error) {
          throw new Error(`AI Query Error: ${queryResult.error}`);
        }

        console.log(`   → Generated SQL: ${queryResult.explanation?.sql?.substring(0, 100)}...`);
        console.log(`   → Returned ${Array.isArray(queryResult.data) ? queryResult.data.length : 'N/A'} rows`);

        // B. Judge the result for self-consistency
        console.log('   → Judging result consistency...');
        const judgePrompt = `You are a logical reasoning evaluator. Your task is to determine if a SQL query and its result correctly answer a user's original question.

Analyze these components and respond with a JSON object containing:
{
  "is_correct": boolean,
  "reasoning": string,
  "confidence": number (0-100)
}

If incorrect, specify exactly why (e.g., "The SQL filters for the wrong time period," "Missing required JOIN," "Aggregation logic is incorrect").

Original Question: "${question}"
Generated SQL: "${queryResult.explanation?.sql || queryResult.sql || 'No SQL provided'}"
Data Result: ${JSON.stringify(queryResult.data).substring(0, 1000)}${JSON.stringify(queryResult.data).length > 1000 ? '... (truncated)' : ''}
Metadata: ${JSON.stringify(queryResult.metadata || {})}`;

        const judgeResponse = await openai.chat.completions.create({
          model: 'gpt-4-turbo',
          messages: [{ role: 'user', content: judgePrompt }],
          response_format: { type: 'json_object' },
          temperature: 0.1
        });

        const evaluation = JSON.parse(judgeResponse.choices[0].message.content || '{"is_correct": false, "reasoning": "Evaluation failed"}');
        
        // C. Log to query_history
        await client.query(`
          INSERT INTO query_history (
            user_question, 
            generated_sql, 
            was_successful, 
            details, 
            cycle_id,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())
        `, [
          question, 
          queryResult.explanation?.sql || queryResult.sql || null, 
          evaluation.is_correct, 
          JSON.stringify({
            reasoning: evaluation.reasoning,
            confidence: evaluation.confidence,
            data_row_count: Array.isArray(queryResult.data) ? queryResult.data.length : null,
            execution_time_ms: queryResult.metadata?.latencyMs
          }), 
          cycleId
        ]);

        if (evaluation.is_correct) {
          successCount++;
          console.log(`   ✅ PASSED - ${evaluation.reasoning}`);
        } else {
          failures.push({
            question,
            reasoning: evaluation.reasoning,
            sql: queryResult.explanation?.sql || queryResult.sql
          });
          console.log(`   ❌ FAILED - ${evaluation.reasoning}`);
        }

      } catch (err: any) {
        const errorMsg = `Execution/Judging Error: ${err.message}`;
        failures.push({
          question,
      reasoning: errorMsg,
          error: err.message
        });
        
        // Still log the failure
        await client.query(`
          INSERT INTO query_history (
            user_question, 
            generated_sql, 
            was_successful, 
            details, 
            cycle_id,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())
        `, [question, null, false, JSON.stringify({ error: err.message }), cycleId]);

        console.log(`   💥 ERROR - ${errorMsg}`);
      }
    }

    // --- STEP 4: ANALYZE & REPORT ---
    console.log('\n📊 Step 4: Analyzing Results and Generating Report');
    console.log('--------------------------------------------------');
    
    const successRate = (successCount / questionTexts.length) * 100;
    console.log(`📈 Overall Success Rate: ${successRate.toFixed(2)}% (${successCount}/${questionTexts.length})`);
    
    let analysisReport = `Evaluation cycle completed successfully with ${successRate.toFixed(2)}% accuracy (${successCount}/${questionTexts.length} questions passed).`;
    
    if (failures.length > 0) {
      console.log(`\n🔍 Analyzing ${failures.length} failures...`);
      
      const consultantPrompt = `You are an expert AI engineering consultant reviewing the performance of a Text-to-SQL agent for a fitness tracking application.

Here are the failed queries from the latest evaluation cycle:

${JSON.stringify(failures, null, 2)}

Please provide a comprehensive analysis in the following format:

## Evaluation Summary
- Overall performance assessment
- Success rate: ${successRate.toFixed(2)}% (${successCount}/${questionTexts.length})

## Failure Pattern Analysis
Identify the top 2-3 recurring patterns of failure. For each pattern:
- What type of queries are failing?
- What is the root cause?
- How many failures fall into this pattern?

## Actionable Recommendations
Provide specific, implementable recommendations to fix these patterns:
1. **Schema Description Updates**: Suggest specific changes to column/view descriptions in the schema embeddings
2. **System Prompt Improvements**: Recommend enhancements to the AI agent's system prompt
3. **Query Validation**: Suggest additional safety checks or validation rules
4. **Test Coverage**: Recommend new types of test questions to prevent regressions

## Priority Actions
List the top 3 most impactful changes to implement first.

Focus on concrete, actionable improvements that will directly increase the success rate.`;

      const consultantResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: consultantPrompt }],
        temperature: 0.3
      });
      
      analysisReport = consultantResponse.choices[0].message.content || "Analysis could not be generated.";
    } else {
      analysisReport += "\n\n🎉 Perfect score! All test questions passed successfully. The AI agent is performing excellently on the current test suite. Consider expanding the test coverage or increasing question complexity to continue pushing the boundaries of performance.";
    }
    
    // Update the cycle log with the final report
    const endTime = Date.now();
    const durationSec = Math.round((endTime - startTime) / 1000);
    
    await client.query(`
      UPDATE evaluation_cycles 
      SET 
        end_time = NOW(), 
        success_count = $1, 
        success_rate = $2, 
        failure_analysis = $3 
      WHERE id = $4
    `, [successCount, successRate.toFixed(2), analysisReport, cycleDbId]);
     
    console.log(`\n🎯 Cycle ${cycleId} Complete!`);
    console.log(`⏱️  Duration: ${durationSec} seconds`);
    console.log(`📊 Success Rate: ${successRate.toFixed(2)}%`);
    console.log(`\n📋 AI Consultant Analysis:`);
    console.log('========================');
    console.log(analysisReport);

    return {
      cycleId,
      successRate,
      totalQuestions: questionTexts.length,
      successCount,
      failures: failures.length,
      durationSec,
      analysis: analysisReport
    };

  } catch (error: any) {
    console.error('💥 A fatal error occurred during the evaluation cycle:', error);
    
    if (cycleDbId) {
      await client.query(`
        UPDATE evaluation_cycles 
        SET 
          failure_analysis = $1, 
          end_time = NOW() 
        WHERE id = $2
      `, [`A fatal error occurred: ${error.message}`, cycleDbId]);
    }
    
    throw error;
  } finally {
    client.release();
  }
}

// Run the evaluation cycle
if (require.main === module) {
  runEvaluationCycle()
    .then((result) => {
      console.log('\n✅ Evaluation cycle finished successfully!');
      console.log('Results:', JSON.stringify(result, null, 2));
      pool.end();
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Evaluation cycle failed:', error);
      pool.end();
      process.exit(1);
    });
}

export { runEvaluationCycle };
