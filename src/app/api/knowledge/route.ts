import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { validateSession, getTokenFromRequest } from '@/lib/auth';

// 获取知识库列表
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const session = await validateSession(token);

    if (!session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (category && category !== '全部') {
      where.category = category;
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
      }),
      prisma.knowledgeItem.count({ where }),
    ]);

    // 获取分类统计
    const categories = await prisma.knowledgeItem.groupBy({
      by: ['category'],
      where: { userId: session.user.id },
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
    });
  } catch (error) {
    console.error('Get knowledge error:', error);
    return NextResponse.json(
      { error: '获取知识库失败' },
      { status: 500 }
    );
  }
}

// 添加知识库条目
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const session = await validateSession(token);

    if (!session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { title, category, subcategory, content, tags, fileType, fileName, fileUrl, source, sourceId } = await request.json();

    if (!title) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
    }

    const item = await prisma.knowledgeItem.create({
      data: {
        userId: session.user.id,
        title,
        category: category || '未分类',
        subcategory,
        content: content || '',
        tags: JSON.stringify(tags || []),
        fileType: fileType || 'text',
        fileName,
        fileUrl,
        source: source || 'manual',
        sourceId,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Add knowledge error:', error);
    return NextResponse.json(
      { error: '添加知识库条目失败' },
      { status: 500 }
    );
  }
}

// 更新知识库条目
export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const session = await validateSession(token);

    if (!session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { id, title, category, subcategory, content, tags } = await request.json();

    if (!id) {
      return NextResponse.json({ error: '缺少ID' }, { status: 400 });
    }

    const item = await prisma.knowledgeItem.updateMany({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        title,
        category,
        subcategory,
        content,
        tags: tags ? JSON.stringify(tags) : undefined,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Update knowledge error:', error);
    return NextResponse.json(
      { error: '更新知识库条目失败' },
      { status: 500 }
    );
  }
}

// 删除知识库条目
export async function DELETE(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const session = await validateSession(token);

    if (!session) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少ID' }, { status: 400 });
    }

    await prisma.knowledgeItem.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
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
