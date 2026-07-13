import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ChatProviderConfig } from '@/lib/openai';

const mocks = vi.hoisted(() => ({
  resolveChatProvider: vi.fn(),
  createChatClient: vi.fn(),
  completionCreate: vi.fn(),
}));

vi.mock('@/lib/openai', () => ({
  resolveChatProvider: mocks.resolveChatProvider,
  createChatClient: mocks.createChatClient,
}));

import { POST } from '../route';

async function* streamContent(parts: string[]) {
  for (const part of parts) {
    yield { choices: [{ delta: { content: part } }] };
  }
}

async function responseText(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  expect(reader).toBeDefined();

  const decoder = new TextDecoder();
  let body = '';
  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;
    body += decoder.decode(value, { stream: true });
  }
  body += decoder.decode();
  return body;
}

describe('Chat API Route', () => {
  const groqProvider: ChatProviderConfig = {
    provider: 'groq',
    apiKey: 'test-groq-key',
    baseURL: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      Response.json({ ok: true, snapshot: 'HRV 72 ms, recovery 88%' }),
    ));
    mocks.resolveChatProvider.mockReturnValue(groqProvider);
    mocks.completionCreate.mockResolvedValue(streamContent(['Hello ', 'from Groq']));
    mocks.createChatClient.mockReturnValue({
      chat: { completions: { create: mocks.completionCreate } },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('streams chat responses through the configured OpenAI-compatible provider', async () => {
    const response = await POST(new Request('http://localhost:3005/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', host: 'localhost:3005' },
      body: JSON.stringify({
        message: 'What is Camilo building?',
        conversationHistory: [{ role: 'assistant', content: 'He builds applied AI systems.' }],
      }),
    }));

    await expect(responseText(response)).resolves.toBe([
      'data: {"content":"Hello "}',
      '',
      'data: {"content":"from Groq"}',
      '',
      'data: [DONE]',
      '',
      '',
    ].join('\n'));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/event-stream');
    expect(mocks.createChatClient).toHaveBeenCalledWith(groqProvider);
    expect(mocks.completionCreate).toHaveBeenCalledWith(expect.objectContaining({
      model: 'llama-3.3-70b-versatile',
      stream: true,
      messages: expect.arrayContaining([
        expect.objectContaining({ role: 'assistant', content: 'He builds applied AI systems.' }),
        expect.objectContaining({ role: 'user', content: 'What is Camilo building?' }),
      ]),
    }));
  });

  it('returns a configuration error before creating a client when no chat provider is configured', async () => {
    mocks.resolveChatProvider.mockReturnValue(null);

    const response = await POST(new Request('http://localhost:3005/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' }),
    }));

    await expect(response.json()).resolves.toEqual({ error: 'API key not configured' });
    expect(response.status).toBe(500);
    expect(mocks.createChatClient).not.toHaveBeenCalled();
    expect(mocks.completionCreate).not.toHaveBeenCalled();
  });
});
