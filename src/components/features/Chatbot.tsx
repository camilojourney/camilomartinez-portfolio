"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// A simple component to render a chat message
function ChatMessage({ message, role }: { message: string, role: 'user' | 'assistant' }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${isUser ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
        {message}
      </div>
    </div>
  );
}

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi there! I'm an AI assistant. Ask me anything about Camilo's work." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const aiResponse = await response.json();
      setMessages([...newMessages, aiResponse]);
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages([...newMessages, { role: 'assistant', content: "Sorry, I couldn't connect. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4 w-full max-w-2xl mx-auto mt-12">
      <div className="space-y-4 h-80 overflow-y-auto pr-2">
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ChatMessage message={msg.content} role={msg.role} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about my projects or skills..."
          className="flex-1 bg-slate-800 border border-slate-600 rounded-full px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={handleSend} disabled={isLoading} className="bg-blue-600 text-white rounded-full px-6 py-2 disabled:opacity-50">
          {isLoading ? '...' : 'Send'}
        </button>
      </div>
    </Card>
  );
}
