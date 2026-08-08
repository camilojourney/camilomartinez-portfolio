import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { parseSseChunk, renderChatContent } from '../format';

describe('chat formatting helpers', () => {
  it('buffers split SSE frames until a complete frame arrives', () => {
    const first = parseSseChunk('', 'data: {"content":"Hel');

    expect(first.events).toEqual([]);
    expect(first.buffer).toBe('data: {"content":"Hel');

    const second = parseSseChunk(first.buffer, 'lo"}\n\ndata: [DONE]\n\n');

    expect(second.events).toEqual([{ content: 'Hello' }, { done: true }]);
    expect(second.buffer).toBe('');
  });

  it('renders markdown links without allowing injected HTML to execute', () => {
    const html = renderToStaticMarkup(
      <>{renderChatContent('Hi <img src=x onerror=alert(1)> [email](mailto:test@example.com)')}</>,
    );

    expect(html).toContain('&lt;img');
    expect(html).toContain('href="mailto:test@example.com"');
    expect(html).not.toContain('<img src=');
  });
});
