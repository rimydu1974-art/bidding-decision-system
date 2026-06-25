// 支付服务模块
// 支持微信支付、支付宝
// 需要在.env.local中配置商户号和证书

export interface PaymentConfig {
  provider: 'wechat' | 'alipay' | 'mock';
  // 微信支付
  wechatMchId?: string;
  wechatApiKey?: string;
  wechatAppId?: string;
  wechatCertPath?: string;
  wechatKeyPath?: string;
  // 支付宝
  alipayAppId?: string;
  alipayPrivateKey?: string;
  alipayPublicKey?: string;
  alipayCertPath?: string;
  alipayRootCertPath?: string;
}

export interface OrderInfo {
  orderNo: string;
  amount: number; // 单位：分
  description: string;
  userId: string;
  notifyUrl: string;
}

export interface PaymentResult {
  success: boolean;
  payUrl?: string; // 支付链接
  qrCode?: string; // 二维码
  prepayId?: string; // 预支付ID
  error?: string;
}

export interface PaymentNotification {
  orderNo: string;
  transactionId: string;
  status: 'success' | 'failed' | 'refunded';
  amount: number;
  paymentMethod: 'wechat' | 'alipay';
  paidAt: Date;
}

// 获取支付配置
export function getPaymentConfig(): PaymentConfig {
  return {
    provider: (process.env.PAYMENT_PROVIDER as PaymentConfig['provider']) || 'mock',
    wechatMchId: process.env.WECHAT_MCH_ID,
    wechatApiKey: process.env.WECHAT_API_KEY,
    wechatAppId: process.env.WECHAT_APP_ID,
    wechatCertPath: process.env.WECHAT_CERT_PATH,
    wechatKeyPath: process.env.WECHAT_KEY_PATH,
    alipayAppId: process.env.ALIPAY_APP_ID,
    alipayPrivateKey: process.env.ALIPAY_PRIVATE_KEY,
    alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY,
    alipayCertPath: process.env.ALIPAY_CERT_PATH,
    alipayRootCertPath: process.env.ALIPAY_ROOT_CERT_PATH,
  };
}

// 创建支付订单
export async function createPaymentOrder(order: OrderInfo): Promise<PaymentResult> {
  const config = getPaymentConfig();
  
  switch (config.provider) {
    case 'wechat':
      return createWechatOrder(order, config);
    case 'alipay':
      return createAlipayOrder(order, config);
    case 'mock':
    default:
      return createMockOrder(order);
  }
}

// Mock支付 (开发测试用)
async function createMockOrder(order: OrderInfo): Promise<PaymentResult> {
  console.log(`[Payment-Mock] 创建订单: ${order.orderNo}, 金额: ${order.amount}`);
  return { 
    success: true, 
    payUrl: `/payment/success?orderNo=${order.orderNo}`,
    prepayId: `mock-${Date.now()}`
  };
}

// 微信支付
async function createWechatOrder(order: OrderInfo, config: PaymentConfig): Promise<PaymentResult> {
  if (!config.wechatMchId || !config.wechatApiKey) {
    return { success: false, error: '微信支付配置缺失' };
  }

  try {
    // TODO: 实现微信支付API调用
    // 需要安装 wechatpay-node-v3 或自行实现签名
    // 参考文档: https://pay.weixin.qq.com/wiki/doc/apiv3/apis/chapter3_1_1.shtml
    
    console.log(`[Payment-Wechat] 创建订单: ${order.orderNo}`);
    
    // 模拟返回预支付ID
    return { 
      success: true, 
      prepayId: `wx-${Date.now()}`,
      qrCode: `weixin://wxpay/bizpayurl?mock=true&out_trade_no=${order.orderNo}`
    };
  } catch (error) {
    console.error('[Payment-Wechat] 创建订单失败:', error);
    return { success: false, error: '微信支付创建订单失败' };
  }
}

// 支付宝
async function createAlipayOrder(order: OrderInfo, config: PaymentConfig): Promise<PaymentResult> {
  if (!config.alipayAppId || !config.alipayPrivateKey) {
    return { success: false, error: '支付宝配置缺失' };
  }

  try {
    // TODO: 实现支付宝API调用
    // 需要安装 alipay-sdk
    // 参考文档: https://opendocs.alipay.com/open/270/105899
    
    console.log(`[Payment-Alipay] 创建订单: ${order.orderNo}`);
    
    // 模拟返回支付链接
    return { 
      success: true, 
      payUrl: `https://openapi.alipay.com/gateway.do?mock=true&out_trade_no=${order.orderNo}`
    };
  } catch (error) {
    console.error('[Payment-Alipay] 创建订单失败:', error);
    return { success: false, error: '支付宝创建订单失败' };
  }
}

// 验证支付通知签名
export async function verifyPaymentNotification(
  notification: Record<string, unknown>,
  paymentMethod: 'wechat' | 'alipay'
): Promise<boolean> {
  const config = getPaymentConfig();
  
  // TODO: 实现签名验证
  // 微信支付: 使用API密钥验证签名
  // 支付宝: 使用支付宝公钥验证签名
  
  console.log(`[Payment] 验证${paymentMethod}通知签名`);
  
  // 暂时返回true，实际需要实现签名验证
  return true;
}

// 查询订单状态
export async function queryOrderStatus(orderNo: string): Promise<'pending' | 'paid' | 'failed'> {
  const config = getPaymentConfig();
  
  switch (config.provider) {
    case 'wechat':
      return queryWechatOrderStatus(orderNo, config);
    case 'alipay':
      return queryAlipayOrderStatus(orderNo, config);
    case 'mock':
    default:
      return 'pending';
  }
}

// 查询微信订单状态
async function queryWechatOrderStatus(orderNo: string, config: PaymentConfig): Promise<'pending' | 'paid' | 'failed'> {
  // TODO: 实现微信订单查询
  console.log(`[Payment-Wechat] 查询订单状态: ${orderNo}`);
  return 'pending';
}

// 查询支付宝订单状态
async function queryAlipayOrderStatus(orderNo: string, config: PaymentConfig): Promise<'pending' | 'paid' | 'failed'> {
  // TODO: 实现支付宝订单查询
  console.log(`[Payment-Alipay] 查询订单状态: ${orderNo}`);
  return 'pending';
}

// 退款
export async function refundOrder(orderNo: string, amount: number): Promise<PaymentResult> {
  const config = getPaymentConfig();
  
  switch (config.provider) {
    case 'wechat':
      return refundWechatOrder(orderNo, amount, config);
    case 'alipay':
      return refundAlipayOrder(orderNo, amount, config);
    case 'mock':
    default:
      console.log(`[Payment-Mock] 退款: ${orderNo}, 金额: ${amount}`);
      return { success: true };
  }
}

// 微信退款
async function refundWechatOrder(orderNo: string, amount: number, config: PaymentConfig): Promise<PaymentResult> {
  // TODO: 实现微信退款API
  console.log(`[Payment-Wechat] 退款: ${orderNo}, 金额: ${amount}`);
  return { success: true };
}

// 支付宝退款
async function refundAlipayOrder(orderNo: string, amount: number, config: PaymentConfig): Promise<PaymentResult> {
  // TODO: 实现支付宝退款API
  console.log(`[Payment-Alipay] 退款: ${orderNo}, 金额: ${amount}`);
  return { success: true };
}
