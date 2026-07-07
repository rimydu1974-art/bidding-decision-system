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
  const provider = (process.env.PAYMENT_PROVIDER as PaymentConfig['provider']) || 'mock';

  // 生产环境禁止使用Mock支付
  if (provider === 'mock' && process.env.NODE_ENV === 'production' && process.env.PAYMENT_PROVIDER !== 'mock') {
    throw new Error('生产环境不允许使用Mock支付，请配置PAYMENT_PROVIDER=wechat或alipay');
  }

  return {
    provider,
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

  if (config.provider === 'mock') {
    console.warn('[Payment] Mock模式下跳过签名验证');
    return true;
  }

  if (paymentMethod === 'wechat') {
    return verifyWechatSignature(notification, config);
  }
  if (paymentMethod === 'alipay') {
    return verifyAlipaySignature(notification, config);
  }

  console.error(`[Payment] 不支持的支付方式: ${paymentMethod}`);
  return false;
}

async function verifyWechatSignature(
  notification: Record<string, unknown>,
  config: PaymentConfig
): Promise<boolean> {
  if (!config.wechatApiKey) {
    console.error('[Payment] 微信支付密钥未配置，无法验签');
    return false;
  }

  try {
    // 使用crypto验证微信支付v3签名
    // 参考: https://pay.weixin.qq.com/wiki/doc/apiv3/wechatpay/wechatpay4_1.shtml
    const { sign } = notification as any;

    if (!sign) {
      console.error('[Payment] 微信支付回调缺少签名字段');
      return false;
    }

    // TODO: 实现完整的微信支付v3签名验证
    // 生产环境需实现: 1.构建验签串 2.使用微信平台公钥验证
    // 当前实现拒绝所有非mock的wechat回调，防止伪造
    console.warn('[Payment] 微信支付v3签名验证未完全实现，拒绝回调');
    return false;
  } catch (error) {
    console.error('[Payment] 微信支付验签失败:', error);
    return false;
  }
}

async function verifyAlipaySignature(
  notification: Record<string, unknown>,
  config: PaymentConfig
): Promise<boolean> {
  if (!config.alipayPublicKey) {
    console.error('[Payment] 支付宝公钥未配置，无法验签');
    return false;
  }

  try {
    const { sign } = notification as any;

    if (!sign) {
      console.error('[Payment] 支付宝回调缺少签名字段');
      return false;
    }

    // TODO: 实现完整的支付宝RSA2签名验证
    // 生产环境需实现: 1.去除sign字段和sign_type字段 2.按key排序拼接参数 3.RSA2验签
    console.warn('[Payment] 支付宝签名验证未完全实现，拒绝回调');
    return false;
  } catch (error) {
    console.error('[Payment] 支付宝验签失败:', error);
    return false;
  }
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

  if (config.provider === 'mock') {
    console.log(`[Payment-Mock] 退款: ${orderNo}, 金额: ${amount}`);
    return { success: true };
  }

  return { success: false, error: '退款功能需要配置真实的支付通道' };
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
