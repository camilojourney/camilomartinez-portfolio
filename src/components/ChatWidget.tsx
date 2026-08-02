'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, X } from 'lucide-react';
import Image from 'next/image';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function renderContent(text: string): string {
  const linkStyle = 'color:#67e8f9;text-decoration:underline;text-underline-offset:2px';
  return text
    // [text](https://...) → external link
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, `<a href="$2" target="_blank" rel="noopener noreferrer" style="${linkStyle}">$1</a>`)
    // [text](mailto:...) → email link
    .replace(/\[([^\]]+)\]\((mailto:[^\)]+)\)/g, `<a href="$2" style="${linkStyle}">$1</a>`)
    // [text](/relative/path) → internal link (same tab)
    .replace(/\[([^\]]+)\]\((\/[^\)]*)\)/g, `<a href="$2" style="${linkStyle}">$1</a>`)
    // bare https:// URLs
    .replace(/(^|[\s(])(https?:\/\/[^\s)]+)/g, `$1<a href="$2" target="_blank" rel="noopener noreferrer" style="${linkStyle}">$2</a>`)
    // **bold**
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // bullet lines
    .replace(/^[-•]\s(.+)$/gm, '<div style="display:flex;gap:6px;margin:2px 0"><span style="opacity:0.4;flex-shrink:0">•</span><span>$1</span></div>')
    // newlines
    .replace(/\n/g, '<br/>');
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: "I can answer questions about my speech ML pipeline, multi-agent architecture, or availability.",
};

const CHAT_UNAVAILABLE_RECRUITER_FALLBACK =
  'AI service is temporarily unavailable, but here is the direct answer: Camilo is open to Applied AI Engineer roles in NYC, including remote/hybrid teams. Reach him at [juancamilomabe@gmail.com](mailto:juancamilomabe@gmail.com).';

const SUGGESTED = [
  "What's your speech ML pipeline?",
  'How does your multi-agent system work?',
  'Are you open to AI Engineer roles?',
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [showTeaser, setShowTeaser] = useState(true);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');
    setLoading(true);

    const history = messages.slice(1); // skip initial
    setMessages((p) => [...p, { role: 'user', content: msg }, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, conversationHistory: history }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('no body');
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ') || line === 'data: [DONE]') continue;
          try {
            const { content } = JSON.parse(line.slice(6)) as { content: string };
            if (content) setMessages((p) => {
              const u = [...p];
              const last = u[u.length - 1];
              if (last) u[u.length - 1] = { role: 'assistant', content: last.content + content };
              return u;
            });
          } catch { /* skip */ }
        }
      }
    } catch {
      setMessages((p) => { const u = [...p]; u[u.length - 1] = { role: 'assistant', content: CHAT_UNAVAILABLE_RECRUITER_FALLBACK }; return u; });
    } finally {
      setLoading(false);
    }
  }

  const fresh = messages.length === 1;
  const [hint, setHint] = useState(true);
  useEffect(() => { const t = setTimeout(() => setHint(false), 6000); return () => clearTimeout(t); }, []);
  useEffect(() => { if (open) setHint(false); }, [open]);

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
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center gap-2.5">
              <Image
                src="/bot.png"
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
              onClick={() => setOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
            style={{ scrollbarWidth: 'none' }}
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
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
                    <span dangerouslySetInnerHTML={{ __html: renderContent(m.content) }} />
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
            <div ref={bottomRef} />
          </div>

          {/* Input */}
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
                disabled={loading}
                placeholder="Ask anything..."
                className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/25 outline-none disabled:opacity-50"
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
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

      {/* Speech bubble teaser */}
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
          {/* tail */}
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

      {/* Animations */}
      <style>{`
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Trigger button */}
      <button
        onClick={() => {
          setOpen((v) => !v);
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
        aria-label="Chat with AI assistant"
      >
        {open ? (
          <X className="w-5 h-5 text-white/70" />
        ) : (
          <Image src="/bot.png" alt="Chat" width={60} height={60} className="rounded-full object-cover" />
        )}
      </button>
    </div>
  );
}
