'use client'; // Error components must be Client components

import { useEffect } from 'react';
import Link from 'next/link';
import PageShell from '@/components/shared/page-shell';

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
        <PageShell currentPage="apps" maxWidth="narrow">
            <div className="rise-in max-w-lg" role="alert">
                <p className="status status-danger">Dashboard error</p>
                <h1 className="display mt-4">Something went wrong</h1>
                <p className="body-muted mt-6">
                    {error.message || 'There was an error loading your dashboard data.'}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                    <button onClick={() => reset()} className="btn-primary">
                        Try again
                    </button>
                    <Link href="/" className="btn-secondary">
                        Return home
                    </Link>
                </div>
                {error.digest && <p className="caption mt-8 font-mono text-xs">Error ID: {error.digest}</p>}
            </div>
        </PageShell>
    );
}
