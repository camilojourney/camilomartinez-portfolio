// This file runs BEFORE any other code in Next.js (both server and edge)
// We use it to polyfill localStorage for SSR to prevent NextAuth errors

// Polyfill IMMEDIATELY at module load time (before async register)
if (typeof window === 'undefined') {
    const storage: Storage = {
        getItem: () => null,
        setItem: () => { },
        removeItem: () => { },
        clear: () => { },
        key: () => null,
        length: 0,
    };

    // Try all possible global objects
    try {
        if (typeof global !== 'undefined') {
            (global as any).localStorage = storage;
        }
    } catch (e) { /* ignore */ }

    try {
        if (typeof globalThis !== 'undefined') {
            (globalThis as any).localStorage = storage;
        }
    } catch (e) { /* ignore */ }
}

export async function register() {
    // Polyfill localStorage on server-side environments
    if (typeof window === 'undefined') {
        const storage = {
            getItem: () => null,
            setItem: () => { },
            removeItem: () => { },
            clear: () => { },
            key: () => null,
            length: 0,
        };

        // Node.js runtime
        if (typeof global !== 'undefined' && !('localStorage' in global)) {
            (global as any).localStorage = storage;
        }

        // Edge runtime uses globalThis
        if (typeof globalThis !== 'undefined' && !('localStorage' in globalThis)) {
            (globalThis as any).localStorage = storage;
        }
    }
}
