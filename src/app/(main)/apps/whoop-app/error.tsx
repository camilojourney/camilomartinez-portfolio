'use client'; // Error components must be Client components

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to your error reporting service
        console.error('Dashboard Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Keep the same background as your main design */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/30 animate-gradient-xy"></div>
                <div className="absolute top-0 left-0 w-full h-full opacity-20">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
                </div>
            </div>

            <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
                <div className="text-center space-y-8 max-w-2xl mx-auto">
                    {/* Error Icon */}
                    <div className="mx-auto w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-8">
                        <svg 
                            className="w-12 h-12 text-red-400" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={1.5} 
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                            />
                        </svg>
                    </div>

                    {/* Error Message */}
                    <div className="space-y-6">
                        <h1 className="text-3xl md:text-4xl font-bold text-white">
                            Something went wrong!
                        </h1>
                        <p className="text-lg text-white/70">
                            {error.message || 'There was an error loading your dashboard data.'}
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                        <button
                            onClick={() => reset()}
                            className="px-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 rounded-full text-cyan-300 transition-all duration-300"
                        >
                            Try again
                        </button>
                        <Link
                            href="/"
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/70 transition-all duration-300"
                        >
                            Return Home
                        </Link>
                    </div>

                    {/* Technical Details (only if we have them) */}
                    {error.digest && (
                        <div className="mt-8 text-sm text-white/40">
                            <p>Error ID: {error.digest}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
