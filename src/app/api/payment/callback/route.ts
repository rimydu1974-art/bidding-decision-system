import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST: 支付宝/微信支付回调通知
export async function POST(request: NextRequest) {
  try {
    // 验证来源IP（支付平台回调IP白名单）
    const allowedIPs = (process.env.PAYMENT_CALLBACK_IPS || '').split(',').filter(Boolean);
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || request.headers.get('x-real-ip') 
      || '';
    
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      console.error('[Payment Callback] 非法来源IP:', clientIP);
      return NextResponse.json({ error: '非法来源' }, { status: 403 });
    }

    const body = await request.json();
    const { orderNo, status, transactionId, paymentMethod } = body;

    console.log('[Payment Callback] 收到支付回调:', { orderNo, status, transactionId });

    // 查询订单
    const order = await prisma.order.findFirst({
      where: { orderNo },
    });

    if (!order) {
      console.error('[Payment Callback] 订单不存在:', orderNo);
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    // 如果订单已处理，直接返回成功
    if (order.paymentStatus === 'paid') {
      return NextResponse.json({ success: true });
    }

    // 更新订单状态
    if (status === 'success' || status === 'paid') {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'paid',
          paidAt: new Date(),
        },
      });

      // 根据订单类型更新用户订阅
      const planName = order.planName;
      const now = new Date();

      if (planName === 'single') {
        // 单次购买：7天临时权限
        await prisma.user.update({
          where: { id: order.userId },
          data: {
            tempExpiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      } else if (planName === 'pro' || planName === 'pro-year') {
        // 专业版：1个月或1年
        const duration = planName === 'pro-year' ? 365 : 30;
        const expiresAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);

        await prisma.user.update({
          where: { id: order.userId },
          data: {
            plan: 'pro',
            planExpiresAt: expiresAt,
          },
        });
      } else if (planName === 'enterprise') {
        // 企业版：1个月
        await prisma.user.update({
          where: { id: order.userId },
          data: {
            plan: 'enterprise',
            planExpiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

      console.log('[Payment Callback] 订单支付成功:', orderNo);
    } else if (status === 'failed') {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'failed' },
      });
      console.log('[Payment Callback] 订单支付失败:', orderNo);
    } else if (status === 'refunded') {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'refunded' },
      });
      console.log('[Payment Callback] 订单已退款:', orderNo);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Payment Callback] 处理回调失败:', error);
    return NextResponse.json({ error: '处理失败' }, { status: 500 });
  }
}
