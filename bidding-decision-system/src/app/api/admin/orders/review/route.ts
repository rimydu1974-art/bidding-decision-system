import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import { trackBehavior } from '@/lib/behavior';

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const session = await validateSession(token);
    if (!session) {
      return NextResponse.json({ error: '登录已过期' }, { status: 401 });
    }

    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean);
    const isAdmin = session.user.role === 'admin' || adminEmails.includes(session.user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: '无管理员权限' }, { status: 403 });
    }

    const { orderId, action, note } = await req.json();

    if (!orderId || !action) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 查询 Order 表（与 submit API 一致）
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    // 更新订单状态
    const newStatus = action === 'approve' ? 'paid' : 'failed';
    const reviewedAt = new Date();

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: newStatus,
        paidAt: action === 'approve' ? reviewedAt : null,
      },
    });

    if (action === 'approve') {
      // 查找用户
      const payUser = await prisma.user.findUnique({
        where: { id: order.userId },
      });

      if (!payUser) {
        return NextResponse.json({ error: '用户不存在' }, { status: 404 });
      }

      if (order.planName === 'single') {
        // 单次购买：创建 ProjectUnlock 记录，不改变用户全局 plan
        if (order.projectId) {
          await prisma.projectUnlock.create({
            data: {
              userId: payUser.id,
              projectId: order.projectId,
              amount: order.amount,
            },
          });
        }
      } else {
        // pro/enterprise：更新用户 plan + planExpiresAt
        const durationDays = order.planName === 'pro-year' ? 365 : 30;
        await prisma.user.update({
          where: { id: payUser.id },
          data: {
            plan: order.planName,
            planExpiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
            lastPaymentAt: new Date(),
          },
        });
      }

      // 记录行为
      trackBehavior({
        userId: payUser.id,
        action: 'pay_success',
        metadata: { planName: order.planName, amount: order.amount },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Review error:', error);
    return NextResponse.json({ error: '审核失败' }, { status: 500 });
  }
}
