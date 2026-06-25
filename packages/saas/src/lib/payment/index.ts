// 支付服务模块
// 支持微信支付、支付宝
// 实际接入需要商户账号和证书

export interface PaymentConfig {
  merchantId: string;
  apiKey: string;
  notifyUrl: string;
}

export interface OrderInfo {
  orderNo: string;
  amount: number; // 单位：分
  description: string;
  userId: string;
}

export interface PaymentResult {
  success: boolean;
  payUrl?: string; // 支付链接
  qrCode?: string; // 二维码
  error?: string;
}

// 支付宝支付（模拟实现，实际需要接入支付宝SDK）
export async function createAlipayOrder(
  order: OrderInfo,
  config?: PaymentConfig
): Promise<PaymentResult> {
  console.log('[Payment] 创建支付宝订单:', order.orderNo);

  // 实际接入时，这里需要调用支付宝API
  // 1. 生成签名
  // 2. 调用alipay.trade.page.pay接口
  // 3. 返回支付页面URL

  // 模拟返回支付链接
  const payUrl = `https://openapi.alipay.com/gateway.do?mock=true&out_trade_no=${order.orderNo}&total_amount=${order.amount / 100}`;

  return {
    success: true,
    payUrl,
  };
}

// 微信支付（模拟实现，实际需要接入微信支付SDK）
export async function createWechatPayOrder(
  order: OrderInfo,
  config?: PaymentConfig
): Promise<PaymentResult> {
  console.log('[Payment] 创建微信支付订单:', order.orderNo);

  // 实际接入时，这里需要调用微信支付API
  // 1. 调用统一下单接口
  // 2. 生成支付二维码
  // 3. 返回二维码链接

  // 模拟返回二维码
  const qrCode = `weixin://wxpay/bizpayurl?mock=true&out_trade_no=${order.orderNo}`;

  return {
    success: true,
    qrCode,
  };
}

// 查询订单状态
export async function queryOrderStatus(orderNo: string): Promise<'pending' | 'paid' | 'failed'> {
  console.log('[Payment] 查询订单状态:', orderNo);

  // 实际接入时，这里需要调用支付平台查询接口
  // 模拟返回
  return 'pending';
}

// 退款（企业版大额订单可能需要）
export async function refundOrder(orderNo: string, amount: number): Promise<PaymentResult> {
  console.log('[Payment] 退款:', orderNo, amount);

  // 实际接入时，这里需要调用退款接口
  return { success: true };
}
