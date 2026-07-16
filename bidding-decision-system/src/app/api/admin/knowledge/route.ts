import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// 获取知识库列表（管理员 - 所有用户）
export async function GET(request: NextRequest) {
  try {
    const result = await requireAdmin(request);
    if (result instanceof NextResponse) {
      return result;
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const source = searchParams.get('source');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const where: Record<string, unknown> = {};

    if (category && category !== 'all') {
      where.category = category;
    }

    if (source && source !== 'all') {
      where.source = source;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.knowledgeItem.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          category: true,
          subcategory: true,
          content: true,
          tags: true,
          fileType: true,
          fileName: true,
          source: true,
          usageCount: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      prisma.knowledgeItem.count({ where }),
    ]);

    // 获取分类统计
    const categories = await prisma.knowledgeItem.groupBy({
      by: ['category'],
      _count: { id: true },
    });

    // 获取来源统计
    const sources = await prisma.knowledgeItem.groupBy({
      by: ['source'],
      _count: { id: true },
    });

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      categories: categories.map((c) => ({
        name: c.category,
        count: c._count.id,
      })),
      sources: sources.map((s) => ({
        name: s.source || 'manual',
        count: s._count.id,
      })),
    });
  } catch (error) {
    console.error('Get knowledge error:', error);
    return NextResponse.json(
      { error: '获取知识库失败' },
      { status: 500 }
    );
  }
}

// 删除知识库条目（管理员）
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

    await prisma.knowledgeItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete knowledge error:', error);
    return NextResponse.json(
      { error: '删除知识库条目失败' },
      { status: 500 }
    );
  }
}
