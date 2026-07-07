import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const VALID_REASONS = ['太贵', '分析价值不够', '先试试', '已有工具', '公司流程', '其他'];

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

    const { reason, content, page } = await request.json();

    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: '无效的反馈原因' }, { status: 400 });
    }

    await prisma.userFeedback.create({
      data: {
        userId: session.user.id,
        reason,
        content: content || null,
        page: page || 'unknown',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Feedback] Error:', error);
    return NextResponse.json({ error: '提交反馈失败' }, { status: 500 });
  }
}
