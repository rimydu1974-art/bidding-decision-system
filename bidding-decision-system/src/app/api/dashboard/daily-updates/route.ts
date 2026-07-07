import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7', 10);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const [regulations, cases, articles] = await Promise.all([
      prisma.regulation.findMany({
        where: {
          createdAt: { gte: since },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          region: true,
          category: true,
          createdAt: true,
        },
      }),
      prisma.case.findMany({
        where: {
          status: 'published',
          isPublic: true,
          createdAt: { gte: since },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          source: true,
          industry: true,
          createdAt: true,
        },
      }),
      prisma.thinkTankArticle.findMany({
        where: {
          isPublished: true,
          createdAt: { gte: since },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          category: true,
          slug: true,
          createdAt: true,
        },
      }),
    ]);

    const updates = [
      ...regulations.map((r) => ({
        type: 'regulation' as const,
        id: r.id,
        title: r.title,
        subtitle: `${r.region} - ${r.category}`,
        createdAt: r.createdAt,
      })),
      ...cases.map((c) => ({
        type: 'case' as const,
        id: c.id,
        title: c.title,
        subtitle: c.industry || c.source,
        createdAt: c.createdAt,
      })),
      ...articles.map((a) => ({
        type: 'article' as const,
        id: a.id,
        title: a.title,
        subtitle: a.category,
        slug: a.slug,
        createdAt: a.createdAt,
      })),
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      updates,
      totals: {
        regulations: regulations.length,
        cases: cases.length,
        articles: articles.length,
      },
    });
  } catch (error) {
    console.error('Get daily updates error:', error);
    return NextResponse.json(
      { error: '获取每日动态失败' },
      { status: 500 }
    );
  }
}
