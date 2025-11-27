// Server-only auth utilities
// This file should only be imported in server components/actions

import 'server-only'

// Lazy import auth to prevent NextAuth initialization issues during dev
export async function getServerAuth() {
    const { auth } = await import('./auth')
    return auth()
}

// Note: Session type is available via:
// import type { Session } from 'next-auth'
// But we don't re-export it here to avoid triggering module loading
