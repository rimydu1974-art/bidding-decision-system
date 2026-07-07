import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: 获取用户列表
export async function GET(request: NextRequest) {
  const result = await requireAdmin(request);
  if (result instanceof NextResponse) return result;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const plan = searchParams.get('plan') || '';

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    if (status) where.status = status;
    if (plan) where.plan = plan;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          status: true,
          plan: true,
          planExpiresAt: true,
          aiQuotaUsed: true,
          totalAiCalls: true,
          totalOrders: true,
          totalSpent: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('[Admin Users] Error:', error);
    return NextResponse.json({ error: '获取用户列表失败' }, { status: 500 });
  }
}

// POST: 更新用户状态
export async function POST(request: NextRequest) {
  const result = await requireAdmin(request);
  if (result instanceof NextResponse) return result;

  try {
    const { userId, action, value } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    
    switch (action) {
      case 'toggleStatus':
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
        updateData.status = user?.status === 'active' ? 'disabled' : 'active';
        break;
      case 'setRole':
        updateData.role = value;
        break;
      case 'setPlan':
        updateData.plan = value;
        if (value === 'pro') {
          updateData.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        } else if (value === 'enterprise') {
          updateData.planExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        }
        break;
      case 'resetQuota':
        updateData.aiQuotaUsed = 0;
        updateData.aiQuotaResetAt = new Date();
        break;
      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }

    await prisma.user.update({ where: { id: userId }, data: updateData });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin Users] Error:', error);
    return NextResponse.json({ error: '更新用户失败' }, { status: 500 });
  }
}
