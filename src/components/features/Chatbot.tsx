"use client";

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

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

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] md:max-w-[90%] px-3.5 py-2.5 rounded-2xl space-y-2.5 ${
          isUser
            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
            : 'bg-white/8 text-slate-100 border border-white/10 backdrop-blur-sm'
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        {!isUser && hasDataPayload && (
          <pre className="text-xs bg-black/20 border border-white/15 rounded-lg p-2.5 overflow-x-auto backdrop-blur-sm">
            {JSON.stringify(dataPayload, null, 2)}
          </pre>
        )}
        {!isUser && message.payload?.explanation && (
          <div className="text-xs text-gray-300 space-y-1">
            <p><span className="font-semibold text-white">Thought:</span> {message.payload.explanation.thought}</p>
            <p><span className="font-semibold text-white">Plan:</span> {message.payload.explanation.plan}</p>
            <p><span className="font-semibold text-white">SQL:</span> <code className="block break-words text-cyan-200">{message.payload.explanation.sql}</code></p>
          </div>
        )}
        {!isUser && message.payload?.metadata && (
          <div className="text-xs text-gray-400">
            <p>Rows: {message.payload.metadata.rowCount} · Latency: {Math.round(message.payload.metadata.latencyMs)}ms</p>
          </div>
        )}
      </div>
    </div>
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

  const suggestedQuestions = useMemo(
    () => [
      "What was my fastest mile during my last run?",
      "Summarize my WHOOP recovery trend this week.",
      "What project best shows Camilo's AI expertise?",
    ],
    []
  );

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
      const response = await fetch('/api/ai-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      const payload = await response.json();

      if (!response.ok) {
        const assistantError: Message = {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: payload?.error || 'The AI agent could not process your request.',
          historyId: payload?.historyId,
        };
        setMessages([...updatedMessages, assistantError]);
        return;
      }

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: payload?.explanation?.plan
          ? `Plan: ${payload.explanation.plan}`
          : 'Query executed successfully.',
        historyId: payload?.historyId,
        payload: {
          data: payload?.data,
          explanation: payload?.explanation,
          metadata: payload?.metadata,
        },
      };

      // Simulate typing delay for better UX
      setTimeout(() => {
        setMessages([...updatedMessages, assistantMessage]);
        setIsTyping(false);
      }, 800);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages([
        ...updatedMessages,
        {
          id: `assistant-failure-${Date.now()}`,
          role: 'assistant',
          content: "Sorry, I couldn't connect. Please try again later.",
        },
      ]);
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

      const response = await fetch('/api/ai-query/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId: message.historyId, feedback: value }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }
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
        <AnimatePresence>
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
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask anything about Camilo's fitness or projects..."
          className="flex-1 bg-white/5 border border-white/20 rounded-full px-3.5 py-2.5 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 backdrop-blur-sm"
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
