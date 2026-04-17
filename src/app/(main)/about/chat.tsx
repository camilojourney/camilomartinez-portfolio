'use client';

import { useState, FormEvent, useEffect, useRef } from 'react';
import Image from 'next/image';
import { aiService } from '@/lib/api/config';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
}

interface AIQueryResponse {
    status: string;
    data?: {
        response?: string;
        answer?: string;
        history_id?: number;
    };
    message?: string;
}

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isBotTyping, setIsBotTyping] = useState(false);
    const [useAIService, setUseAIService] = useState(true);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const [animatingMessageIds, setAnimatingMessageIds] = useState<Set<number>>(new Set());

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const getBotResponse = (question: string): string => {
        const q = question.toLowerCase().trim();
        if (q.includes('about camilo') || q.includes('who is camilo')) {
            return "I am a Data Analyst and AI Developer who builds intelligent applications that understand and generate language. With a Master's degree in Data Analytics and a specialty in NLP, I develop solutions ranging from automated content creation to personalized AI coaching. My philosophy is simple: data, used correctly, empowers us to achieve more.";
        }
        if (q.includes('story')) {
            return "My journey began with a foundation in engineering, which gave me a rigorous, analytical mindset. This drive led me to New York City to pursue a Master of Science in Data Analytics from Baruch College. Now, I'm channeling that background into my true passion: building the next generation of AI applications. Outside of tech, I'm a dedicated athlete, finding that the discipline from running and the gym directly translates to the focus needed to solve complex coding challenges.";
        }
        if (q.includes('technical skills')) {
            return "My core stack is Next.js, React, TypeScript, and Python. I specialize in Natural Language Processing (NLP) and have hands-on experience with deploying to cloud platforms like Vercel and AWS. I am proficient in SQL and passionate about data infrastructure, believing that clean, well-engineered data is the foundation of any great AI model.";
        }
        if (q.includes('soft skills')) {
            return "My approach is built on three pillars: Collaborative Problem-Solving (best ideas come from teamwork and debate), Adaptability (my background taught me to thrive in dynamic environments), and Resilience (I see challenges as opportunities and bring high-energy to everything I do).";
        }
        if (q.includes('sleep')) {
            return "Based on mock data from his Whoop sensor, my average sleep last week was 7 hours and 15 minutes, consistent with my quarterly average. I track sleep performance as a key metric for optimal cognitive output.";
        }
        if (q.includes('before tech')) {
            return "I began my career as a petroleum engineer, building a strong analytical foundation. While pursuing my Master's degree in NYC, I worked in hospitality, an experience that gave me a deep, real-world understanding of user empathy, user experience, and real-time problem-solving -- skills that are now invaluable in how I design intuitive apps.";
        }
        return "That is a great question! I am programmed with specific info about Camilo's professional life. Try asking about his skills, story, or past experience.";
    };

    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const question = input.trim();
        const userMessage: Message = { id: Date.now(), text: question, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);

        setAnimatingMessageIds(prev => {
            const newSet = new Set(prev);
            newSet.add(userMessage.id);
            return newSet;
        });

        setTimeout(() => {
            setAnimatingMessageIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(userMessage.id);
                return newSet;
            });
        }, 500);

        setInput('');
        setIsBotTyping(true);

        try {
            let botResponseText: string;

            if (useAIService) {
                const response = await aiService.query(question, true, 30) as AIQueryResponse;
                botResponseText = response.data?.response || response.data?.answer || 'I received your question but could not generate a proper response.';
            } else {
                botResponseText = getBotResponse(question);
            }

            setTimeout(() => {
                const botMessage: Message = { id: Date.now() + 1, text: botResponseText, sender: 'bot' };
                setMessages(prev => [...prev, botMessage]);

                setAnimatingMessageIds(prev => {
                    const newSet = new Set(prev);
                    newSet.add(botMessage.id);
                    return newSet;
                });

                setTimeout(() => {
                    setAnimatingMessageIds(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(botMessage.id);
                        return newSet;
                    });
                }, 500);

                setIsBotTyping(false);
            }, 800);

        } catch (error) {
            console.error('AI service failed, falling back to hardcoded responses:', error);
            setUseAIService(false);
            const botResponseText = getBotResponse(question);

            setTimeout(() => {
                const botMessage: Message = { id: Date.now() + 1, text: botResponseText, sender: 'bot' };
                setMessages(prev => [...prev, botMessage]);

                setAnimatingMessageIds(prev => {
                    const newSet = new Set(prev);
                    newSet.add(botMessage.id);
                    return newSet;
                });

                setTimeout(() => {
                    setAnimatingMessageIds(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(botMessage.id);
                        return newSet;
                    });
                }, 500);

                setIsBotTyping(false);
            }, 800);
        }
    };

    const handleSuggestion = (text: string) => {
        setInput(text);
        setTimeout(() => {
            const form = document.querySelector('form');
            if (form) form.requestSubmit();
        }, 100);
    };

    return (
        <div className="w-full flex flex-col h-[32rem]">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent relative">
                {/* Fade gradient top */}
                <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-[#050810]/80 to-transparent pointer-events-none z-10"></div>

                {/* Initial bot message */}
                <div className="flex items-start gap-3 justify-start animate-fade-in">
                    <Image
                        src="/bot.png"
                        alt="Camilo's avatar"
                        width={36}
                        height={36}
                        className="rounded-full border border-white/10 flex-shrink-0"
                    />
                    <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl rounded-tl-md p-4 max-w-sm">
                        <p className="text-[14px] text-white/80 leading-relaxed">Hey! Ask me anything about Camilo -- his skills, his story, what he built, or what he is looking for.</p>
                    </div>
                </div>

                {/* Message history */}
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} ${animatingMessageIds.has(msg.id) ? 'animate-message-appear' : ''}`}
                    >
                        {msg.sender === 'bot' && (
                            <Image
                                src="/bot.png"
                                alt="Camilo's avatar"
                                width={36}
                                height={36}
                                className="rounded-full border border-white/10 flex-shrink-0"
                            />
                        )}
                        <div className={`${msg.sender === 'user'
                            ? 'bg-cyan-500/15 border border-cyan-400/20 rounded-2xl rounded-tr-md'
                            : 'bg-white/[0.06] border border-white/[0.08] rounded-2xl rounded-tl-md'
                            } p-4 max-w-md`}>
                            <p className="text-[14px] text-white/80 leading-relaxed">{msg.text}</p>
                        </div>
                        {msg.sender === 'user' && (
                            <div className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                            </div>
                        )}
                    </div>
                ))}

                {/* Typing indicator */}
                {isBotTyping && (
                    <div className="flex items-start gap-3 justify-start animate-fade-in">
                        <Image
                            src="/bot.png"
                            alt="Camilo's avatar"
                            width={36}
                            height={36}
                            className="rounded-full border border-white/10 flex-shrink-0"
                        />
                        <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl rounded-tl-md p-4">
                            <div className="flex space-x-1.5">
                                <div className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                                <div className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="border-t border-white/[0.06] p-4 md:p-5">
                <form onSubmit={handleSendMessage} className="w-full">
                    <div className="relative flex items-center gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about skills, background, projects..."
                            className="flex-1 bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/30 rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:ring-1 focus:ring-cyan-500/30 focus:border-cyan-400/30 transition-all duration-200"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className="bg-white/[0.06] border border-white/[0.10] text-white/50 p-3 rounded-xl hover:bg-white/[0.10] hover:text-white/80 hover:border-white/[0.16] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <svg
                                className="w-4.5 h-4.5"
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
                <div className="mt-3 flex flex-wrap gap-2">
                    <button
                        onClick={() => handleSuggestion('What are his technical skills?')}
                        className="text-[12px] text-white/40 border border-white/[0.06] px-3 py-1.5 rounded-lg hover:bg-white/[0.04] hover:text-white/60 hover:border-white/[0.10] transition-all duration-200"
                    >
                        Technical skills
                    </button>
                    <button
                        onClick={() => handleSuggestion('Tell me about Camilo story')}
                        className="text-[12px] text-white/40 border border-white/[0.06] px-3 py-1.5 rounded-lg hover:bg-white/[0.04] hover:text-white/60 hover:border-white/[0.10] transition-all duration-200"
                    >
                        His story
                    </button>
                    <button
                        onClick={() => handleSuggestion('What did he do before tech?')}
                        className="text-[12px] text-white/40 border border-white/[0.06] px-3 py-1.5 rounded-lg hover:bg-white/[0.04] hover:text-white/60 hover:border-white/[0.10] transition-all duration-200"
                    >
                        Before tech
                    </button>
                </div>
            </div>
        </div>
    );
}
