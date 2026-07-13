/**
 * Chat Feedback & Self-Improvement System
 *
 * This module implements a self-improving chatbot using:
 * 1. User feedback collection (thumbs up/down)
 * 2. Conversation logging for offline RL training
 * 3. Quality metrics tracking
 * 4. Answer evaluation
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface ConversationLog {
  id: string;
  messages: ChatMessage[];
  feedback?: {
    rating: 'positive' | 'negative';
    comment?: string;
    timestamp: string;
  };
  metadata: {
    sessionId: string;
    userAgent?: string;
    createdAt: string;
    responseTime?: number;
  };
}

export interface FeedbackData {
  conversationId: string;
  messageIndex: number;
  rating: 'positive' | 'negative';
  comment?: string;
  expectedAnswer?: string; // What the user expected
}

/**
 * Log conversation for future analysis and RL training
 */
export async function logConversation(log: ConversationLog): Promise<void> {
  try {
    // In production, this would send to your analytics/database
    // For now, we'll use a simple API endpoint
    await fetch('/api/chat/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
  } catch (error) {
    console.error('Failed to log conversation:', error);
    // Don't throw - logging failures shouldn't break the chat
  }
}

/**
 * Submit user feedback on a specific response
 */
export async function submitFeedback(feedback: FeedbackData): Promise<void> {
  try {
    await fetch('/api/chat/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback),
    });
  } catch (error) {
    console.error('Failed to submit feedback:', error);
  }
}

/**
 * Generate a unique session ID for tracking conversations
 */
export function generateSessionId(): string {
  const entropy = Math.random().toString(36).slice(2, 11).padEnd(9, '0');

  return `session_${Date.now()}_${entropy}`;
}

/**
 * Evaluate answer quality using another LLM call (self-evaluation)
 * This can be used for automated quality scoring
 */
export async function evaluateAnswer(
  question: string,
  answer: string,
  context: string
): Promise<{
  score: number; // 0-1
  reasoning: string;
  suggestions?: string[];
}> {
  try {
    const response = await fetch('/api/chat/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, answer, context }),
    });

    if (!response.ok) {
      throw new Error('Evaluation failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to evaluate answer:', error);
    return {
      score: 0.5, // Default neutral score
      reasoning: 'Evaluation unavailable',
    };
  }
}
