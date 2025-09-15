// 📂 scripts/db/fix-column-naming.js
/**
 * Fix column naming inconsistency: rename activity_v1_id to v1_id in whoop_sleep table
 */

import { sql } from '../../src/lib/db/db.ts';

async function fixTableColumn(tableName) {
  console.log(`\n🔧 Processing ${tableName} table...`);

  const oldColumnCheck = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = ${tableName}
      AND column_name = 'activity_v1_id'
  `;

  if (oldColumnCheck.rows.length === 0) {
    console.log('✅ No activity_v1_id column found - already migrated or using correct schema');
    return;
  }

  console.log('📋 Found activity_v1_id column');

  const newColumnCheck = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = ${tableName}
      AND column_name = 'v1_id'
  `;

  if (newColumnCheck.rows.length === 0) {
    console.log('➕ Adding v1_id column...');
    if (tableName === 'whoop_sleep') {
      await sql`ALTER TABLE whoop_sleep ADD COLUMN v1_id BIGINT`;
    } else if (tableName === 'whoop_workouts') {
      await sql`ALTER TABLE whoop_workouts ADD COLUMN v1_id BIGINT`;
    }
  }

  console.log('📋 Copying data from activity_v1_id to v1_id...');
  if (tableName === 'whoop_sleep') {
    await sql`UPDATE whoop_sleep SET v1_id = activity_v1_id WHERE activity_v1_id IS NOT NULL`;
  } else if (tableName === 'whoop_workouts') {
    await sql`UPDATE whoop_workouts SET v1_id = activity_v1_id WHERE activity_v1_id IS NOT NULL`;
  }

  console.log('🗑️ Dropping old activity_v1_id column...');
  if (tableName === 'whoop_sleep') {
    await sql`ALTER TABLE whoop_sleep DROP COLUMN activity_v1_id`;
  } else if (tableName === 'whoop_workouts') {
    await sql`ALTER TABLE whoop_workouts DROP COLUMN activity_v1_id`;
  }

  console.log('📊 Creating index on v1_id...');
  if (tableName === 'whoop_sleep') {
    await sql`CREATE INDEX IF NOT EXISTS idx_whoop_sleep_v1_id ON whoop_sleep(v1_id)`;
  } else if (tableName === 'whoop_workouts') {
    await sql`CREATE INDEX IF NOT EXISTS idx_whoop_workouts_v1_id ON whoop_workouts(v1_id)`;
  }

  console.log('✅ Column naming fixed successfully!');

  const finalColumns = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = ${tableName}
      AND column_name IN ('v1_id', 'activity_v1_id')
    ORDER BY column_name
  `;

  console.log('📊 Final column state:');
  finalColumns.rows.forEach(col => {
    console.log(`  ✅ ${col.column_name}`);
  });
}

async function fixColumnNaming() {
  try {
    console.log('🔧 Fixing column naming inconsistencies...');
    await fixTableColumn('whoop_sleep');
    await fixTableColumn('whoop_workouts');
  } catch (error) {
    console.error('❌ Error fixing column naming:', error.message);
    throw error;
  }
}

fixColumnNaming()
  .then(() => {
    console.log('\n✅ Column naming fix complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Column naming fix failed:', error);
    process.exit(1);
  });
