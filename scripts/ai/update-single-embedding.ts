import { OpenAI } from 'openai';
import pg from 'pg';
import * as dotenv from 'dotenv';
// Import schema descriptions directly to avoid module issues
const schemaDescriptions = [
  {
    type: 'column', 
    view: 'daily_fitness_snapshot', 
    name: 'snapshot_date', 
    description: "Type: DATE (YYYY-MM-DD). The calendar date for this daily snapshot. CRITICAL: Use this column for ALL date filtering, sorting by recent/latest, time-based queries, ordering by date, finding data from specific days, weeks, months. Essential for temporal analysis, trend identification, and chronological ordering. Keywords: date, time, recent, latest, chronological, daily, when, day, week, month, yesterday, today, last week."
  }
  // Add other descriptions as needed
];

// Load environment variables
dotenv.config();

const { Pool } = pg;
const openai = new OpenAI();
const pool = new Pool({ 
  connectionString: process.env.POSTGRES_URL_NON_POOLING,
  ssl: {
    rejectUnauthorized: true
  }
});

/**
 * Update a single embedding efficiently without regenerating all embeddings
 * @param viewName - The view name (e.g., 'daily_fitness_snapshot')
 * @param columnName - The column name (e.g., 'snapshot_date')
 */
async function updateSingleEmbedding(viewName: string, columnName: string) {
  const client = await pool.connect();
  try {
    console.log(`🔄 Updating embedding: ${viewName}.${columnName}`);
    
    // Find the item in our schema descriptions
    const item = schemaDescriptions.find(desc => 
      (desc.type === 'view' && desc.name === columnName && desc.name === viewName) ||
      (desc.type === 'column' && desc.view === viewName && desc.name === columnName)
    );
    
    if (!item) {
      throw new Error(`❌ Schema description not found for ${viewName}.${columnName}`);
    }
    
    // Generate the embedding
    const inputText = item.type === 'view'
      ? `View: ${item.name}. Description: ${item.description}`
      : `View: ${item.view}, Column: ${item.name}. Description: ${item.description}`;

    console.log(`📝 Description: ${item.description.substring(0, 100)}...`);

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: inputText,
    });

    const vector = embeddingResponse.data[0].embedding;
    console.log(`🧮 Generated embedding with ${vector.length} dimensions`);

    // Delete existing entry and insert new one (simpler than upsert)
    await client.query(
      'DELETE FROM schema_embeddings WHERE view_name = $1 AND column_name = $2',
      [item.view || item.name, item.name]
    );

    await client.query(
      'INSERT INTO schema_embeddings (view_name, column_name, description, embedding) VALUES ($1, $2, $3, $4)',
      [item.view || item.name, item.name, item.description, `[${vector.join(',')}]`]
    );
    
    console.log(`✅ Successfully updated embedding for ${viewName}.${columnName}`);
    
  } catch (error) {
    console.error(`❌ Error updating embedding for ${viewName}.${columnName}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

// Command line usage
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.log(`
Usage: npx tsx scripts/ai/update-single-embedding.ts <view_name> <column_name>

Examples:
  npx tsx scripts/ai/update-single-embedding.ts daily_fitness_snapshot snapshot_date
  npx tsx scripts/ai/update-single-embedding.ts run_performance_details whoop_strain
    `);
    process.exit(1);
  }

  const [viewName, columnName] = args;
  
  try {
    await updateSingleEmbedding(viewName, columnName);
    console.log(`🎉 Done! Updated embedding for ${viewName}.${columnName}`);
  } catch (error) {
    console.error('💥 Failed to update embedding:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Export function for programmatic use
export { updateSingleEmbedding };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}