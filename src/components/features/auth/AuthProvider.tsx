'use client';

import { ReactNode, useState, useEffect } from 'react';

interface AuthProviderProps {
    children: ReactNode;
    suppressHydrationWarning?: boolean;
}

export default function AuthProvider({ children, suppressHydrationWarning }: AuthProviderProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [SessionProvider, setSessionProvider] = useState<any>(null);

    useEffect(() => {
        setIsMounted(true);

        // Only import SessionProvider on the client side
        if (typeof window !== 'undefined') {
            import('next-auth/react').then((mod) => {
                setSessionProvider(() => mod.SessionProvider);
            });
        }
    }, []);

    // Don't render SessionProvider until we're on the client and it's loaded
    if (!isMounted || !SessionProvider) {
        return <div suppressHydrationWarning={suppressHydrationWarning}>{children}</div>;
    }

    return (
        <div suppressHydrationWarning={suppressHydrationWarning}>
            <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
                {children}
            </SessionProvider>
        </div>
    );
}
