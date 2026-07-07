import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const ACTIONS = ['register', 'upload', 'analyze', 'view_result', 'click_pay', 'pay_success'];

interface StepCount { step: string; count: number }

export async function GET(request: NextRequest) {
  const result = await requireAdmin(request);
  if (result instanceof NextResponse) return result;

  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const groupBy = searchParams.get('groupBy') || 'total';

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    let steps: StepCount[];

    if (groupBy === 'day') {
      steps = await getDailyFunnel(startDate);
    } else if (groupBy === 'week') {
      steps = await getWeeklyFunnel(startDate);
    } else {
      steps = await getTotalFunnel(startDate);
    }

    const totalUsers = await prisma.user.count({
      where: { createdAt: { gte: startDate } },
    });

    const dropoff = steps.slice(0, -1).map((step, i) => {
      const next = steps[i + 1];
      const lost = step.count - next.count;
      const rate = step.count > 0 ? (lost / step.count) * 100 : 0;
      return {
        from: ACTIONS[i],
        to: ACTIONS[i + 1],
        lost,
        rate: Math.round(rate * 10) / 10,
      };
    });

    return NextResponse.json({ steps, dropoff, totalUsers, days });
  } catch (error) {
    console.error('[Admin Behavior] Error:', error);
    return NextResponse.json({ error: '获取行为数据失败' }, { status: 500 });
  }
}

async function getTotalFunnel(startDate: Date): Promise<StepCount[]> {
  const counts = await Promise.all(
    ACTIONS.map(async (action) => {
      const count = await prisma.userBehavior.count({
        where: { action, createdAt: { gte: startDate } },
      });
      return { step: action, count };
    })
  );
  return counts;
}

async function getDailyFunnel(startDate: Date): Promise<StepCount[]> {
  const behaviors = await prisma.userBehavior.findMany({
    where: { createdAt: { gte: startDate } },
    select: { action: true, createdAt: true },
  });

  const dayMap = new Map<string, Record<string, number>>();

  for (const b of behaviors) {
    const day = b.createdAt.toISOString().split('T')[0];
    if (!dayMap.has(day)) {
      dayMap.set(day, {});
    }
    const dayData = dayMap.get(day)!;
    dayData[b.action] = (dayData[b.action] || 0) + 1;
  }

  const days = Array.from(dayMap.keys()).sort();
  if (days.length === 0) return ACTIONS.map(a => ({ step: a, count: 0 }));

  const latest = days[days.length - 1];
  const latestData = dayMap.get(latest)!;

  return ACTIONS.map(a => ({
    step: a,
    count: latestData[a] || 0,
  }));
}

async function getWeeklyFunnel(startDate: Date): Promise<StepCount[]> {
  const behaviors = await prisma.userBehavior.findMany({
    where: { createdAt: { gte: startDate } },
    select: { action: true, createdAt: true },
  });

  const weekMap = new Map<string, Record<string, number>>();

  for (const b of behaviors) {
    const date = b.createdAt;
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const week = weekStart.toISOString().split('T')[0];

    if (!weekMap.has(week)) {
      weekMap.set(week, {});
    }
    const weekData = weekMap.get(week)!;
    weekData[b.action] = (weekData[b.action] || 0) + 1;
  }

  const weeks = Array.from(weekMap.keys()).sort();
  if (weeks.length === 0) return ACTIONS.map(a => ({ step: a, count: 0 }));

  const latest = weeks[weeks.length - 1];
  const latestData = weekMap.get(latest)!;

  return ACTIONS.map(a => ({
    step: a,
    count: latestData[a] || 0,
  }));
}
