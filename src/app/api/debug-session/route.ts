import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireAdminAccess } from '@/lib/security/route-auth';

export async function GET(request: Request) {
    try {
        const access = await requireAdminAccess(request, {
            secrets: [process.env.CRON_SECRET],
            allowQuerySecret: false,
        });
        if (access.response) {
            return access.response;
        }

        const session = await auth();
        
        return NextResponse.json({
            success: true,
            hasSession: !!session,
            user: session?.user ? {
                id: session.user.id,
                name: session.user.name,
                email: session.user.email
            } : null,
            sessionType: typeof session,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
}
