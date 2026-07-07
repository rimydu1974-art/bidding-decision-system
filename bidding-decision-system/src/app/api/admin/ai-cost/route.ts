import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: 获取AI成本统计数据
export async function GET(request: NextRequest) {
  const result = await requireAdmin(request);
  if (result instanceof NextResponse) return result;

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const days = parseInt(searchParams.get('days') || '30');

    const start = startDate ? new Date(startDate) : new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // 总统计
    const totalStats = await prisma.aIUsage.aggregate({
      where: { createdAt: { gte: start, lte: end } },
      _sum: { cost: true, totalTokens: true, promptTokens: true, completionTokens: true },
      _count: true,
    });

    // 按模型分组统计
    const byModel = await prisma.aIUsage.groupBy({
      by: ['model'],
      where: { createdAt: { gte: start, lte: end } },
      _sum: { cost: true, totalTokens: true },
      _count: true,
    });

    // 按天统计趋势
    const dailyStats = await prisma.$queryRawUnsafe(`
      SELECT 
        DATE(createdAt) as date,
        SUM(cost) as cost,
        SUM(totalTokens) as tokens,
        COUNT(*) as count
      FROM "AIUsage" 
      WHERE createdAt >= ? AND createdAt <= ?
      GROUP BY DATE(createdAt)
      ORDER BY date ASC
    `, start.toISOString(), end.toISOString());

    // 高消耗用户Top10
    const topUsers = await prisma.aIUsage.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: start, lte: end } },
      _sum: { cost: true },
      _count: true,
      orderBy: { _sum: { cost: 'desc' } },
      take: 10,
    });

    // 获取用户信息
    const topUsersWithInfo = await Promise.all(
      topUsers.map(async (u) => {
        const user = await prisma.user.findUnique({
          where: { id: u.userId },
          select: { id: true, email: true, name: true, plan: true },
        });
        return {
          ...user,
          totalCost: u._sum.cost || 0,
          totalCalls: u._count,
        };
      })
    );

    // 预警：成本超过收入的用户
    const alerts = await prisma.$queryRawUnsafe(`
      SELECT 
        u.id,
        u.email,
        u.name,
        u.plan,
        COALESCE(SUM(o.amount), 0) as totalPaid,
        COALESCE(ai.totalCost, 0) as totalCost
      FROM "User" u
      LEFT JOIN "Order" o ON o.userId = u.id AND o.paymentStatus = 'paid'
      LEFT JOIN (
        SELECT userId, SUM(cost) as totalCost 
        FROM "AIUsage" 
        WHERE createdAt >= ? AND createdAt <= ?
        GROUP BY userId
      ) ai ON ai.userId = u.id
      GROUP BY u.id
      HAVING totalCost > totalPaid AND totalCost > 0
      ORDER BY (totalCost - totalPaid) DESC
      LIMIT 20
    `, start.toISOString(), end.toISOString());

    return NextResponse.json({
      total: {
        cost: totalStats._sum.cost || 0,
        tokens: totalStats._sum.totalTokens || 0,
        promptTokens: totalStats._sum.promptTokens || 0,
        completionTokens: totalStats._sum.completionTokens || 0,
        count: totalStats._count,
      },
      byModel: byModel.map(m => ({
        model: m.model,
        cost: m._sum.cost || 0,
        tokens: m._sum.totalTokens || 0,
        count: m._count,
      })),
      daily: dailyStats,
      topUsers: topUsersWithInfo,
      alerts,
    });
  } catch (error) {
    console.error('[Admin AI Cost] Error:', error);
    return NextResponse.json({ error: '获取AI成本数据失败' }, { status: 500 });
  }
}
