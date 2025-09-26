import { NextRequest, NextResponse } from 'next/server';
import { updateQueryFeedback } from '@/lib/db/query-history';
import { getErrorMessage } from '@/lib/utils/errors';

export async function POST(req: NextRequest) {
  try {
    const { queryId, feedback } = await req.json();

    if (typeof queryId !== 'number' || Number.isNaN(queryId) || queryId <= 0) {
      return NextResponse.json({ error: 'queryId must be a positive number.' }, { status: 400 });
    }

    if (![ -1, 0, 1 ].includes(feedback)) {
      return NextResponse.json({ error: 'feedback must be -1, 0, or 1.' }, { status: 400 });
    }

    await updateQueryFeedback({ id: queryId, feedback });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[AI Query Feedback Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
