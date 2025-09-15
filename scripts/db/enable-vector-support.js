// 📂 scripts/db/enable-vector-support.js
/**
 * Enable pgvector extension in the database
 */

import { sql } from '../../src/lib/db/db.ts';

async function enableVectorSupport() {
  try {
    console.log('🚀 Enabling pgvector extension...');
    
    // Enable the vector extension
    await sql`CREATE EXTENSION IF NOT EXISTS vector`;
    
    console.log('✅ pgvector extension enabled successfully!');
    
    // Test vector operations
    console.log('\n🧪 Testing vector operations...');
    
    const vectorTest = await sql`
      SELECT '[1,2,3]'::vector(3) as test_vector,
             '[1,2,3]'::vector(3) <-> '[3,2,1]'::vector(3) as distance,
             '[1,2,3]'::vector(3) <#> '[3,2,1]'::vector(3) as inner_product
    `;
    
    console.log('🎉 Vector operations working!');
    console.log('Test vector:', vectorTest[0].test_vector);
    console.log('Euclidean distance:', vectorTest[0].distance);
    console.log('Inner product:', vectorTest[0].inner_product);
    
    // Show available vector operators
    console.log('\n📚 Available vector operators:');
    console.log('- <-> : Euclidean distance');
    console.log('- <#> : Inner product (dot product)');
    console.log('- <=> : Cosine distance');
    
  } catch (error) {
    console.error('❌ Error enabling vector support:', error.message);
  }
}

enableVectorSupport();
