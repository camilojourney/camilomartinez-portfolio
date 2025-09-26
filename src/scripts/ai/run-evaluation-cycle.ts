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
    
    // Get number of questions from environment variable (default to 5)
    const numQuestions = parseInt(process.env.NUM_QUESTIONS || '5');
    console.log(`🎯 Generating ${numQuestions} test questions`);
    
    const questionCrafterPrompt = `You are a meticulous data quality analyst. Your task is to generate ${numQuestions} diverse, realistic questions to test a Text-to-SQL AI agent for a fitness tracking application.

Based on the following database schema, create a JSON object with a key "questions" which is an array of question strings.

The questions should cover a good mix of:
1. Simple lookups and filters
2. Aggregations and grouping
3. Time-based queries and trends
4. Complex joins across views (if space allows)
5. Edge cases and comparative analysis (if space allows)

Make the questions sound natural, like a user would actually ask them. Focus on fitness, recovery, performance, and health metrics.

Database Schema:
${getSimpleSchemaForPrompt()}

Detailed Schema Context:
${getDetailedSchemaContext()}

Return ONLY a JSON object with this structure:
{"questions": ["question1", "question2", ...]}`;
    
    const questionResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [{ role: 'user', content: questionCrafterPrompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7
    });

    const questionData = JSON.parse(questionResponse.choices[0].message.content || '{"questions": []}');
    const questions = questionData.questions || [];
    
    console.log(`✅ Generated ${questions.length} test questions:`);
    questions.forEach((q: string, i: number) => {
      console.log(`   ${i + 1}. ${q}`);
    });

    if (questions.length === 0) {
      throw new Error("Question generation failed - no questions created");
    }

    // Update cycle with question count
    await client.query(
      'UPDATE evaluation_cycles SET total_questions = $1 WHERE id = $2',
      [questions.length, cycleDbId]
    );

    // --- STEP 2 & 3: EXECUTE & JUDGE ---
    console.log('\n⚡ Step 2 & 3: Execute Queries and Judge Results');
    console.log('-----------------------------------------------');
    
    const failures: Array<{question: string, reasoning: string, sql?: string, error?: string}> = [];
    let successCount = 0;

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      console.log(`\n🔍 Testing Question ${i + 1}/${questions.length}:`);
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
          body: JSON.stringify({ question }),
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
    
    const successRate = (successCount / questions.length) * 100;
    console.log(`📈 Overall Success Rate: ${successRate.toFixed(2)}% (${successCount}/${questions.length})`);
    
    let analysisReport = `Evaluation cycle completed successfully with ${successRate.toFixed(2)}% accuracy (${successCount}/${questions.length} questions passed).`;
    
    if (failures.length > 0) {
      console.log(`\n🔍 Analyzing ${failures.length} failures...`);
      
      const consultantPrompt = `You are an expert AI engineering consultant reviewing the performance of a Text-to-SQL agent for a fitness tracking application.

Here are the failed queries from the latest evaluation cycle:

${JSON.stringify(failures, null, 2)}

Please provide a comprehensive analysis in the following format:

## Evaluation Summary
- Overall performance assessment
- Success rate: ${successRate.toFixed(2)}% (${successCount}/${questions.length})

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
      totalQuestions: questions.length,
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