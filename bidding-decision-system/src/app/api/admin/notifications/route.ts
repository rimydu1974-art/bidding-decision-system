import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 获取通知列表
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    const where = unreadOnly ? { isRead: false } : {};

    const [notifications, unreadCount] = await Promise.all([
      prisma.adminNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.adminNotification.count({
        where: { isRead: false },
      }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: '获取通知失败' }, { status: 500 });
  }
}

// 标记已读
export async function POST(req: NextRequest) {
  try {
    const { notificationIds, markAll } = await req.json();

    if (markAll) {
      await prisma.adminNotification.updateMany({
        where: { isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
    } else if (notificationIds && notificationIds.length > 0) {
      await prisma.adminNotification.updateMany({
        where: { id: { in: notificationIds } },
        data: { isRead: true, readAt: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark notifications error:', error);
    return NextResponse.json({ error: '标记已读失败' }, { status: 500 });
  }
}
