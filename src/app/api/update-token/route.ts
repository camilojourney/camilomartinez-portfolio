import { NextResponse } from 'next/server';
import { auth } from '../../../lib/auth';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

export async function POST() {
    try {
        // Get the current session with potentially refreshed token
        const session = await auth();

        if (!session?.accessToken) {
            return NextResponse.json({
                error: 'Not authenticated or no access token available',
                suggestion: 'Sign in to WHOOP first'
            }, { status: 401 });
        }

        // Read current .env.local
        const envPath = join(process.cwd(), '.env.local');
        let envContent = readFileSync(envPath, 'utf8');

        // Update or add the WHOOP_ACCESS_TOKEN
        const tokenLine = `WHOOP_ACCESS_TOKEN=${session.accessToken}`;

        if (envContent.includes('WHOOP_ACCESS_TOKEN=')) {
            // Replace existing token
            envContent = envContent.replace(/WHOOP_ACCESS_TOKEN=.*/g, tokenLine);
        } else {
            // Add new token
            envContent += `\n${tokenLine}`;
        }

        // Write back to file
        writeFileSync(envPath, envContent);

        return NextResponse.json({
            success: true,
            message: 'Environment token updated successfully',
            tokenExpires: session.expires,
            user: session.user?.name,
            lastUpdated: new Date().toISOString()
        });

    } catch (error) {
        console.error('Token update error:', error);
        return NextResponse.json({
            error: 'Failed to update token',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
