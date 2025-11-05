import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Collect user feedback for RL training
 *
 * Feedback types:
 * - Positive/Negative ratings (RLHF - Reinforcement Learning from Human Feedback)
 * - Expected answers (for fine-tuning dataset)
 * - Quality scores (for evaluation metrics)
 */
export async function POST(req: Request) {
  try {
    const feedback = await req.json();

    const enrichedFeedback = {
      ...feedback,
      timestamp: new Date().toISOString(),
      source: 'user_feedback',
    };

    // In development, append to feedback log
    if (process.env.NODE_ENV === 'development') {
      const feedbackFile = path.join(process.cwd(), '.chat-logs', 'feedback.jsonl');

      try {
        await fs.mkdir(path.dirname(feedbackFile), { recursive: true });
        await fs.appendFile(
          feedbackFile,
          JSON.stringify(enrichedFeedback) + '\n'
        );
      } catch (error) {
        console.error('Failed to write feedback:', error);
      }
    }

    // In production, store in database for RL training
    // await prisma.chatFeedback.create({ data: enrichedFeedback });

    // Track metrics
    console.log('Feedback received:', {
      conversationId: feedback.conversationId,
      rating: feedback.rating,
      hasComment: !!feedback.comment,
    });

    // TODO: Trigger retraining pipeline when threshold reached
    // if (await shouldRetrain()) {
    //   await triggerRLTraining();
    // }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to process feedback:', error);
    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    );
  }
}
