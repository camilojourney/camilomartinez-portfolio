"use client";

import { useMemo, useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { aiService } from '@/lib/api/config';

// Define FastAPI response types
interface AIQueryResponse {
  status: string;
  data?: {
    response?: string;
    answer?: string;
    history_id?: number;
    data?: unknown;
    explanation?: { thought: string; plan: string; sql: string };
    result_count?: number;
    processing_time_ms?: number;
  };
  message?: string;
  timestamp: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  historyId?: number | null;
  feedback?: number;
  payload?: {
    data?: unknown;
    explanation?: { thought: string; plan: string; sql: string };
    metadata?: { timestamp: string; rowCount: number; latencyMs: number };
  };
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const dataPayload = message.payload?.data;
  const hasDataPayload = dataPayload !== undefined && dataPayload !== null;
  const [showDetails, setShowDetails] = useState(false);

  // Format message content with basic markdown-like parsing
  const formatContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Bold text: **text** or __text__
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');
      line = line.replace(/__(.*?)__/g, '<strong class="font-bold">$1</strong>');

      // Italic text: *text* or _text_
      line = line.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
      line = line.replace(/_(.*?)_/g, '<em class="italic">$1</em>');

      // Inline code: `code`
      line = line.replace(/`([^`]+)`/g, '<code class="bg-black/30 px-1.5 py-0.5 rounded text-cyan-300">$1</code>');

      // Bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return `<li key=${idx} class="ml-4">${line.substring(2)}</li>`;
      }

      // Headers
      if (line.trim().startsWith('### ')) {
        return `<h3 key=${idx} class="text-base font-bold mt-2 mb-1">${line.substring(4)}</h3>`;
      }
      if (line.trim().startsWith('## ')) {
        return `<h2 key=${idx} class="text-lg font-bold mt-3 mb-1">${line.substring(3)}</h2>`;
      }
      if (line.trim().startsWith('# ')) {
        return `<h1 key=${idx} class="text-xl font-bold mt-4 mb-2">${line.substring(2)}</h1>`;
      }

      return line === '' ? '<br key=' + idx + ' />' : `<p key=${idx}>${line}</p>`;
    }).join('');
  };

  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className={`max-w-[85%] md:max-w-[90%] px-3.5 py-2.5 rounded-2xl space-y-2.5 ${
          isUser
            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
            : 'bg-white/8 text-slate-100 border border-white/10 backdrop-blur-sm'
        }`}
      >
        <div
          className="text-sm leading-relaxed prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
        />

        {!isUser && (hasDataPayload || message.payload?.explanation) && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
          >
            {showDetails ? '▼' : '▶'} {showDetails ? 'Hide' : 'Show'} Details
          </button>
        )}

        {!isUser && showDetails && hasDataPayload && (
          <motion.pre
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs bg-black/20 border border-white/15 rounded-lg p-2.5 overflow-x-auto backdrop-blur-sm"
          >
            {JSON.stringify(dataPayload, null, 2)}
          </motion.pre>
        )}

        {!isUser && showDetails && message.payload?.explanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-gray-300 space-y-1 bg-black/10 rounded-lg p-2.5 border border-white/10"
          >
            <p><span className="font-semibold text-cyan-400">💭 Thought:</span> {message.payload.explanation.thought}</p>
            <p><span className="font-semibold text-blue-400">📋 Plan:</span> {message.payload.explanation.plan}</p>
            <p><span className="font-semibold text-purple-400">🔍 SQL:</span> <code className="block break-words text-cyan-200 mt-1 bg-black/20 p-1.5 rounded">{message.payload.explanation.sql}</code></p>
          </motion.div>
        )}

        {!isUser && message.payload?.metadata && (
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <span className="flex items-center gap-1">
              📊 {message.payload.metadata.rowCount} rows
            </span>
            <span className="text-gray-500">·</span>
            <span className="flex items-center gap-1">
              ⚡ {Math.round(message.payload.metadata.latencyMs)}ms
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Typing indicator component
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex justify-start"
    >
      <div className="bg-white/8 text-slate-100 border border-white/10 backdrop-blur-sm px-4 py-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <motion.div
              className="w-2 h-2 bg-cyan-400 rounded-full"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="w-2 h-2 bg-blue-400 rounded-full"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            />
            <motion.div
              className="w-2 h-2 bg-purple-400 rounded-full"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            />
          </div>
          <span className="text-xs text-gray-400">AI is thinking...</span>
        </div>
      </div>
    </motion.div>
  );
}

const initialAssistantMessage: Message = {
  id: 'assistant-intro',
  role: 'assistant',
  content:
    "✨ Hello! I'm Camilo's AI assistant. I can query live fitness data from Strava & WHOOP, analyze project metrics, and answer questions about his work. What would you like to know?",
};

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([initialAssistantMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackSubmittingFor, setFeedbackSubmittingFor] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const suggestedQuestions = useMemo(() => {
    // Rotate through different sets of questions to keep it fresh
    const questionSets = [
      [
        "What was my fastest mile during my last run?",
        "Show my WHOOP recovery trend this week",
        "What are my most recent running activities?",
      ],
      [
        "How is my sleep quality trending?",
        "What's my average strain score this month?",
        "Compare my recovery vs strain patterns",
      ],
      [
        "Tell me about Camilo's AI projects",
        "What technologies does Camilo use?",
        "Show me Camilo's recent workout performance",
      ],
      [
        "What's my best running pace this year?",
        "How many days did I work out this month?",
        "What's my average heart rate during runs?",
      ],
    ];

    // Pick a random set each time component mounts
    const randomIndex = Math.floor(Math.random() * questionSets.length);
    return questionSets[randomIndex];
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const question = input.trim();
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Use new FastAPI backend instead of Next.js API route
      const response = await aiService.query(question, true, 30) as AIQueryResponse;

      // FastAPI returns standardized response format
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.data?.response || response.data?.answer || 'Query processed successfully.',
        historyId: response.data?.history_id,
        payload: {
          data: response.data?.data,
          explanation: response.data?.explanation,
          metadata: {
            timestamp: response.timestamp,
            rowCount: response.data?.result_count || 0,
            latencyMs: response.data?.processing_time_ms || 0,
          }
        }
      };

      // Simulate typing delay for better UX
      setTimeout(() => {
        setMessages([...updatedMessages, assistantMessage]);
        setIsTyping(false);
      }, 800);

    } catch (error) {
      console.error('Failed to send message:', error);

      // Generate helpful error message based on error type
      let errorContent = "I encountered an issue processing your request. ";

      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorContent += "It looks like I can't reach the AI service right now. Please check your internet connection and try again.";
        } else if (error.message.includes('timeout')) {
          errorContent += "The request took too long to process. This usually happens with complex queries. Try a simpler question or try again in a moment.";
        } else {
          errorContent += `**Error Details:** ${error.message}\n\n`;
          errorContent += "**What you can try:**\n";
          errorContent += "- Rephrase your question more simply\n";
          errorContent += "- Ask about a specific metric (e.g., 'recovery score', 'running pace')\n";
          errorContent += "- Try one of the suggested questions below";
        }
      } else {
        errorContent += "**What you can try:**\n";
        errorContent += "- Check your internet connection\n";
        errorContent += "- Try asking a different question\n";
        errorContent += "- Refresh the page if the issue persists";
      }

      const assistantError: Message = {
        id: `assistant-failure-${Date.now()}`,
        role: 'assistant',
        content: errorContent,
      };

      // Simulate typing delay for better UX
      setTimeout(() => {
        setMessages([...updatedMessages, assistantError]);
        setIsTyping(false);
      }, 800);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedbackClick = async (message: Message, value: -1 | 1) => {
    if (!message.historyId || feedbackSubmittingFor) return;

    setFeedbackSubmittingFor(message.id);
    const previousMessages = messages;

    try {
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, feedback: value } : m))
      );

      // TODO: Implement feedback endpoint in FastAPI backend
      // For now, just log the feedback locally
      console.log('Feedback submitted:', { queryId: message.historyId, feedback: value });
      
      // Simulate successful feedback submission
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Unable to record feedback:', error);
      setMessages(previousMessages);
    } finally {
      setFeedbackSubmittingFor(null);
    }
  };

  return (
    <div className="p-4 w-full h-full flex flex-col">
      <div className="space-y-3 flex-1 overflow-y-auto pr-2 mb-3">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-1.5"
            >
              <ChatMessage message={msg} />

              {msg.role === 'assistant' && msg.historyId && (
                <div className="flex justify-end gap-1.5 text-xs text-gray-400">
                  <button
                    type="button"
                    onClick={() => handleFeedbackClick(msg, 1)}
                    disabled={feedbackSubmittingFor === msg.id}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full border transition-all backdrop-blur-sm ${
                      msg.feedback === 1
                        ? 'bg-green-500/20 text-green-300 border-green-500/40'
                        : 'border-white/20 hover:border-green-400 hover:text-green-200 hover:bg-green-500/10'
                    }`}
                  >
                    👍 Helpful
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFeedbackClick(msg, -1)}
                    disabled={feedbackSubmittingFor === msg.id}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full border transition-all backdrop-blur-sm ${
                      msg.feedback === -1
                        ? 'bg-red-500/20 text-red-300 border-red-500/40'
                        : 'border-white/20 hover:border-red-400 hover:text-red-200 hover:bg-red-500/10'
                    }`}
                  >
                    👎 Needs work
                  </button>
                </div>
              )}
            </motion.div>
          ))}

          {/* Typing Indicator */}
          {isTyping && <TypingIndicator key="typing-indicator" />}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </AnimatePresence>
      </div>

      <div className="mb-4">
        <p className="text-sm text-white/60 mb-3">Try asking:</p>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => setInput(question)}
              className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-white/70 hover:text-white transition-all duration-200 backdrop-blur-sm"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask anything about Camilo's fitness or projects..."
          disabled={isLoading}
          className="flex-1 bg-white/5 border border-white/20 rounded-full px-3.5 py-2.5 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={isLoading}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full px-5 py-2.5 text-sm disabled:opacity-50 hover:from-cyan-400 hover:to-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Send'
          )}
        </button>
      </div>
    </div>
  );
}
