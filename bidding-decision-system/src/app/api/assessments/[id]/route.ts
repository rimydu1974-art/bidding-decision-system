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

    // Parse JSON string fields stored in DB
    const jsonFields = ['aiResult', 'basicInfo', 'risks', 'tasks', 'scoringRules', 'qualificationReqs', 'technicalResponse', 'riskAggregation'] as const;
    const parsed: Record<string, unknown> = { ...assessment };
    for (const field of jsonFields) {
      const val = (assessment as Record<string, unknown>)[field];
      if (typeof val === 'string') {
        try { parsed[field] = JSON.parse(val); } catch { /* keep as string */ }
      }
    }

    // 添加 userDecision 字段
    parsed.userDecision = assessment.userDecision;

    return NextResponse.json({ assessment: parsed });
  } catch (error) {
    console.error('Get assessment error:', error);
    return NextResponse.json(
      { error: '获取评估记录失败' },
      { status: 500 }
    );
  }
}
