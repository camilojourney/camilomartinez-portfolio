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
        <div className="liquid-glass-chat-container max-w-full mx-auto">
            <div className="h-[32rem] overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {/* Initial bot message */}
                <div className="flex justify-start">
                    <div className="liquid-glass-message backdrop-blur-lg bg-white/[0.08] border border-white/[0.12] rounded-2xl p-4 max-w-sm shadow-lg">
                        <p className="text-sm text-white/90 leading-relaxed">Hello! I'm an interactive AI assistant. Ask me about Camilo's skills, story, or background.</p>
                    </div>
                </div>
                {/* Render all messages */}
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`${msg.sender === 'user'
                                ? 'liquid-glass-user-message backdrop-blur-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30'
                                : 'liquid-glass-bot-message backdrop-blur-lg bg-white/[0.08] border border-white/[0.12]'
                            } rounded-2xl p-4 max-w-md shadow-lg`}>
                            <p className="text-sm text-white/90 leading-relaxed">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isBotTyping && (
                    <div className="flex justify-start">
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
            </div>
            <form onSubmit={handleSendMessage} className="p-6 border-t border-white/[0.08] flex gap-3">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-grow liquid-glass-input backdrop-blur-lg bg-white/[0.05] border border-white/[0.12] text-white placeholder-white/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400/50 transition-all duration-300"
                />
                <button
                    type="submit"
                    className="liquid-glass-send-btn backdrop-blur-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-white font-medium px-6 py-3 rounded-xl hover:from-cyan-400/30 hover:to-blue-400/30 hover:border-cyan-300/50 transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                >
                    Send
                </button>
            </form>
        </div>
    );
}
