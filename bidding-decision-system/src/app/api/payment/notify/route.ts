import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { orderNo } = await req.json();

    if (!orderNo) {
      return NextResponse.json({ error: '缺少订单号' }, { status: 400 });
    }

    // Get order details
    const order = await prisma.paymentOrder.findUnique({
      where: { orderNo },
    });

    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    // Create notification record
    await prisma.adminNotification.create({
      data: {
        type: 'PAYMENT_SCREENSHOT',
        title: '收到支付截图',
        content: `订单号：${order.orderNo}\n用户：${order.userEmail}\n金额：¥${order.amount}\n套餐：${order.planName}`,
        orderId: order.id,
        isRead: false,
      },
    });

    // Try to send WeChat notification
    try {
      const { sendPaymentNotification } = await import('@/lib/wechat/notify');
      await sendPaymentNotification({
        orderNo: order.orderNo,
        userEmail: order.userEmail,
        amount: order.amount,
        planName: order.planName,
        paymentMethod: order.paymentMethod || 'unknown',
      });
    } catch (wechatError) {
      console.warn('WeChat notification failed, but order was created:', wechatError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json({ error: '通知失败' }, { status: 500 });
  }
}
