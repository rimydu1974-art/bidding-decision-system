import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import { trackBehavior } from '@/lib/behavior';
import { refreshUserProfile } from '@/lib/user-profile';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const session = await validateSession(token);
    if (!session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { decision } = body;

    // 验证决策值
    if (!decision || !['bid', 'no-bid', 'abstain'].includes(decision)) {
      return NextResponse.json(
        { error: '无效的决策值，必须是 bid/no-bid/abstain' },
        { status: 400 }
      );
    }

    // 查找评估记录
    const assessment = await prisma.assessment.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: '未找到评估记录' }, { status: 404 });
    }

    // 更新决策
    await prisma.assessment.update({
      where: { id },
      data: {
        userDecision: decision,
        userDecisionAt: new Date(),
      },
    });

    // 追踪行为
    trackBehavior({
      userId: session.user.id,
      action: 'record_decision',
      projectId: assessment.id,
      metadata: { decision, projectName: assessment.projectName },
    });

    // 异步刷新用户画像
    refreshUserProfile(session.user.id).catch(err => {
      console.error('[Decision] 刷新用户画像失败:', err);
    });

    return NextResponse.json({ success: true, decision });
  } catch (error) {
    console.error('Record decision error:', error);
    return NextResponse.json(
      { error: '记录决策失败' },
      { status: 500 }
    );
  }
}
