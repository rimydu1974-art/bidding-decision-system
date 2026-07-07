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

    const projectIndustries = await prisma.project.groupBy({
      by: ['industry'],
      where: projectFilter,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const industryStats = industries.length > 0
      ? industries.map(i => ({ industry: i.industry, count: i.count }))
      : projectIndustries
          .filter(i => i.industry)
          .map(i => ({ industry: i.industry!, count: i._count.id }));

    const totalProjects = await prisma.project.count({ where: projectFilter });

    const header = '行业分类,项目数,占比';
    const rows = industryStats.map(item => {
      const pct = totalProjects > 0 ? ((item.count / totalProjects) * 100).toFixed(1) + '%' : '0%';
      return `${item.industry},${item.count},${pct}`;
    });

    const csv = '\uFEFF' + header + '\n' + rows.join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="industry_stats_${month || 'all'}_${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('[Export Industry] Error:', error);
    return NextResponse.json({ error: '导出行业数据失败' }, { status: 500 });
  }
}
