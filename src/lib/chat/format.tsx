import type { ReactNode } from 'react';

export const CHAT_CONTACT_EMAIL = 'juancamilomabe@gmail.com';
export const CHAT_FALLBACK_MESSAGE =
  `The assistant is temporarily unavailable. Email Camilo at [${CHAT_CONTACT_EMAIL}](mailto:${CHAT_CONTACT_EMAIL}) or use the contact page.`;

export interface ParsedSseEvent {
  content?: string;
  error?: string;
  done?: boolean;
}

export interface SseParseResult {
  events: ParsedSseEvent[];
  buffer: string;
}

export function parseSseChunk(buffer: string, chunk: string): SseParseResult {
  const combined = buffer + chunk;
  const frames = combined.split(/\n\n/);
  const nextBuffer = frames.pop() ?? '';
  const events: ParsedSseEvent[] = [];

  for (const frame of frames) {
    const dataLines = frame
      .split('\n')
      .filter((line) => line.startsWith('data: '))
      .map((line) => line.slice(6));

    if (dataLines.length === 0) {
      continue;
    }

    const data = dataLines.join('\n');
    if (data === '[DONE]') {
      events.push({ done: true });
      continue;
    }

    try {
      const parsed = JSON.parse(data) as { content?: unknown; error?: unknown };
      const event: ParsedSseEvent = {};
      if (typeof parsed.content === 'string') {
        event.content = parsed.content;
      }
      if (typeof parsed.error === 'string') {
        event.error = parsed.error;
      }
      if (event.content || event.error) {
        events.push(event);
      }
    } catch {
      events.push({ error: 'invalid_stream_frame' });
    }
  }

  return { events, buffer: nextBuffer };
}

function pushText(nodes: ReactNode[], text: string, keyPrefix: string) {
  if (!text) return;
  nodes.push(text);
}

function renderInlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*|mailto:[^\s)]+)\)|(https?:\/\/[^\s)]+)/g;
  let lastIndex = 0;
  let index = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    pushText(nodes, text.slice(lastIndex, match.index), `${keyPrefix}-text-${index}`);
    const markdownLabel = match[1];
    const markdownHref = match[2];
    const bareHref = match[3];
    const href = markdownHref ?? bareHref;
    const label = markdownLabel ?? bareHref;

    if (href && label) {
      const isExternal = href.startsWith('http');
      nodes.push(
        <a
          key={`${keyPrefix}-link-${index}`}
          href={href}
          {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="text-cyan-300 underline decoration-cyan-300/40 underline-offset-2 hover:text-cyan-100"
        >
          {label}
        </a>,
      );
    }

    lastIndex = linkRegex.lastIndex;
    index += 1;
  }

  pushText(nodes, text.slice(lastIndex), `${keyPrefix}-text-tail`);
  return nodes;
}

function renderBoldSegments(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.flatMap((part, index): ReactNode[] => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return [
        <strong key={`${keyPrefix}-bold-${index}`} className="font-semibold text-white/95">
          {renderInlineMarkdown(part.slice(2, -2), `${keyPrefix}-bold-${index}`)}
        </strong>,
      ];
    }
    return renderInlineMarkdown(part, `${keyPrefix}-inline-${index}`);
  });
}

export function renderChatContent(text: string): ReactNode {
  return text.split('\n').map((line, index) => {
    const trimmed = line.trim();
    const key = `chat-line-${index}`;

    if (!trimmed) {
      return <br key={key} />;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      return (
        <div key={key} className="my-0.5 flex gap-1.5">
          <span aria-hidden className="shrink-0 text-white/40">•</span>
          <span>{renderBoldSegments(trimmed.slice(2), key)}</span>
        </div>
      );
    }

    return <span key={key}>{renderBoldSegments(line, key)}{index < text.split('\n').length - 1 ? <br /> : null}</span>;
  });
}
