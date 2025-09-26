// 📂 scripts/db/run-migration.js
// Simple script to run an SQL migration file using Node

const fs = require('fs');
const postgres = require('@vercel/postgres');
require('dotenv').config({ path: '.env' });

function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inLineComment = false;
  let inBlockComment = false;
  let dollarTag = null;

  for (let i = 0; i < sql.length; i += 1) {
    const char = sql[i];
    const next = sql[i + 1];

    if (inLineComment) {
      current += char;
      if (char === '\n') {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      current += char;
      if (char === '*' && next === '/') {
        current += next;
        i += 1;
        inBlockComment = false;
      }
      continue;
    }

    if (dollarTag) {
      if (char === '$' && sql.slice(i, i + dollarTag.length) === dollarTag) {
        current += dollarTag;
        i += dollarTag.length - 1;
        dollarTag = null;
      } else {
        current += char;
      }
      continue;
    }

    if (inSingleQuote) {
      current += char;
      if (char === '\\' && next) {
        current += next;
        i += 1;
      } else if (char === '\'') {
        inSingleQuote = false;
      }
      continue;
    }

    if (inDoubleQuote) {
      current += char;
      if (char === '\\' && next) {
        current += next;
        i += 1;
      } else if (char === '"') {
        inDoubleQuote = false;
      }
      continue;
    }

    if (char === '-' && next === '-') {
      current += char + next;
      i += 1;
      inLineComment = true;
      continue;
    }

    if (char === '/' && next === '*') {
      current += char + next;
      i += 1;
      inBlockComment = true;
      continue;
    }

    if (char === '$') {
      const match = sql.slice(i).match(/^\$[a-zA-Z0-9_]*\$/);
      if (match) {
        dollarTag = match[0];
        current += dollarTag;
        i += dollarTag.length - 1;
        continue;
      }
    }

    if (char === '\'') {
      current += char;
      inSingleQuote = true;
      continue;
    }

    if (char === '"') {
      current += char;
      inDoubleQuote = true;
      continue;
    }

    if (char === ';') {
      if (current.trim().length > 0) {
        statements.push(current.trim());
      }
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim().length > 0) {
    statements.push(current.trim());
  }

  return statements;
}

async function runMigration(filePath) {
  console.log(`🔄 Running migration: ${filePath}`);

  const rawSql = fs.readFileSync(filePath, 'utf8');
  const statements = splitSqlStatements(rawSql.replace(/\r\n/g, '\n'));

  const { sql: db } = postgres;

  try {
    await db`BEGIN`;

    console.log('💾 Executing SQL...');
    for (const statement of statements) {
      await db.query(statement);
      console.log('  ✓ Executed statement');
    }

    await db`COMMIT`;
    console.log('✅ Migration applied successfully!');
  } catch (error) {
    await db`ROLLBACK`;
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

const filePath = process.argv[2];
if (!filePath) {
  console.error('❌ Please provide a migration file path');
  console.log('Usage: node scripts/db/run-migration.js migrations/your-migration.sql');
  process.exit(1);
}

runMigration(filePath).catch(console.error);
