import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

const DEFAULT_ANNOUNCEMENT = {
  active: false,
  id: 'default',
  title: '',
  content: '',
};

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'announcement_active' },
    });
    if (!setting) {
      return NextResponse.json(DEFAULT_ANNOUNCEMENT);
    }
    const parsed = JSON.parse(setting.value);
    return NextResponse.json({ ...parsed, active: true });
  } catch (error) {
    console.error('[Announcement] Error:', error);
    return NextResponse.json(DEFAULT_ANNOUNCEMENT);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id, title, content, link, linkText } = await request.json();
    if (!title || !content) {
      return NextResponse.json({ error: '标题和内容不能为空' }, { status: 400 });
    }
    const value = JSON.stringify({ id: id || String(Date.now()), title, content, link: link || null, linkText: linkText || null });
    await prisma.systemSetting.upsert({
      where: { key: 'announcement_active' },
      create: { key: 'announcement_active', value, category: 'general' },
      update: { value },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Announcement] Error:', error);
    return NextResponse.json({ error: '保存公告失败' }, { status: 500 });
  }
}
