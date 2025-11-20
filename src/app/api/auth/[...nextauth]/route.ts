import { handlers } from '@/lib/auth';

// Use Node.js runtime instead of Edge to support all NextAuth features
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const { GET, POST } = handlers;
