import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

interface CustomerScore {
  userId: string;
  email: string;
  name: string | null;
  plan: string;
  totalSpent: number;
  totalAiCalls: number;
  projectCount: number;
  loginCount: number;
  score: number;
  level: string;
}

function calculateScore(loginCount: number, projectCount: number, totalSpent: number): number {
  const loginScore = Math.min(loginCount * 5, 30);
  const projectScore = Math.min(projectCount * 10, 40);
  const spendScore = Math.min(totalSpent * 0.5, 30);
  return Math.round(loginScore + projectScore + spendScore);
}

function getLevel(score: number): string {
  if (score >= 80) return '钻石';
  if (score >= 60) return '金牌';
  if (score >= 40) return '银牌';
  if (score >= 20) return '铜牌';
  return '普通';
}

export async function GET(request: NextRequest) {
  const result = await requireAdmin(request);
  if (result instanceof NextResponse) return result;

  try {
    const users = await prisma.user.findMany({
      where: { totalSpent: { gt: 0 } },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        totalSpent: true,
        totalAiCalls: true,
        lastLoginAt: true,
      },
      orderBy: { totalSpent: 'desc' },
    });

    const userIds = users.map(u => u.id);

    const [projectCounts, loginCounts] = await Promise.all([
      prisma.project.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds } },
        _count: { id: true },
      }),
      prisma.userBehavior.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds }, action: 'login' },
        _count: { id: true },
      }),
    ]);

    const projectMap = new Map(projectCounts.map(p => [p.userId, p._count.id]));
    const loginMap = new Map(loginCounts.map(l => [l.userId, l._count.id]));

    const customers: CustomerScore[] = users.map(u => {
      const loginCount = loginMap.get(u.id) || 0;
      const projectCount = projectMap.get(u.id) || 0;
      const score = calculateScore(loginCount, projectCount, u.totalSpent);

      return {
        userId: u.id,
        email: u.email,
        name: u.name,
        plan: u.plan,
        totalSpent: u.totalSpent,
        totalAiCalls: u.totalAiCalls,
        projectCount,
        loginCount,
        score,
        level: getLevel(score),
      };
    });

    customers.sort((a, b) => b.score - a.score);

    return NextResponse.json({ customers });
  } catch (error) {
    console.error('[Admin Customers] Error:', error);
    return NextResponse.json({ error: '获取高价值客户失败' }, { status: 500 });
  }
}
