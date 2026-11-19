'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, X } from 'lucide-react';
import Image from 'next/image';
import { CHAT_UNAVAILABLE_RECRUITER_FALLBACK } from '@/data/recruiter';
import { parseSseChunk, renderChatContent, type ParsedSseEvent } from '@/lib/chat/format';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  displayOnly?: boolean;
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: "I can answer questions about my speech ML pipeline, multi-agent architecture, or availability.",
};

const SUGGESTED = [
  "What's your speech ML pipeline?",
  'How does your multi-agent system work?',
  'Are you open to AI Engineer roles?',
];

const DEFAULT_RATE_LIMIT_DELAY_MS = 60_000;

function conversationHistory(messages: Message[]): Message[] {
  const history: Message[] = [];

  for (let index = 0; index < messages.length - 1; index += 1) {
    const user = messages[index];
    const assistant = messages[index + 1];
    if (
      user?.role === 'user'
      && assistant?.role === 'assistant'
      && !user.displayOnly
      && !assistant.displayOnly
    ) {
      history.push(user, assistant);
      index += 1;
    }
  }

  return history;
}

function retryDelayMs(response: Response): number {
  const retryAfter = response.headers.get('retry-after');
  if (!retryAfter) {
    return DEFAULT_RATE_LIMIT_DELAY_MS;
  }

  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1_000;
  }

  const retryDate = Date.parse(retryAfter);
  return Number.isNaN(retryDate)
    ? DEFAULT_RATE_LIMIT_DELAY_MS
    : Math.max(0, retryDate - Date.now());
}

async function rateLimitMessage(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }
  return 'Too many chat requests. Please try again later.';
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [showTeaser, setShowTeaser] = useState(true);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [rateLimitUntil, setRateLimitUntil] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => () => {
    abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (rateLimitUntil === null) {
      return;
    }
    const timeout = window.setTimeout(
      () => setRateLimitUntil(null),
      Math.max(0, rateLimitUntil - Date.now()),
    );
    return () => window.clearTimeout(timeout);
  }, [rateLimitUntil]);

  function replaceLastAssistant(content: string, displayOnly = false) {
    setMessages((p) => {
      const updated = [...p];
      const last = updated[updated.length - 1];
      if (last?.role === 'assistant') {
        updated[updated.length - 1] = { role: 'assistant', content, displayOnly };
      }
      return updated;
    });
  }

  function appendAssistantContent(content: string) {
    setMessages((p) => {
      const updated = [...p];
      const last = updated[updated.length - 1];
      if (last?.role === 'assistant') {
        updated[updated.length - 1] = { role: 'assistant', content: last.content + content };
      }
      return updated;
    });
  }

  function removePendingAssistantMessage() {
    setMessages((p) => {
      const last = p[p.length - 1];
      if (last?.role === 'assistant' && !last.content) {
        return p.slice(0, -1);
      }
      return p;
    });
  }

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading || rateLimitUntil !== null) return;
    setInput('');
    setLoading(true);
    setLastFailedPrompt(null);

    const history = conversationHistory(messages);
    setMessages((p) => [...p, { role: 'user', content: msg }, { role: 'assistant', content: '' }]);
    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, conversationHistory: history }),
        signal: abortController.signal,
      });

      if (res.status === 429) {
        const message = await rateLimitMessage(res);
        setRateLimitUntil(Date.now() + retryDelayMs(res));
        replaceLastAssistant(message, true);
        return;
      }

      if (!res.ok && !res.headers.get('content-type')?.includes('text/event-stream')) {
        throw new Error(`${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('no body');
      let buffer = '';
      let doneStreaming = false;
      const consumeEvents = (events: ParsedSseEvent[]) => {
        for (const event of events) {
          if (event.done) {
            return true;
          }
          if (event.error) {
            replaceLastAssistant(event.content || CHAT_UNAVAILABLE_RECRUITER_FALLBACK, true);
            setLastFailedPrompt(msg);
          } else if (event.content) {
            appendAssistantContent(event.content);
          }
        }
        return false;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const parsed = parseSseChunk(buffer, decoder.decode(value, { stream: true }));
        buffer = parsed.buffer;
        doneStreaming = consumeEvents(parsed.events);
        if (doneStreaming) {
          break;
        }
      }

      const parsed = parseSseChunk(buffer, decoder.decode());
      buffer = parsed.buffer;
      if (!doneStreaming) {
        doneStreaming = consumeEvents(parsed.events);
      }

      if (!doneStreaming || buffer.length > 0) {
        throw new Error('incomplete_stream');
      }
    } catch {
      if (!abortController.signal.aborted) {
        replaceLastAssistant(CHAT_UNAVAILABLE_RECRUITER_FALLBACK, true);
        setLastFailedPrompt(msg);
      }
    } finally {
      if (abortRef.current === abortController) {
        abortRef.current = null;
        setLoading(false);
      }
    }
  }

  const fresh = messages.length === 1;
  const [hint, setHint] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setHint(false), 6000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (open) setHint(false);
  }, [open]);

  function closeChat() {
    if (abortRef.current) {
      abortRef.current.abort();
      removePendingAssistantMessage();
    }
    abortRef.current = null;
    setLoading(false);
    setOpen(false);
  }

  function openFromTeaser() {
    setOpen(true);
    setShowTeaser(false);
  }

  return (
    <div data-chat-widget className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 md:bottom-6 md:right-6">
      {open && (
        <div
          role="dialog"
          aria-label="Chat with Camilo's assistant"
          onKeyDown={(event) => {
            if (event.key === 'Escape') closeChat();
          }}
          className="panel flex w-[min(360px,calc(100vw-40px))] flex-col overflow-hidden shadow-2xl shadow-black/10"
          style={{ height: 'min(480px, calc(100dvh - 120px))' }}
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Image
                src="/bot-avatar.png"
                alt=""
                width={28}
                height={28}
                className="rounded-full border border-line"
              />
              <div>
                <p className="text-sm font-semibold leading-none text-ink">Ask Camilo</p>
                <p className="mt-1 text-xs text-muted">Applied AI Engineer</p>
              </div>
            </div>
            <button
              onClick={closeChat}
              className="btn-icon shrink-0 hover:bg-surface-2"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  data-chat-message-role={m.role}
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user' ? 'rounded-br-sm bg-ink text-page' : 'rounded-bl-sm bg-surface-2 text-ink'
                  }`}
                >
                  {m.content ? (
                    <div>{renderChatContent(m.content)}</div>
                  ) : loading && i === messages.length - 1 ? (
                    <span className="flex h-4 items-center gap-1" aria-label="Thinking">
                      <span className="h-1.5 w-1.5 typing-dot rounded-full bg-muted" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 typing-dot rounded-full bg-muted" style={{ animationDelay: '200ms' }} />
                      <span className="h-1.5 w-1.5 typing-dot rounded-full bg-muted" style={{ animationDelay: '400ms' }} />
                    </span>
                  ) : null}
                </div>
              </div>
            ))}

            {fresh && (
              <div className="flex flex-col gap-1.5 pt-1">
                {SUGGESTED.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="rounded-md border border-line px-3 py-3 text-left text-xs text-muted transition-colors hover:border-ink hover:text-ink"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {lastFailedPrompt && !loading && (
              <button
                type="button"
                onClick={() => send(lastFailedPrompt)}
                className="rounded-md border border-accent px-3 py-3 text-left text-xs text-accent transition-colors hover:bg-accent hover:text-accent-ink"
              >
                Retry last question
              </button>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="border-t border-line px-3 py-3">
            <div className="flex items-center gap-2 rounded-md border border-line-strong bg-page px-3 py-1.5 focus-within:border-ink">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                disabled={loading || rateLimitUntil !== null}
                placeholder="Ask anything..."
                aria-label="Your question"
                className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted disabled:opacity-50"
              />
              <button
                onClick={() => send()}
                disabled={loading || rateLimitUntil !== null || !input.trim()}
                aria-label="Send message"
                className="btn-primary h-11 w-11 flex-shrink-0 p-0 disabled:opacity-30"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {!open && showTeaser && (
        <div
          role="button"
          tabIndex={0}
          onClick={openFromTeaser}
          onKeyDown={(e) => {
            if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              openFromTeaser();
            }
          }}
          className={`animate-fade-in relative max-w-[240px] cursor-pointer select-none rounded-xl bg-ink py-3 pl-3.5 pr-14 text-[13px] leading-snug text-page shadow-lg ${
            hint ? '' : 'hidden md:block'
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTeaser(false);
            }}
            aria-label="Dismiss"
            className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded text-page transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          Built a speech ML pipeline from 46 papers. Ask me about it.
          <span
            aria-hidden
            className="absolute -bottom-[7px] right-[22px] h-0 w-0 border-l-[7px] border-r-[7px] border-t-[7px] border-l-transparent border-r-transparent border-t-ink"
          />
        </div>
      )}

      <button
        onClick={() => {
          if (open) {
            closeChat();
          } else {
            setOpen(true);
          }
          setShowTeaser(false);
        }}
        className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-line bg-surface p-0 text-ink shadow-lg transition-transform hover:scale-105"
        aria-label={open ? 'Close chat' : 'Chat with AI assistant'}
        aria-expanded={open}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <Image src="/bot-avatar.png" alt="" width={56} height={56} className="h-full w-full rounded-full object-cover" />
        )}
      </button>
    </div>
  );
}
