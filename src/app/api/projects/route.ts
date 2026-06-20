import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { validateSession, getTokenFromRequest } from '@/lib/auth';

// 获取项目列表
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
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.project.count({ where }),
    ]);

    // 获取状态统计
    const statusStats = await prisma.project.groupBy({
      by: ['status'],
      where: { userId: session.user.id },
      _count: { id: true },
    });

    return NextResponse.json({
      projects,
      total,
      page,
      pageSize,
      statusStats: statusStats.map((s) => ({
        name: s.status || 'draft',
        count: s._count.id,
      })),
    });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { error: '获取项目列表失败' },
      { status: 500 }
    );
  }
}

// 创建项目
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

    const { name, description, metadata } = await request.json();

    if (!name) {
      return NextResponse.json({ error: '项目名称不能为空' }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        name,
        description: description || '',
        status: 'draft',
        metadata: JSON.stringify(metadata || {}),
      },
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: '创建项目失败' },
      { status: 500 }
    );
  }
}

// 更新项目
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

    const { id, name, description, status, metadata } = await request.json();

    if (!id) {
      return NextResponse.json({ error: '缺少项目ID' }, { status: 400 });
    }

    const project = await prisma.project.updateMany({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        name,
        description,
        status,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json(
      { error: '更新项目失败' },
      { status: 500 }
    );
  }
}

// 删除项目
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
      return NextResponse.json({ error: '缺少项目ID' }, { status: 400 });
    }

    await prisma.project.deleteMany({
      where: {
        id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { error: '删除项目失败' },
      { status: 500 }
    );
  }
}
