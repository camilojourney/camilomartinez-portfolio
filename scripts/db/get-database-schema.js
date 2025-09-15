// 📂 scripts/db/get-database-schema.js
/**
 * Extract complete database schema for embedding creation
 */

import { sql } from '../../src/lib/db/db.ts';

async function getDatabaseSchema() {
    try {
        console.log('🔍 Extracting complete database schema...\n');

        // Get all tables
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `;

        const schema = {
            database: 'neondb',
            tables: {}
        };

        for (const table of tables) {
            const tableName = table.table_name;
            console.log(`📋 Analyzing table: ${tableName}`);

            // Get columns with detailed info
            const columns = await sql`
                SELECT 
                    column_name,
                    data_type,
                    is_nullable,
                    column_default,
                    character_maximum_length,
                    numeric_precision,
                    numeric_scale
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = ${tableName}
                ORDER BY ordinal_position
            `;

            // Get constraints
            const constraints = await sql`
                SELECT 
                    tc.constraint_name,
                    tc.constraint_type,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints tc
                LEFT JOIN information_schema.key_column_usage kcu
                    ON tc.constraint_name = kcu.constraint_name
                LEFT JOIN information_schema.constraint_column_usage ccu
                    ON tc.constraint_name = ccu.constraint_name
                WHERE tc.table_schema = 'public'
                AND tc.table_name = ${tableName}
            `;

            // Get indexes
            const indexes = await sql`
                SELECT 
                    i.relname AS index_name,
                    a.attname AS column_name,
                    ix.indisunique,
                    ix.indisprimary
                FROM pg_class t
                JOIN pg_index ix ON t.oid = ix.indrelid
                JOIN pg_class i ON i.oid = ix.indexrelid
                JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
                WHERE t.relname = ${tableName}
                AND t.relkind = 'r'
                ORDER BY i.relname, a.attname
            `;

            schema.tables[tableName] = {
                columns: columns.map(col => ({
                    name: col.column_name,
                    type: col.data_type,
                    nullable: col.is_nullable === 'YES',
                    default: col.column_default,
                    maxLength: col.character_maximum_length,
                    precision: col.numeric_precision,
                    scale: col.numeric_scale
                })),
                constraints: constraints.map(cons => ({
                    name: cons.constraint_name,
                    type: cons.constraint_type,
                    column: cons.column_name,
                    foreignTable: cons.foreign_table_name,
                    foreignColumn: cons.foreign_column_name
                })),
                indexes: indexes.map(idx => ({
                    name: idx.index_name,
                    column: idx.column_name,
                    unique: idx.indisunique,
                    primary: idx.indisprimary
                }))
            };
        }

        // Get table relationships
        const relationships = await sql`
            SELECT 
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                tc.constraint_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
        `;

        schema.relationships = relationships;

        // Output formatted schema
        console.log('\n📊 COMPLETE DATABASE SCHEMA:\n');
        console.log(JSON.stringify(schema, null, 2));

        // Also create a simplified text version for embeddings
        let textSchema = `Database Schema for ${schema.database}\n\n`;
        
        for (const [tableName, tableInfo] of Object.entries(schema.tables)) {
            textSchema += `Table: ${tableName}\n`;
            textSchema += `Columns:\n`;
            
            tableInfo.columns.forEach(col => {
                textSchema += `  - ${col.name}: ${col.type}`;
                if (!col.nullable) textSchema += ' NOT NULL';
                if (col.default) textSchema += ` DEFAULT ${col.default}`;
                textSchema += '\n';
            });

            if (tableInfo.constraints.length > 0) {
                textSchema += `Constraints:\n`;
                tableInfo.constraints.forEach(cons => {
                    textSchema += `  - ${cons.type}: ${cons.name} on ${cons.column}`;
                    if (cons.foreignTable) {
                        textSchema += ` -> ${cons.foreignTable}.${cons.foreignColumn}`;
                    }
                    textSchema += '\n';
                });
            }

            textSchema += '\n';
        }

        if (schema.relationships.length > 0) {
            textSchema += 'Relationships:\n';
            schema.relationships.forEach(rel => {
                textSchema += `  ${rel.table_name}.${rel.column_name} -> ${rel.foreign_table_name}.${rel.foreign_column_name}\n`;
            });
        }

        console.log('\n📝 TEXT VERSION FOR EMBEDDINGS:\n');
        console.log(textSchema);

        return { schema, textSchema };

    } catch (error) {
        console.error('❌ Error extracting schema:', error);
        throw error;
    }
}

// Run the schema extraction
getDatabaseSchema()
    .then(() => {
        console.log('\n✅ Schema extraction complete!');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Schema extraction failed:', error);
        process.exit(1);
    });
