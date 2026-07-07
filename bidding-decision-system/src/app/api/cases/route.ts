import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const where: Record<string, unknown> = {
      status: 'published',
      isPublic: true,
    };

    if (source) where.source = source;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { summary: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.case.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          source: true,
          industry: true,
          summary: true,
          expertComment: true,
          tags: true,
          views: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.case.count({ where }),
    ]);

    return NextResponse.json({
      items: items.map((item) => ({
        ...item,
        tags: JSON.parse(item.tags),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Get cases error:', error);
    return NextResponse.json(
      { error: '获取案例列表失败' },
      { status: 500 }
    );
  }
}
