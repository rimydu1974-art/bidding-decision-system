import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: 获取系统配置
export async function GET(request: NextRequest) {
  const result = await requireAdmin(request);
  if (result instanceof NextResponse) return result;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where = category ? { category } : {};
    const settings = await prisma.systemSetting.findMany({ where });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('[Admin Settings] Error:', error);
    return NextResponse.json({ error: '获取配置失败' }, { status: 500 });
  }
}

// POST: 更新系统配置
export async function POST(request: NextRequest) {
  const result = await requireAdmin(request);
  if (result instanceof NextResponse) return result;

  try {
    const { key, value, category } = await request.json();

    if (!key || value === undefined) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    await prisma.systemSetting.upsert({
      where: { key },
      update: { value, category: category || 'general' },
      create: { key, value, category: category || 'general' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin Settings] Error:', error);
    return NextResponse.json({ error: '更新配置失败' }, { status: 500 });
  }
}
