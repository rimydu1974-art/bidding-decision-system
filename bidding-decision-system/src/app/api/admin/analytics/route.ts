import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const result = await requireAdmin(request);
  if (result instanceof NextResponse) return result;

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (month) {
      const [y, m] = month.split('-').map(Number);
      startDate = new Date(y, m - 1, 1);
      endDate = new Date(y, m, 0, 23, 59, 59);
    }

    const industries = await prisma.projectIndustry.findMany({
      orderBy: { count: 'desc' },
    });

    const projectFilter: Record<string, unknown> = {};
    if (startDate && endDate) {
      projectFilter.createdAt = { gte: startDate, lte: endDate };
    }

    const industryFromProjects = await prisma.project.groupBy({
      by: ['industry'],
      where: projectFilter,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const totalProjects = await prisma.project.count({ where: projectFilter });

    const industryStats = industries.length > 0
      ? industries.map(i => ({ industry: i.industry, count: i.count }))
      : industryFromProjects
          .filter(i => i.industry)
          .map(i => ({ industry: i.industry!, count: i._count.id }));

    return NextResponse.json({
      industries: industryStats,
      totalProjects,
    });
  } catch (error) {
    console.error('[Admin Analytics] Error:', error);
    return NextResponse.json({ error: '获取行业统计失败' }, { status: 500 });
  }
}
