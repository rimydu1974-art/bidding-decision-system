import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const where: Record<string, unknown> = {
      isPublished: true,
    };

    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { summary: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.thinkTankArticle.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          summary: true,
          tags: true,
          coverImage: true,
          views: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.thinkTankArticle.count({ where }),
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
    console.error('Get thinktank articles error:', error);
    return NextResponse.json(
      { error: '获取智库文章列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, title, category, summary, content, tags } = body;

    if (!slug || !title || !category || !content) {
      return NextResponse.json({ error: 'slug, title, category, content required' }, { status: 400 });
    }

    const article = await prisma.thinkTankArticle.create({
      data: {
        slug,
        title,
        category,
        summary: summary || '',
        content,
        tags: JSON.stringify(tags || []),
        isPublished: true,
      },
    });

    return NextResponse.json({ ok: true, slug: article.slug }, { status: 201 });
  } catch (error) {
    console.error('Create thinktank article error:', error);
    return NextResponse.json({ error: '创建文章失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, content, title, summary, category } = body;

    if (!slug) {
      return NextResponse.json({ error: 'slug required' }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (content !== undefined) data.content = content;
    if (title !== undefined) data.title = title;
    if (summary !== undefined) data.summary = summary;
    if (category !== undefined) data.category = category;

    const article = await prisma.thinkTankArticle.update({
      where: { slug },
      data,
    });

    return NextResponse.json({ ok: true, slug: article.slug });
  } catch (error) {
    console.error('Update thinktank article error:', error);
    return NextResponse.json({ error: '更新文章失败' }, { status: 500 });
  }
}
