import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { requestMatchesAnySecret } from '@/lib/security/route-auth';

/**
 * Daily Batch Evaluation Cron Job
 *
 * Runs: Daily at 2 AM UTC
 * Purpose: Evaluate all unevaluated conversations from the past 24h
 *
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/evaluate-chats",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET must be configured' }, { status: 500 });
  }

  if (!requestMatchesAnySecret(req, [cronSecret], { allowQuerySecret: false })) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await evaluateRecentConversations();

    return NextResponse.json({
      success: true,
      evaluated: results.evaluated,
      averageScore: results.averageScore,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Evaluation batch failed:', error);
    return NextResponse.json(
      { error: 'Evaluation failed' },
      { status: 500 }
    );
  }
}

async function evaluateRecentConversations() {
  // In production, query database for unevaluated conversations
  // For dev, read from .chat-logs/

  if (process.env.NODE_ENV === 'development') {
    const logsDir = path.join(process.cwd(), '.chat-logs');

    try {
      const files = await fs.readdir(logsDir);
      const jsonFiles = files.filter((f) => f.endsWith('.json'));

      let evaluated = 0;
      let totalScore = 0;

      for (const file of jsonFiles.slice(0, 10)) {
        // Limit to 10 per run in dev
        const logPath = path.join(logsDir, file);
        const content = await fs.readFile(logPath, 'utf-8');
        const log = JSON.parse(content);

        // Skip if already evaluated
        if (log.evaluation) continue;

        // Evaluate conversation
        // const score = await evaluateConversation(log);
        // log.evaluation = { score, timestamp: new Date().toISOString() };

        // await fs.writeFile(logPath, JSON.stringify(log, null, 2));

        evaluated++;
        totalScore += 0.8; // Mock score for now
      }

      return {
        evaluated,
        averageScore: evaluated > 0 ? totalScore / evaluated : 0,
      };
    } catch (error) {
      console.error('Failed to read logs:', error);
      return { evaluated: 0, averageScore: 0 };
    }
  }

  // Production: Query database
  // const unevaluatedChats = await prisma.conversationLog.findMany({
  //   where: {
  //     evaluation: null,
  //     createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  //   },
  //   take: 100
  // });
  //
  // for (const chat of unevaluatedChats) {
  //   const score = await evaluateConversation(chat);
  //   await prisma.chatEvaluation.create({ data: { ...score, chatId: chat.id } });
  // }

  return { evaluated: 0, averageScore: 0 };
}
