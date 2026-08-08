import { describe, expect, it } from 'vitest';

import sitemap from '../sitemap';

describe('sitemap', () => {
  it('emits only valid portfolio URLs', async () => {
    const entries = await sitemap();

    for (const entry of entries) {
      const parsed = new URL(entry.url);
      expect(parsed.origin).toBe('https://camilomartinez.co');
      expect(entry.url).not.toContain('https://camilomartinez.cohttps://');
    }
  });
});
