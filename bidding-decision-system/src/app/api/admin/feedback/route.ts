import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const result = await requireAdmin(request);
  if (result instanceof NextResponse) return result;

  try {
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get('reason') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const where: Record<string, unknown> = {};
    if (reason) where.reason = reason;

    const [feedbacks, total] = await Promise.all([
      prisma.userFeedback.findMany({
        where,
        include: { user: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.userFeedback.count({ where }),
    ]);

    return NextResponse.json({
      feedbacks: feedbacks.map(f => ({
        id: f.id,
        email: f.user.email,
        reason: f.reason,
        content: f.content,
        page: f.page,
        createdAt: f.createdAt,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('[Admin Feedback] Error:', error);
    return NextResponse.json({ error: '获取反馈列表失败' }, { status: 500 });
  }
}
