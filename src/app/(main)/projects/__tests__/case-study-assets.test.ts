import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('project case study assets', () => {
  it('references existing public hero images', () => {
    const source = readFileSync('src/app/(main)/projects/[slug]/page.tsx', 'utf8');
    const imagePaths = Array.from(source.matchAll(/imageUrl: '([^']+)'/g))
      .map((match) => match[1])
      .filter((imagePath): imagePath is string => typeof imagePath === 'string');

    expect(imagePaths.length).toBeGreaterThan(0);
    for (const imagePath of imagePaths) {
      expect(imagePath).toBeDefined();
      expect(existsSync(join(process.cwd(), 'public', imagePath))).toBe(true);
    }
  });
});
