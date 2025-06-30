'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import Image from 'next/image';

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
            return "I am a Data Analyst and AI Developer who builds intelligent applications that understand and generate language. With a Master's degree in Data Analytics and a specialty in NLP, I develop solutions ranging from automated content creation to personalized AI coaching. My philosophy is simple: data, used correctly, empowers us to achieve more."; // Add full answer
        }
        if (q.includes('story')) {
            return "My journey began with a foundation in engineering, which gave me a rigorous, analytical mindset. This drive led me to New York City to pursue a Master of Science in Data Analytics from Baruch College. Now, I'm channeling that background into my true passion: building the next generation of AI applications. Outside of tech, I'm a dedicated athlete, finding that the discipline from running and the gym directly translates to the focus needed to solve complex coding challenges."; // Add full answer
        }
        if (q.includes('technical skills')) {
            return "My core stack is Next.js, React, TypeScript, and Python. I specialize in Natural Language Processing (NLP) and have hands-on experience with deploying to cloud platforms like Vercel and AWS. I am proficient in SQL and passionate about data infrastructure, believing that clean, well-engineered data is the foundation of any great AI model."; // Add full answer
        }
        if (q.includes('soft skills')) {
            return "My approach is built on three pillars: • Collaborative Problem-Solving: I believe the best ideas come from teamwork, debate, and a shared commitment to the goal. • Adaptability: My background has taught me to thrive in dynamic environments and quickly learn new technologies. • Resilience & Positive Energy: I see challenges as opportunities and bring an optimistic, high-energy approach that can be contagious."; // Add full answer
        }
        if (q.includes('sleep')) {
            return "Based on mock data from his Whoop sensor, my average sleep last week was 7 hours and 15 minutes, consistent with my quarterly average. I track sleep performance as a key metric for optimal cognitive output.";
        }
        if (q.includes('before tech')) {
            return " I began my career as a petroleum engineer, building a strong analytical foundation. While pursuing my Master's degree in NYC, I worked in hospitality, an experience that gave me a deep, real-world understanding of user empathy, user experience, and real-time problem-solving—skills that are now invaluable in how I design intuitive apps."; // Add full answer
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
        <div className="liquid-glass-chat-container w-full flex flex-col h-[36rem]">
            {/* Messages Area - with improved glass overlay */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent relative">
                {/* Glass overlay gradient at top */}
                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none z-10"></div>
                
                {/* Initial bot message with avatar */}
                <div className="flex items-start gap-3 justify-start animate-fade-in">
                    <Image
                        src="/bot.png"
                        alt="Camilo's avatar"
                        width={40}
                        height={40}
                        className="rounded-full border-2 border-cyan-400/30 shadow-lg flex-shrink-0 ring-2 ring-cyan-400/10"
                    />
                    <div className="liquid-glass-message backdrop-blur-lg bg-white/[0.08] border border-white/[0.12] rounded-2xl p-4 max-w-sm shadow-lg">
                        <p className="text-sm text-white/90 leading-relaxed">Hello! I'm an interactive AI assistant. Ask me about Camilo's skills, story, or background.</p>
                    </div>
                </div>
                {/* Render all messages */}
                {messages.map((msg, index) => (
                    <div
                        key={msg.id}
                        className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-message-appear`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        {msg.sender === 'bot' && (
                            <Image
                                src="/bot.png"
                                alt="Camilo's avatar"
                                width={40}
                                height={40}
                                className="rounded-full border-2 border-cyan-400/30 shadow-lg flex-shrink-0 ring-2 ring-cyan-400/10"
                            />
                        )}
                        <div className={`${msg.sender === 'user'
                                ? 'liquid-glass-user-message backdrop-blur-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30'
                                : 'liquid-glass-bot-message backdrop-blur-lg bg-white/[0.08] border border-white/[0.12]'
                            } rounded-2xl p-4 max-w-md shadow-lg transform transition-all duration-300 hover:scale-[1.02]`}>
                            <p className="text-sm text-white/90 leading-relaxed">{msg.text}</p>
                        </div>
                        {msg.sender === 'user' && (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border-2 border-cyan-400/30 flex items-center justify-center shadow-lg flex-shrink-0 ring-2 ring-cyan-400/10">
                                <svg className="w-5 h-5 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                            </div>
                        )}
                    </div>
                ))}
                {isBotTyping && (
                    <div className="flex items-start gap-3 justify-start animate-fade-in">
                        <Image
                            src="/bot.png"
                            alt="Camilo's avatar"
                            width={40}
                            height={40}
                            className="rounded-full border-2 border-cyan-400/30 shadow-lg flex-shrink-0 ring-2 ring-cyan-400/10"
                        />
                        <div className="liquid-glass-typing backdrop-blur-lg bg-white/[0.08] border border-white/[0.12] rounded-2xl p-4 max-w-sm shadow-lg">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce animation-delay-200"></div>
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce animation-delay-400"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
                
                {/* Glass overlay gradient at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/[0.03] to-transparent pointer-events-none z-10"></div>
            </div>

            {/* Enhanced Larger Input Bar */}
            <div className="liquid-glass-input-container-large backdrop-blur-xl bg-white/[0.03] border-t border-white/[0.08] p-8">
                <form onSubmit={handleSendMessage} className="w-full">
                    <div className="relative flex items-center gap-6">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything about Camilo..."
                            className="flex-1 liquid-glass-input-enhanced backdrop-blur-lg bg-white/[0.05] border border-white/[0.12] text-white placeholder-white/50 rounded-3xl px-10 py-6 text-xl font-light focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all duration-300 shadow-lg"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className="liquid-glass-send-enhanced backdrop-blur-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-cyan-300 p-6 rounded-3xl hover:from-cyan-400/30 hover:to-blue-400/30 hover:border-cyan-300/50 hover:text-cyan-200 transition-all duration-300 transform hover:scale-[1.05] shadow-lg group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {/* Custom Paper Plane Icon */}
                            <svg
                                className="w-7 h-7 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                                />
                            </svg>
                        </button>
                    </div>
                </form>

                {/* Suggested Questions */}
                <div className="mt-8 pt-6 border-t border-white/[0.08]">
                    <p className="text-base text-white/60 mb-4 font-medium">💡 Try asking:</p>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => {
                                setInput('What are his technical skills?');
                                // Auto-submit after a brief delay for better UX
                                setTimeout(() => {
                                    const form = document.querySelector('form');
                                    if (form) form.requestSubmit();
                                }, 100);
                            }}
                            className="liquid-glass-suggestion-btn backdrop-blur-lg bg-white/[0.04] border border-white/[0.08] text-white/80 px-5 py-3 rounded-xl text-sm font-medium hover:bg-white/[0.08] hover:border-white/[0.12] hover:text-white transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                        >
                            🛠️ Skills?
                        </button>
                        <button
                            onClick={() => {
                                setInput('Tell me about Camilo story');
                                setTimeout(() => {
                                    const form = document.querySelector('form');
                                    if (form) form.requestSubmit();
                                }, 100);
                            }}
                            className="liquid-glass-suggestion-btn backdrop-blur-lg bg-white/[0.04] border border-white/[0.08] text-white/80 px-5 py-3 rounded-xl text-sm font-medium hover:bg-white/[0.08] hover:border-white/[0.12] hover:text-white transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                        >
                            📖 His Story?
                        </button>
                        <button
                            onClick={() => {
                                setInput('What did he do before tech?');
                                setTimeout(() => {
                                    const form = document.querySelector('form');
                                    if (form) form.requestSubmit();
                                }, 100);
                            }}
                            className="liquid-glass-suggestion-btn backdrop-blur-lg bg-white/[0.04] border border-white/[0.08] text-white/80 px-5 py-3 rounded-xl text-sm font-medium hover:bg-white/[0.08] hover:border-white/[0.12] hover:text-white transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                        >
                            🔄 Past Experience?
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
