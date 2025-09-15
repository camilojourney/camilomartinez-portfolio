// 📂 scripts/db/check-vector-support.js
/**
 * Check if the database supports vector operations (pgvector extension)
 */

import { sql } from '../../src/lib/db/db.ts';

async function checkVectorSupport() {
  try {
    console.log('🔍 Checking database vector support...');
    
    // Check if pgvector extension is available
    const extensionCheck = await sql`
      SELECT * FROM pg_available_extensions 
      WHERE name = 'vector'
    `;
    
    console.log('📦 Available pgvector extension:', extensionCheck);
    
    // Check if pgvector extension is installed
    const installedCheck = await sql`
      SELECT * FROM pg_extension 
      WHERE extname = 'vector'
    `;
    
    console.log('✅ Installed pgvector extension:', installedCheck);
    
    if (installedCheck.length > 0) {
      console.log('🎉 Vector support is ENABLED!');
      
      // Test vector operations
      console.log('\n🧪 Testing vector operations...');
      
      const vectorTest = await sql`
        SELECT '[1,2,3]'::vector(3) as test_vector,
               '[1,2,3]'::vector(3) <-> '[3,2,1]'::vector(3) as distance
      `;
      
      console.log('Vector test result:', vectorTest);
      
    } else {
      console.log('❌ Vector support is NOT enabled');
      console.log('💡 To enable: CREATE EXTENSION vector;');
    }
    
  } catch (error) {
    console.error('❌ Error checking vector support:', error.message);
    
    if (error.message.includes('vector')) {
      console.log('💡 Vector extension might not be available in this database');
    }
  }
}

checkVectorSupport();
