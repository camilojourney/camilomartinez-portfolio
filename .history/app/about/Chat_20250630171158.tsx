'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';

// Define the structure for a single message object
interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
}

export default function Chat() {
    // State to hold the conversation history
    const [messages, setMessages] = useState<Message[]>([]);
    // State to hold the user's current input
    const [input, setInput] = useState('');
    // State to show if the bot is "typing"
    const [isBotTyping, setIsBotTyping] = useState(false);
    // Ref to scroll to the bottom of the chat
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    // The pre-written script of questions and answers
    const getBotResponse = (question: string): string => {
        const q = question.toLowerCase().trim();
        // Your improved script from our discussion
        if (q.includes('about camilo') || q.includes('who is camilo')) {
            return "I am a Data Analyst and AI Developer who builds intelligent applications that understand and generate language..."; // Add full answer
        }
        if (q.includes('story')) {
            return "My journey began with a foundation in engineering, which gave me a rigorous, analytical mindset..."; // Add full answer
        }
        if (q.includes('technical skills')) {
            return "My core stack is Next.js, React, TypeScript, and Python. I specialize in Natural Language Processing (NLP)..."; // Add full answer
        }
        if (q.includes('soft skills')) {
            return "My approach is built on three pillars: Collaborative Problem-Solving, Adaptability, and Resilience..."; // Add full answer
        }
        if (q.includes('sleep')) {
            return "Based on mock data from his Whoop sensor, my average sleep last week was 7 hours and 15 minutes..."; // Add full answer
        }
        if (q.includes('before tech')) {
            return "I began my career as a petroleum engineer... While pursuing my Master's degree in NYC, I worked in hospitality..."; // Add full answer
        }
        return "That's a great question! I'm programmed with specific info about Camilo's professional life. Try asking about his skills, story, or past experience.";
    };

    const handleSendMessage = (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        // Add user message to the chat
        const userMessage: Message = { id: Date.now(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);

        setIsBotTyping(true);

        // Simulate bot thinking and get a response
        setTimeout(() => {
            const botResponseText = getBotResponse(input);
            const botMessage: Message = { id: Date.now() + 1, text: botResponseText, sender: 'bot' };
            setMessages(prev => [...prev, botMessage]);
            setIsBotTyping(false);
        }, 1200); // 1.2 second delay

        setInput(''); // Clear the input field
    };

    return (
        <div className="border border-gray-700 rounded-lg max-w-3xl mx-auto">
            <div className="h-[30rem] overflow-y-auto p-4 space-y-4">
                {/* Initial bot message */}
                <div className="flex justify-start">
                    <div className="bg-gray-800 rounded-lg p-3 max-w-xs">
                        <p className="text-sm">Hello! I'm an interactive AI assistant. Ask me about Camilo's skills, story, or background.</p>
                    </div>
                </div>
                {/* Render all messages */}
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`${msg.sender === 'user' ? 'bg-cyan-600' : 'bg-gray-800'} rounded-lg p-3 max-w-md`}>
                            <p className="text-sm">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isBotTyping && (
                    <div className="flex justify-start">
                        <div className="bg-gray-800 rounded-lg p-3 max-w-xs">
                            <p className="text-sm">...</p>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 flex">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-grow bg-gray-800 text-white rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button type="submit" className="bg-cyan-600 text-white font-bold px-4 rounded-r-lg hover:bg-cyan-500 transition-colors">
                    Send
                </button>
            </form>
        </div>
    );
}
