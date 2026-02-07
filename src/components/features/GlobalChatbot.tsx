"use client";

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Chatbot } from '@/components/features/Chatbot';

export function GlobalChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Auto-open after a delay on first visit
  useEffect(() => {
    // Set isMounted to true to indicate we're on the client
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only access localStorage after component is mounted on client
    if (!isMounted || typeof window === 'undefined') return undefined;

    try {
      const hasSeenChatbot = localStorage.getItem('hasSeenChatbot');
      if (!hasSeenChatbot) {
        const timer = setTimeout(() => {
          setIsOpen(true);
          localStorage.setItem('hasSeenChatbot', 'true');
        }, 3000);
        return () => clearTimeout(timer);
      }
    } catch (error) {
      // localStorage might be disabled or unavailable
      console.warn('localStorage is not available:', error);
    }
    return undefined;
  }, [isMounted]);

  const toggleChatbot = () => {
    if (isOpen && !isMinimized) {
      setIsMinimized(true);
    } else if (isOpen && isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  const closeChatbot = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <motion.div
          className="fixed bottom-6 right-6 z-50"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 2, duration: 0.5, type: "spring" }}
        >
          <button
            onClick={toggleChatbot}
            className="group relative w-16 h-16 rounded-full liquid-glass-button overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
              backdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-blue-500/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Ripple effect */}
            <div className="absolute inset-0 rounded-full bg-white/10 scale-0 group-active:scale-100 transition-transform duration-200" />

            {/* AI Icon */}
            <div className="relative z-10 flex items-center justify-center w-full h-full">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            {/* Pulse effect */}
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/50 animate-ping" />
          </button>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg"
          >
            <span className="text-xs font-bold text-white">AI</span>
          </motion.div>
        </motion.div>
      )}

      {/* Chatbot Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{
              opacity: 1,
              scale: isMinimized ? 0.3 : 1,
              y: isMinimized ? 200 : 0,
              x: isMinimized ? 200 : 0
            }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed z-40 ${isMinimized
              ? 'bottom-24 right-24 w-32 h-20'
              : 'bottom-6 right-6 w-96 h-[600px] md:w-[450px] md:h-[650px]'
              }`}
          >
            <div
              className="w-full h-full rounded-2xl liquid-glass-panel overflow-hidden shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.95))',
                backdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              {!isMinimized && (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">AI Assistant</h3>
                        <p className="text-xs text-gray-400">Ask about fitness data & projects</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setIsMinimized(true)}
                        className="w-8 h-8 rounded-full liquid-glass-button-small flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <button
                        onClick={closeChatbot}
                        className="w-8 h-8 rounded-full liquid-glass-button-small flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Chatbot Content */}
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Chatbot />
                  </div>
                </>
              )}

              {isMinimized && (
                <div
                  className="w-full h-full flex items-center justify-center cursor-pointer"
                  onClick={() => setIsMinimized(false)}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center mb-1">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-xs text-white font-medium">AI Chat</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom styles */}
      <style jsx global>{`
        .liquid-glass-button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .liquid-glass-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3);
        }

        .liquid-glass-button:active {
          transform: translateY(0px);
        }

        .liquid-glass-button-small {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .liquid-glass-button-small:hover {
          background: rgba(255,255,255,0.1) !important;
          transform: scale(1.1);
        }

        .liquid-glass-panel {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </>
  );
}
