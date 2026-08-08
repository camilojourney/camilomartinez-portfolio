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

  return (
    <div data-chat-widget className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          className="w-[min(360px,calc(100vw-48px))] flex flex-col rounded-3xl shadow-2xl shadow-black/40 overflow-hidden backdrop-blur-2xl"
          style={{
            height: 480,
            background: 'rgba(8, 10, 20, 0.92)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center gap-2.5">
              <Image
                src="/bot-avatar.png"
                alt="AI Assistant"
                width={28}
                height={28}
                className="rounded-full"
              />
              <div>
                <p className="text-white text-sm font-semibold leading-none">AI Assistant</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Applied AI Engineer
                </p>
              </div>
            </div>
            <button
              onClick={closeChat}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
            style={{ scrollbarWidth: 'none' }}
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  data-chat-message-role={m.role}
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user' ? 'text-white rounded-br-sm' : 'rounded-bl-sm'
                  }`}
                  style={
                    m.role === 'user'
                      ? { background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }
                      : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.85)' }
                  }
                >
                  {m.content ? (
                    <span>{renderChatContent(m.content)}</span>
                  ) : loading && i === messages.length - 1 ? (
                    <span className="flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 animate-bounce" style={{ animationDelay: '200ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 animate-bounce" style={{ animationDelay: '400ms' }} />
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
                    className="text-left text-xs px-3 py-3 rounded-xl transition-all duration-200 text-white/50 border border-white/[0.08] hover:text-white/80 hover:border-cyan-400/40 hover:bg-cyan-500/5"
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
                className="text-left text-xs px-3 py-3 rounded-xl transition-all duration-200 text-cyan-100 border border-cyan-400/30 hover:border-cyan-300/60 hover:bg-cyan-500/10"
              >
                Retry last question
              </button>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="px-3 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
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
                className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/25 outline-none disabled:opacity-50"
              />
              <button
                onClick={() => send()}
                disabled={loading || rateLimitUntil !== null || !input.trim()}
                aria-label="Send message"
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-30"
                style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {!open && showTeaser && (
        <div
          onClick={() => {
            setOpen(true);
            setShowTeaser(false);
          }}
          className="cursor-pointer select-none backdrop-blur-2xl"
          style={{
            background: 'rgba(8, 10, 20, 0.92)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 16,
            padding: '10px 14px',
            fontSize: 13,
            color: 'rgba(255,255,255,0.85)',
            maxWidth: 240,
            lineHeight: 1.45,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            animation: 'fadeSlideUp 0.3s ease',
            position: 'relative',
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTeaser(false);
            }}
            aria-label="Dismiss"
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              borderRadius: 6,
              color: 'rgba(255,255,255,0.3)',
            }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
          Built a speech ML pipeline from 46 papers. Ask me about it.
          <div
            style={{
              position: 'absolute',
              bottom: -7,
              right: 22,
              width: 0,
              height: 0,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderTop: '7px solid rgba(8, 10, 20, 0.92)',
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <button
        onClick={() => {
          if (open) {
            closeChat();
          } else {
            setOpen(true);
          }
          setShowTeaser(false);
        }}
        className="flex items-center justify-center text-white shadow-xl transition-all duration-300 hover:scale-105"
        style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: open ? 'rgba(255,255,255,0.1)' : 'transparent',
          border: open ? '1px solid rgba(255,255,255,0.1)' : 'none',
          overflow: 'hidden',
          padding: 0,
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
        }}
        aria-label={open ? 'Close chat' : 'Chat with AI assistant'}
      >
        {open ? (
          <X className="w-5 h-5 text-white/70" />
        ) : (
          <Image src="/bot-avatar.png" alt="Chat" width={60} height={60} className="rounded-full object-cover" />
        )}
      </button>
    </div>
  );
}
