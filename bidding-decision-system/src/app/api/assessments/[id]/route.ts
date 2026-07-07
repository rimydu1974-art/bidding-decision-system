import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { validateSession, getTokenFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
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

    const assessment = await prisma.assessment.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: '未找到评估记录' }, { status: 404 });
    }

    return NextResponse.json({ assessment });
  } catch (error) {
    console.error('Get assessment error:', error);
    return NextResponse.json(
      { error: '获取评估记录失败' },
      { status: 500 }
    );
  }
}
