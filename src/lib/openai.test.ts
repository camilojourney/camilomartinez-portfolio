import { describe, expect, it } from 'vitest';

import { resolveChatProvider } from './openai';

describe('resolveChatProvider', () => {
  it('prefers the legacy OpenAI-compatible proxy when configured', () => {
    expect(resolveChatProvider({
      AI_PROXY_API_KEY: ' proxy-key ',
      AI_PROXY_BASE_URL: ' https://proxy.example/v1 ',
      AI_CHAT_MODEL: ' proxy-model ',
      GROQ_API_KEY: 'groq-key',
      OPENAI_API_KEY: 'openai-key',
    })).toEqual({
      provider: 'proxy',
      apiKey: 'proxy-key',
      baseURL: 'https://proxy.example/v1',
      model: 'proxy-model',
    });
  });

  it('uses Groq with the Llama default model when GROQ_API_KEY is configured', () => {
    expect(resolveChatProvider({ GROQ_API_KEY: ' groq-key ' })).toEqual({
      provider: 'groq',
      apiKey: 'groq-key',
      baseURL: 'https://api.groq.com/openai/v1',
      model: 'llama-3.3-70b-versatile',
    });
  });

  it('allows GROQ_CHAT_MODEL to override AI_CHAT_MODEL for Groq', () => {
    expect(resolveChatProvider({
      GROQ_API_KEY: 'groq-key',
      GROQ_CHAT_MODEL: 'groq-specific-model',
      AI_CHAT_MODEL: 'shared-model',
    })?.model).toBe('groq-specific-model');
  });

  it('falls back to OpenAI when proxy and Groq credentials are absent', () => {
    expect(resolveChatProvider({ OPENAI_API_KEY: ' openai-key ' })).toEqual({
      provider: 'openai',
      apiKey: 'openai-key',
      model: 'gpt-4.1-mini',
    });
  });

  it('returns null when no provider credentials are configured', () => {
    expect(resolveChatProvider({
      AI_PROXY_API_KEY: '   ',
      GROQ_API_KEY: '',
      OPENAI_API_KEY: '   ',
    })).toBeNull();
  });
});
