import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const result = await requireAdmin(request);
    if (result instanceof NextResponse) {
      return result;
    }

    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry');

    const where = industry ? { industry } : {};
    const rules = await prisma.industryRule.findMany({
      where,
      orderBy: { category: 'asc' },
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Get industry rules error:', error);
    return NextResponse.json({ error: '获取行业规则失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await requireAdmin(request);
    if (result instanceof NextResponse) {
      return result;
    }

    const body = await request.json();
    const { category, title, content, industry, isActive } = body;

    if (!category || !title || !content) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    const rule = await prisma.industryRule.create({
      data: {
        category,
        title,
        content,
        industry: industry || null,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Create industry rule error:', error);
    return NextResponse.json({ error: '创建行业规则失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const result = await requireAdmin(request);
    if (result instanceof NextResponse) {
      return result;
    }

    const body = await request.json();
    const { id, category, title, content, industry, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: '缺少规则ID' }, { status: 400 });
    }

    const rule = await prisma.industryRule.update({
      where: { id },
      data: {
        ...(category && { category }),
        ...(title && { title }),
        ...(content && { content }),
        ...(industry !== undefined && { industry }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Update industry rule error:', error);
    return NextResponse.json({ error: '更新行业规则失败' }, { status: 500 });
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

    await prisma.industryRule.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete industry rule error:', error);
    return NextResponse.json({ error: '删除行业规则失败' }, { status: 500 });
  }
}
