import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import { trackBehavior, BehaviorAction } from '@/lib/behavior';

export const dynamic = 'force-dynamic';

const VALID_ACTIONS: BehaviorAction[] = [
  'register', 'login', 'upload', 'analyze',
  'view_result', 'click_pay', 'pay_success',
];

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const session = await validateSession(token);
    if (!session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { action, projectId, metadata } = await request.json();

    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: '无效的行为类型' }, { status: 400 });
    }

    await trackBehavior({
      userId: session.user.id,
      action,
      projectId,
      metadata,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Behavior Track] Error:', error);
    return NextResponse.json({ error: '记录行为失败' }, { status: 500 });
  }
}
