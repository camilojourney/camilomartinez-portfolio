'use client';

import { useEffect, useState } from 'react';
import LiquidPage from '@/components/shared/liquid-page';
import { systemService } from '@/lib/api/config';

export default function SignInPage() {
    const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

    // Dynamically import signIn to avoid SSR localStorage errors
    const handleSignIn = async () => {
        const { signIn } = await import('next-auth/react');
        await signIn('whoop');
    };

    useEffect(() => {
        let isMounted = true;

        const checkBackend = async () => {
            try {
                await systemService.healthCheck();
                if (isMounted) {
                    setApiStatus('online');
                }
            } catch (error) {
                console.error('Unable to reach backend health endpoint:', error);
                if (isMounted) {
                    setApiStatus('offline');
                }
            }
        };

        checkBackend();
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <LiquidPage currentPage="apps" backgroundVariant="cool">
            <div className="text-center space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Sign In</h1>
                    <p className="text-muted-foreground">
                        Connect your WHOOP account to access personalized data dashboards.
                    </p>
                </div>

                <button
                    onClick={async () => {
                        const { signIn } = await import('next-auth/react');
                        signIn('whoop', { callbackUrl: '/whoop-dashboard' });
                    }}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-foreground font-semibold py-3 px-6 rounded-full transition duration-200 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={apiStatus === 'checking'}
                >
                    Sign in with WHOOP
                </button>

                <p className="text-sm text-muted-foreground">
                    API status:{' '}
                    <span className={
                        apiStatus === 'online'
                            ? 'text-emerald-300'
                            : apiStatus === 'offline'
                                ? 'text-rose-300'
                                : 'text-amber-300'
                    }>
                        {apiStatus === 'checking' ? 'Checking FastAPI backend…' : apiStatus === 'online' ? 'Backend reachable' : 'Backend offline'}
                    </span>
                </p>
            </div>
        </LiquidPage>
    );
}
