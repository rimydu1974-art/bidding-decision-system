import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: 获取仪表盘统计数据
export async function GET(request: NextRequest) {
  const result = await requireAdmin(request);
  if (result instanceof NextResponse) return result;

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 并行查询各项统计
    const [
      totalUsers,
      todayNewUsers,
      totalProjects,
      todayProjects,
      totalOrders,
      monthOrders,
      monthRevenue,
      totalAiUsage,
      monthAiUsage,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.project.count(),
      prisma.project.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: monthStart }, paymentStatus: 'paid' } }),
      prisma.order.aggregate({
        where: { createdAt: { gte: monthStart }, paymentStatus: 'paid' },
        _sum: { amount: true },
      }),
      prisma.aIUsage.aggregate({ _sum: { cost: true } }),
      prisma.aIUsage.aggregate({
        where: { createdAt: { gte: monthStart } },
        _sum: { cost: true },
      }),
    ]);

    return NextResponse.json({
      users: { total: totalUsers, today: todayNewUsers },
      projects: { total: totalProjects, today: todayProjects },
      orders: { total: totalOrders, month: monthOrders },
      revenue: { month: monthRevenue._sum.amount || 0 },
      aiCost: { 
        total: totalAiUsage._sum.cost || 0, 
        month: monthAiUsage._sum.cost || 0 
      },
    });
  } catch (error) {
    console.error('[Admin Dashboard] Error:', error);
    return NextResponse.json({ error: '获取统计数据失败' }, { status: 500 });
  }
}
