import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import prisma from '@/lib/db';
import { sendPaymentNotification, sendPaymentNotificationByWebhook } from '@/lib/wechat/notify';
import { PLANS } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

// POST: 提交支付凭证
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

    const { planId, projectId, payerName, transactionId, screenshot, note } = await request.json();

    if (!planId) {
      return NextResponse.json({ error: '请选择订阅方案' }, { status: 400 });
    }

    if (!payerName) {
      return NextResponse.json({ error: '请填写付款人姓名' }, { status: 400 });
    }

    // 从代码常量获取定价方案（不依赖数据库）
    const planConfig = PLANS[planId as keyof typeof PLANS];
    if (!planConfig) {
      return NextResponse.json({ error: '无效的订阅方案' }, { status: 400 });
    }

    // 生成订单号
    const orderNo = `ORD${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // 保存订单到数据库（状态为pending，等待管理员审核）
    const order = await prisma.order.create({
      data: {
        orderNo,
        userId: session.user.id,
        planName: planId,
        projectId: projectId || null,
        amount: planConfig.price,
        paymentStatus: 'pending', // 等待审核
        paymentMethod: 'manual', // 手动转账
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
        metadata: JSON.stringify({
          payerName,
          transactionId: transactionId || '',
          screenshot: screenshot || '',
          note: note || '',
          submittedAt: new Date().toISOString(),
        }),
      },
    });

    // 发送微信通知给管理员（异步，不阻塞响应）
    const notifyData = {
      orderNo: order.orderNo,
      userEmail: session.user.email,
      amount: planConfig.price,
      planName: planConfig.displayName,
      paymentMethod: 'manual',
    };
    sendPaymentNotification(notifyData).catch(() => {});
    sendPaymentNotificationByWebhook(notifyData).catch(() => {});

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNo: order.orderNo,
        amount: order.amount,
        planName: planConfig.displayName,
        status: order.paymentStatus,
      },
      message: '支付凭证已提交，等待管理员审核',
    });
  } catch (error) {
    console.error('Submit payment error:', error);
    return NextResponse.json(
      { error: '提交失败' },
      { status: 500 }
    );
  }
}
