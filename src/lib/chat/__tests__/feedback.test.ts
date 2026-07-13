import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import {
  evaluateAnswer,
  generateSessionId,
  logConversation,
  submitFeedback,
  type ConversationLog,
  type FeedbackData,
} from '../feedback';

describe('chat feedback helpers', () => {
  const fetchMock = vi.fn<typeof fetch>();
  let consoleErrorSpy: MockInstance<typeof console.error>;

  const conversationLog: ConversationLog = {
    id: 'conversation-1',
    messages: [
      {
        role: 'user',
        content: 'What does Camilo build?',
        timestamp: '2026-07-12T12:00:00.000Z',
      },
      {
        role: 'assistant',
        content: 'AI products and analytics systems.',
        timestamp: '2026-07-12T12:00:01.000Z',
      },
    ],
    metadata: {
      sessionId: 'session_1783872000000_testabc12',
      userAgent: 'vitest',
      createdAt: '2026-07-12T12:00:00.000Z',
      responseTime: 500,
    },
  };

  const feedback: FeedbackData = {
    conversationId: 'conversation-1',
    messageIndex: 1,
    rating: 'positive',
    comment: 'Clear and concise',
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('POSTs full conversation logs to the chat log endpoint', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true })));

    await expect(logConversation(conversationLog)).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith('/api/chat/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(conversationLog),
    });
  });

  it('does not reject when conversation logging fails', async () => {
    const networkError = new Error('network down');
    fetchMock.mockRejectedValue(networkError);

    await expect(logConversation(conversationLog)).resolves.toBeUndefined();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to log conversation:',
      networkError
    );
  });

  it('POSTs user feedback to the feedback endpoint', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true })));

    await expect(submitFeedback(feedback)).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith('/api/chat/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback),
    });
  });

  it('does not reject when feedback submission fails', async () => {
    const networkError = new Error('write failed');
    fetchMock.mockRejectedValue(networkError);

    await expect(submitFeedback(feedback)).resolves.toBeUndefined();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to submit feedback:',
      networkError
    );
  });

  it('returns the evaluation response when answer evaluation succeeds', async () => {
    const evaluation = {
      score: 0.82,
      reasoning: 'Relevant and concise',
      suggestions: ['Add a project link'],
    };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(evaluation)));

    await expect(
      evaluateAnswer('What can he build?', 'AI products', 'Portfolio context')
    ).resolves.toEqual(evaluation);

    expect(fetchMock).toHaveBeenCalledWith('/api/chat/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'What can he build?',
        answer: 'AI products',
        context: 'Portfolio context',
      }),
    });
  });

  it('returns a neutral fallback when answer evaluation fails', async () => {
    fetchMock.mockResolvedValue(new Response('unavailable', { status: 503 }));

    await expect(
      evaluateAnswer('What can he build?', 'AI products', 'Portfolio context')
    ).resolves.toEqual({
      score: 0.5,
      reasoning: 'Evaluation unavailable',
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to evaluate answer:',
      expect.any(Error)
    );
  });

  it('generates session IDs with the stable prefix, timestamp, and entropy segment', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1783872000000);
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);

    const sessionId = generateSessionId();

    expect(sessionId).toBe('session_1783872000000_4fzzzxjyl');
    expect(sessionId).toMatch(/^session_\d{13}_[a-z0-9]{9}$/);
  });
});
