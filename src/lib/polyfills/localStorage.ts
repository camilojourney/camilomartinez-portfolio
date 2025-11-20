// Polyfill localStorage for Next.js SSR
// This prevents the SecurityError when next-auth tries to access localStorage during SSR

if (typeof window === 'undefined') {
    // We're on the server - create a dummy localStorage
    global.localStorage = {
        getItem: () => null,
        setItem: () => { },
        removeItem: () => { },
        clear: () => { },
        key: () => null,
        length: 0,
    } as Storage;
}

export { };
