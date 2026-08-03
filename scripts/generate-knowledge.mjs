import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const knowledgeFiles = [
  'bio.md',
  'skills.md',
  'projects.md',
  'values.md',
  'faq.md',
  'fitness.md',
];

const body = knowledgeFiles
  .map((file) => readFileSync(join('src/data/knowledge', file), 'utf8').trim())
  .join('\n\n---\n\n');

const escaped = body.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

writeFileSync(
  'src/data/knowledge.ts',
  `// Auto-generated knowledge base. Run \`pnpm generate:knowledge\` after editing src/data/knowledge/*.md.\nexport const KNOWLEDGE_BASE = \`\n${escaped}\n\`;\n`,
);
