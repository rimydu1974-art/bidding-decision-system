import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// 管理员邮箱列表（从环境变量读取，逗号分隔）
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'admin@example.com').split(',').map(e => e.trim());

// 检查是否是管理员
function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email);
}

// GET: 获取待审核订单列表
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

    // 检查是否是管理员
    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    // 获取订单列表
    const orders = await prisma.order.findMany({
      where: {
        paymentStatus: status,
        paymentMethod: 'manual',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // 获取用户信息
    const ordersWithUser = await Promise.all(
      orders.map(async (order) => {
        const user = await prisma.user.findUnique({
          where: { id: order.userId },
          select: { email: true, name: true },
        });
        return {
          ...order,
          user,
          metadata: JSON.parse(order.metadata as string || '{}'),
        };
      })
    );

    return NextResponse.json({ orders: ordersWithUser });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// POST: 审核订单（通过/拒绝）
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

    // 检查是否是管理员
    if (!isAdmin(session.user.email)) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const { orderId, action } = await request.json();

    if (!orderId || !action) {
      return NextResponse.json({ error: '参数错误' }, { status: 400 });
    }

    // 获取订单
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    if (order.paymentStatus !== 'pending') {
      return NextResponse.json({ error: '订单状态已变更' }, { status: 400 });
    }

    if (action === 'approve') {
      // 审核通过：更新订单状态并激活用户订阅
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'paid',
          paidAt: new Date(),
        },
      });

      // 根据订单类型更新用户订阅
      const planName = order.planName;
      const now = new Date();

      if (planName === 'single') {
        await prisma.user.update({
          where: { id: order.userId },
          data: {
            tempExpiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      } else if (planName === 'pro' || planName === 'pro-year') {
        const duration = planName === 'pro-year' ? 365 : 30;
        await prisma.user.update({
          where: { id: order.userId },
          data: {
            plan: 'pro',
            planExpiresAt: new Date(now.getTime() + duration * 24 * 60 * 60 * 1000),
          },
        });
      } else if (planName === 'enterprise') {
        await prisma.user.update({
          where: { id: order.userId },
          data: {
            plan: 'enterprise',
            planExpiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

      return NextResponse.json({ success: true, message: '审核通过，用户订阅已激活' });
    } else if (action === 'reject') {
      // 拒绝
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'failed',
        },
      });

      return NextResponse.json({ success: true, message: '已拒绝' });
    } else {
      return NextResponse.json({ error: '无效的操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('Review order error:', error);
    return NextResponse.json({ error: '审核失败' }, { status: 500 });
  }
}
