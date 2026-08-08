import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

let stateCall = 0;

/* eslint-disable @next/next/no-img-element */
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');

  return {
    ...actual,
    useState<T>(initial: T) {
      stateCall += 1;

      if (stateCall === 1 && initial === false) {
        return [true, vi.fn()] as const;
      }

      if (
        stateCall === 3
        && Array.isArray(initial)
        && initial.length === 1
        && typeof initial[0] === 'object'
      ) {
        return [[{ role: 'assistant', content: '- First line\n- Second line' }], vi.fn()] as const;
      }

      return actual.useState(initial);
    },
  };
});

vi.mock('next/image', () => ({
  default: ({ alt, src, ...rest }: { alt: string; src: string }) => (
    <img alt={alt} src={src} {...rest} />
  ),
}));

import ChatWidget from '../ChatWidget';

describe('ChatWidget', () => {
  it('wraps bullet rendering in block markup', () => {
    stateCall = 0;
    const html = renderToStaticMarkup(<ChatWidget />);

    expect(html).toMatch(/data-chat-message-role="assistant"[^>]*><div><div class="my-0\.5 flex gap-1\.5"/);
    expect(html).not.toMatch(/data-chat-message-role="assistant"[^>]*><span><div class="my-0\.5 flex gap-1\.5"/);
  });
});
