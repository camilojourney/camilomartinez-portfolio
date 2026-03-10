'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, X } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

function renderContent(text: string): string {
  return text
    // [text](url) → link
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#a5b4fc;text-decoration:underline;text-underline-offset:2px">$1</a>')
    // bare URLs
    .replace(/(^|[\s(])(https?:\/\/[^\s)]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#a5b4fc;text-decoration:underline;text-underline-offset:2px">$2</a>')
    // **bold**
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // bullet lines
    .replace(/^[-•]\s(.+)$/gm, '<div style="display:flex;gap:6px;margin:2px 0"><span style="opacity:0.4;flex-shrink:0">•</span><span>$1</span></div>')
    // newlines
    .replace(/\n/g, '<br/>');
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: "Ask me anything about Camilo's work, projects, or background.",
};

const SUGGESTED = [
  'What is he building right now?',
  'What are his values?',
  'Is he open to new roles?',
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
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
      setMessages((p) => { const u = [...p]; u[u.length - 1] = { role: 'assistant', content: 'Something went wrong. Try again.' }; return u; });
    } finally {
      setLoading(false);
    }
  }

  const fresh = messages.length === 1;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[360px] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{ height: 480, background: 'rgba(10,10,20,0.97)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                C
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-none">Camilo&apos;s AI</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Ask anything</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/70 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ scrollbarWidth: 'none' }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'text-white rounded-br-sm'
                    : 'rounded-bl-sm'
                }`} style={m.role === 'user'
                  ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }
                  : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.85)' }
                }>
                  {m.content
                    ? <span dangerouslySetInnerHTML={{ __html: renderContent(m.content) }} />
                    : (loading && i === messages.length - 1
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin opacity-60" />
                      : null)}
                </div>
              </div>
            ))}

            {fresh && (
              <div className="flex flex-col gap-1.5 pt-1">
                {SUGGESTED.map((q) => (
                  <button key={q} onClick={() => send(q)}
                    className="text-left text-xs px-3 py-2 rounded-xl transition-colors"
                    style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.8)'; (e.target as HTMLElement).style.borderColor = 'rgba(99,102,241,0.4)'; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }}}
                disabled={loading}
                placeholder="Ask anything..."
                className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/25 outline-none disabled:opacity-50"
              />
              <button onClick={() => send()} disabled={loading || !input.trim()}
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-30"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Send className="w-3.5 h-3.5 text-white" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-xl transition-all hover:scale-105"
        style={{ background: open ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        aria-label="Chat with Camilo's AI">
        {open
          ? <X className="w-5 h-5 text-white/70" />
          : <span className="text-sm font-bold">AI</span>}
      </button>
    </div>
  );
}
