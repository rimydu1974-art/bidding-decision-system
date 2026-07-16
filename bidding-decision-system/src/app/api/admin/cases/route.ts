import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// 获取招标案例列表（管理员）
export async function GET(request: NextRequest) {
  try {
    const result = await requireAdmin(request);
    if (result instanceof NextResponse) {
      return result;
    }

    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const where: Record<string, unknown> = {};

    if (industry && industry !== 'all') {
      where.industry = industry;
    }

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
          content: true,
          summary: true,
          status: true,
          isPublic: true,
          expertComment: true,
          tags: true,
          views: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.case.count({ where }),
    ]);

    // 获取行业统计
    const industries = await prisma.case.groupBy({
      by: ['industry'],
      _count: { id: true },
    });

    // 获取来源统计
    const sources = await prisma.case.groupBy({
      by: ['source'],
      _count: { id: true },
    });

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      industries: industries.map((i) => ({
        name: i.industry || '未分类',
        count: i._count.id,
      })),
      sources: sources.map((s) => ({
        name: s.source,
        count: s._count.id,
      })),
    });
  } catch (error) {
    console.error('Get cases error:', error);
    return NextResponse.json(
      { error: '获取招标案例失败' },
      { status: 500 }
    );
  }
}

// 删除招标案例（管理员）
export async function DELETE(request: NextRequest) {
  try {
    const result = await requireAdmin(request);
    if (result instanceof NextResponse) {
      return result;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少ID' }, { status: 400 });
    }

    await prisma.case.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete case error:', error);
    return NextResponse.json(
      { error: '删除招标案例失败' },
      { status: 500 }
    );
  }
}
