import { KNOWLEDGE_BASE } from '@/data/knowledge';
import { HOLUS_OBSERVATORY_DESTINATION_DECISION } from '@/data/project-destinations';
import { RECRUITER_FACTS } from '@/data/recruiter';
import { createChatClient, resolveChatProvider } from '@/lib/openai';
import { CHAT_FALLBACK_MESSAGE } from '@/lib/chat/format';
import type OpenAI from 'openai';

type AllowedRole = 'user' | 'assistant';

interface SanitizedChatRequest {
  message: string;
  conversationHistory: Array<{ role: AllowedRole; content: string }>;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const MESSAGE_MAX_CHARS = 2_000;
const HISTORY_MAX_MESSAGES = 10;
const CHAT_TIMEOUT_MS = 20_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 12;
const RATE_LIMIT_MAX_KEYS = 500;
const TRANSIENT_ERROR_CODES = new Set(['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'UND_ERR_CONNECT_TIMEOUT']);

const rateLimitStore = new Map<string, RateLimitEntry>();

const RECRUITER_EMAIL_LINK =
  `[${RECRUITER_FACTS.email}](mailto:${RECRUITER_FACTS.email})`;

const HOLUS_OBSERVATORY_LINK_GUIDANCE = HOLUS_OBSERVATORY_DESTINATION_DECISION.canonicalHref
  ? `Holus Observatory → [live app](${HOLUS_OBSERVATORY_DESTINATION_DECISION.canonicalHref})`
  : `Holus Observatory has no confirmed canonical destination; do not provide a live app link. ${HOLUS_OBSERVATORY_DESTINATION_DECISION.recommendation}`;

const SYSTEM_PROMPT = [
  'You are a sharp assistant on Juan Camilo Martinez\'s portfolio. Answer like a human, not a brochure.',
  '',
  'CURRENT RECRUITER FACTS - these are authoritative over the knowledge base if there is a conflict:',
  `- Availability: Camilo is open to ${RECRUITER_FACTS.targetRoles} in ${RECRUITER_FACTS.location}, including ${RECRUITER_FACTS.workModes}.`,
  `- Contact: ${RECRUITER_EMAIL_LINK}`,
  '',
  'RULES - follow strictly:',
  '1. MAX 2 sentences for any single-topic answer. No exceptions.',
  '2. Lists (projects, skills, etc.) → bullets only, one line each. No intro sentence before the list.',
  '3. Never explain what something is unless asked. Just state the fact.',
  '4. No filler: no "Want to learn more?", no "Feel free to ask", no "Visit the contact page" unless it is the ONLY relevant answer.',
  '5. Never mention age. Never say "I am not familiar."',
  '6. Include links inline when relevant:',
  `   - ${HOLUS_OBSERVATORY_LINK_GUIDANCE}`,
  '   - Holus content engine → [social media app](https://public-phi-rouge-11.vercel.app)',
  '   - Pilaster → [pilaster.ai](https://pilaster.ai)',
  '   - Genpeli → [editai.ai](https://www.editai.ai)',
  '   - Invoz → [invoz.io](https://invoz.io)',
  '   - Job Tracker → [job-tracker](https://job-tracker-swart-eta.vercel.app)',
  '   - AI Advisor Board → [ai-advisor-board.vercel.app](https://ai-advisor-board.vercel.app)',
  '   - Holusight has no working live app URL right now; describe it without a link.',
  `   - Contact / email → ${RECRUITER_EMAIL_LINK}`,
  '   - Portfolio → [camilomartinez.co](https://camilomartinez.co)',
  '',
  'BAD: "Pilaster is an AI content versioning system that Camilo is working on. It is a creative studio..."',
  'GOOD: "AI content versioning system with RAG and version control. [pilaster.ai](https://pilaster.ai)"',
  '',
  'BAD: "You can contact Camilo through the contact page."',
  `GOOD: "Reach him at ${RECRUITER_EMAIL_LINK}"`,
  '',
  'If asked about fitness numbers → share the LIVE DATA below, then link to [Fitness Dashboard](/apps/fitness-dashboard) for full charts.',
  '',
  'KNOWLEDGE BASE:',
  KNOWLEDGE_BASE,
].join('\n');

async function getLiveContext(baseUrl: string, signal?: AbortSignal): Promise<string> {
  try {
    const res = await fetch(`${baseUrl}/api/chatbot/context`, {
      next: { revalidate: 300 },
      ...(signal ? { signal } : {}),
    });
    const data = await res.json() as { ok: boolean; snapshot: string };
    if (data.ok && data.snapshot) return `\n\nLIVE FITNESS DATA (as of now):\n${data.snapshot}`;
  } catch { /* silently fail - chatbot still works without live data */ }
  return '';
}

function jsonResponse(body: unknown, status: number, headers?: HeadersInit): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders,
  });
}

function fallbackSseResponse(status = 503): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'assistant_unavailable', content: CHAT_FALLBACK_MESSAGE })}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    }),
    {
      status,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    },
  );
}

function normalizeContent(content: unknown): string | null {
  if (typeof content !== 'string') {
    return null;
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, MESSAGE_MAX_CHARS);
}

function sanitizeChatRequest(body: unknown): SanitizedChatRequest | { error: string } {
  if (!body || typeof body !== 'object') {
    return { error: 'invalid_request' };
  }

  const record = body as Record<string, unknown>;
  const message = normalizeContent(record.message);
  if (!message) {
    return { error: 'message_required' };
  }

  const rawHistory = Array.isArray(record.conversationHistory) ? record.conversationHistory : [];
  const conversationHistory = rawHistory
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
    .map((entry) => {
      const role = entry.role;
      const content = normalizeContent(entry.content);
      if ((role === 'user' || role === 'assistant') && content) {
        return { role, content };
      }
      return null;
    })
    .filter((entry): entry is { role: AllowedRole; content: string } => entry !== null)
    .slice(-HISTORY_MAX_MESSAGES);

  return { message, conversationHistory };
}

function normalizeIpCandidate(candidate: string | null): string | null {
  if (!candidate) {
    return null;
  }

  for (const rawPart of candidate.split(',')) {
    const cleaned = rawPart.trim().replace(/^\[/, '').replace(/\]$/, '');
    const portParts = cleaned.split(':');
    const withoutPort = cleaned.includes(':') && portParts.length === 2 && portParts[0]
      ? portParts[0]
      : cleaned;

    if (/^[a-f0-9:.]{3,45}$/i.test(withoutPort)) {
      return withoutPort.toLowerCase();
    }
  }

  return null;
}

function clientIp(request: Request): string {
  return (
    normalizeIpCandidate(request.headers.get('x-real-ip'))
    ?? normalizeIpCandidate(request.headers.get('cf-connecting-ip'))
    ?? normalizeIpCandidate(request.headers.get('x-vercel-forwarded-for'))
    ?? normalizeIpCandidate(request.headers.get('x-forwarded-for'))
    ?? '127.0.0.1'
  );
}

function checkRateLimit(request: Request): Response | null {
  const now = Date.now();
  pruneRateLimitStore(now);
  const key = clientIp(request);
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1_000));
    return jsonResponse(
      { error: 'rate_limited', message: 'Too many chat requests. Please try again in a minute.' },
      429,
      { 'Retry-After': String(retryAfterSeconds) },
    );
  }

  current.count += 1;
  rateLimitStore.set(key, current);
  return null;
}

function pruneRateLimitStore(now: number) {
  for (const [key, entry] of rateLimitStore) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }

  while (rateLimitStore.size > RATE_LIMIT_MAX_KEYS) {
    const oldestKey = rateLimitStore.keys().next().value as string | undefined;
    if (!oldestKey) {
      break;
    }
    rateLimitStore.delete(oldestKey);
  }
}

function createLinkedAbortSignal(request: Request): {
  signal: AbortSignal;
  abort: (reason?: unknown) => void;
  cleanup: () => void;
  isClientAbort: () => boolean;
} {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error('chat_timeout')), CHAT_TIMEOUT_MS);
  let clientAborted = request.signal.aborted;
  const abortFromRequest = () => {
    clientAborted = true;
    controller.abort(request.signal.reason);
  };

  if (request.signal.aborted) {
    abortFromRequest();
  } else {
    request.signal.addEventListener('abort', abortFromRequest, { once: true });
  }

  return {
    signal: controller.signal,
    abort: (reason?: unknown) => {
      if (!controller.signal.aborted) {
        controller.abort(reason);
      }
    },
    cleanup: () => {
      clearTimeout(timeout);
      request.signal.removeEventListener('abort', abortFromRequest);
    },
    isClientAbort: () => clientAborted,
  };
}

function getErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object') {
    const record = error as { code?: unknown; status?: unknown };
    if (typeof record.code === 'string') return record.code;
    if (typeof record.status === 'number') return String(record.status);
  }
  return undefined;
}

function isAuthenticationError(error: unknown): boolean {
  const code = getErrorCode(error);
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return code === '401' || code === '403' || message.includes('invalid api key') || message.includes('authentication');
}

function isTransientProviderError(error: unknown): boolean {
  const code = getErrorCode(error);
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return Boolean(code && TRANSIENT_ERROR_CODES.has(code)) || message.includes('timeout') || message.includes('temporarily');
}

async function createProviderStream(
  client: OpenAI,
  provider: ReturnType<typeof resolveChatProvider>,
  messages: OpenAI.ChatCompletionMessageParam[],
  signal: AbortSignal,
) {
  if (!provider) {
    throw new Error('missing_provider');
  }

  const requestBody = {
    model: provider.model,
    messages,
    stream: true,
    temperature: 0.4,
    max_tokens: 500,
  } as const;

  try {
    return await client.chat.completions.create(requestBody, { signal });
  } catch (error) {
    if (!isAuthenticationError(error) && isTransientProviderError(error) && !signal.aborted) {
      return await client.chat.completions.create(requestBody, { signal });
    }
    throw error;
  }
}

export async function POST(request: Request) {
  let abort: ReturnType<typeof createLinkedAbortSignal> | null = null;

  try {
    const rateLimited = checkRateLimit(request);
    if (rateLimited) {
      return rateLimited;
    }

    const parsed = sanitizeChatRequest(await request.json());
    if ('error' in parsed) {
      if (parsed.error === 'message_required') {
        return jsonResponse({ error: 'Message is required' }, 400);
      }
      return jsonResponse({ error: 'Invalid chat request' }, 400);
    }
    const { message, conversationHistory } = parsed;

    const provider = resolveChatProvider();
    if (!provider) {
      return fallbackSseResponse();
    }

    const requestAbort = createLinkedAbortSignal(request);
    abort = requestAbort;
    const host = request.headers.get('host') ?? 'camilomartinez.co';
    const proto = host.includes('localhost') ? 'http' : 'https';
    const liveContext = await getLiveContext(`${proto}://${host}`, requestAbort.signal);
    requestAbort.signal.throwIfAborted();

    const client = createChatClient(provider);
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT + liveContext },
      ...conversationHistory.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    const stream = await createProviderStream(client, provider, messages, requestAbort.signal);
    const encoder = new TextEncoder();
    let streamCancelled = false;
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (requestAbort.signal.aborted) {
              if (requestAbort.isClientAbort() || streamCancelled) {
                return;
              }
              throw new Error('chat_timeout');
            }
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          if (requestAbort.signal.aborted) {
            if (requestAbort.isClientAbort() || streamCancelled) {
              return;
            }
            throw new Error('chat_timeout');
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          if (requestAbort.isClientAbort() || streamCancelled) {
            return;
          }
          console.error('[chat] stream_error', { errorClass: getErrorCode(err) ?? 'stream_error' });
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'assistant_unavailable', content: CHAT_FALLBACK_MESSAGE })}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } finally {
          requestAbort.cleanup();
        }
      },
      cancel() {
        streamCancelled = true;
        requestAbort.abort(new Error('chat_stream_cancelled'));
        requestAbort.cleanup();
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    });
  } catch (error) {
    abort?.cleanup();
    if (error instanceof SyntaxError) {
      return jsonResponse({ error: 'invalid_json' }, 400);
    }
    if (isAuthenticationError(error)) {
      console.error('[chat] provider_auth_error');
      return fallbackSseResponse();
    }
    console.error('[chat] request_error', { errorClass: getErrorCode(error) ?? 'unknown' });
    return fallbackSseResponse();
  }
}
