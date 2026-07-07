import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const result = await requireAdmin(request);
    if (result instanceof NextResponse) {
      return result;
    }

    const rules = await prisma.ruleConfig.findMany({
      orderBy: { category: 'asc' },
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Get rules error:', error);
    return NextResponse.json({ error: '获取规则失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await requireAdmin(request);
    if (result instanceof NextResponse) {
      return result;
    }

    const body = await request.json();
    const { category, name, keywords, patterns, isActive } = body;

    if (!category || !name) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    const rule = await prisma.ruleConfig.create({
      data: {
        category,
        name,
        keywords: JSON.stringify(keywords || []),
        patterns: JSON.stringify(patterns || []),
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Create rule error:', error);
    return NextResponse.json({ error: '创建规则失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const result = await requireAdmin(request);
    if (result instanceof NextResponse) {
      return result;
    }

    const body = await request.json();
    const { id, category, name, keywords, patterns, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: '缺少规则ID' }, { status: 400 });
    }

    const rule = await prisma.ruleConfig.update({
      where: { id },
      data: {
        ...(category && { category }),
        ...(name && { name }),
        ...(keywords !== undefined && { keywords: JSON.stringify(keywords) }),
        ...(patterns !== undefined && { patterns: JSON.stringify(patterns) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Update rule error:', error);
    return NextResponse.json({ error: '更新规则失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const result = await requireAdmin(request);
    if (result instanceof NextResponse) {
      return result;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少规则ID' }, { status: 400 });
    }

    await prisma.ruleConfig.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete rule error:', error);
    return NextResponse.json({ error: '删除规则失败' }, { status: 500 });
  }
}
