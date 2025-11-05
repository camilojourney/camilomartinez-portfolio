import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Log conversations for offline RL training and analysis
 *
 * In production, this would write to:
 * - PostgreSQL database with conversation history
 * - S3/Cloud Storage for training dataset
 * - Analytics platform (Mixpanel, Amplitude)
 *
 * For now, we'll write to local JSON files (in dev) or just console.log (in prod)
 */
export async function POST(req: Request) {
  try {
    const log = await req.json();

    // Add server timestamp
    const enrichedLog = {
      ...log,
      serverTimestamp: new Date().toISOString(),
    };

    // In development, write to local file
    if (process.env.NODE_ENV === 'development') {
      const logsDir = path.join(process.cwd(), '.chat-logs');

      try {
        await fs.mkdir(logsDir, { recursive: true });
        const logFile = path.join(logsDir, `${log.id}.json`);
        await fs.writeFile(logFile, JSON.stringify(enrichedLog, null, 2));
      } catch (error) {
        console.error('Failed to write log file:', error);
      }
    }

    // In production, send to your database/analytics
    // await prisma.conversationLog.create({ data: enrichedLog });
    // await analytics.track('chat_conversation', enrichedLog);

    console.log('Chat conversation logged:', {
      id: log.id,
      messageCount: log.messages?.length || 0,
      hasFeedback: !!log.feedback,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to log conversation:', error);
    return NextResponse.json(
      { error: 'Failed to log conversation' },
      { status: 500 }
    );
  }
}
