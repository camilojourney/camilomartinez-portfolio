'use client';

import { signIn } from 'next-auth/react';

export default function SignInPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-white mb-4">Sign In</h1>
                <button
                    onClick={() => signIn('whoop', { callbackUrl: '/whoop-dashboard' })}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded transition duration-200"
                >
                    Sign in with WHOOP
                </button>
            </div>
        </div>
    );
}
