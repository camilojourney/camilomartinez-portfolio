'use client';

import { useEffect, useState } from 'react';
import PageShell from '@/components/shared/page-shell';
import { systemService } from '@/lib/api/config';

export default function SignInPage() {
    const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');

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

    const statusClass =
        apiStatus === 'online' ? 'status-live' : apiStatus === 'offline' ? 'status-danger' : 'status-warn';
    const statusText =
        apiStatus === 'checking'
            ? 'Checking FastAPI backend'
            : apiStatus === 'online'
                ? 'Backend reachable'
                : 'Backend offline. Sign-in still works; dashboards may be empty.';

    return (
        <PageShell currentPage="apps" maxWidth="narrow">
            <div className="rise-in max-w-md">
                <h1 className="display">Sign in</h1>
                <p className="lede mt-6">Connect your WHOOP account to access personalized data dashboards.</p>

                <button
                    type="button"
                    onClick={async () => {
                        // Dynamically import signIn to avoid SSR localStorage errors
                        const { signIn } = await import('next-auth/react');
                        signIn('whoop', { callbackUrl: '/whoop-dashboard' });
                    }}
                    className="btn-primary mt-8"
                    disabled={apiStatus === 'checking'}
                >
                    Sign in with WHOOP
                </button>

                <p className={`status ${statusClass} mt-6`} role="status">
                    {statusText}
                </p>
            </div>
        </PageShell>
    );
}
