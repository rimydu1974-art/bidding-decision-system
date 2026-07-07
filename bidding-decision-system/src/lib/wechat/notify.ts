// 企业微信机器人通知服务

interface WechatNotification {
  orderNo: string;
  userEmail: string;
  amount: number;
  planName: string;
  paymentMethod: string;
}

// 机器人配置 - 仅从环境变量读取
export function getBotConfig() {
  const botId = process.env.WECHAT_BOT_ID;
  const secret = process.env.WECHAT_BOT_SECRET;
  const adminUserId = process.env.WECHAT_ADMIN_USERID;

  if (!botId || !secret) {
    return null;
  }

  return { botId, secret, adminUserId: adminUserId || '' };
}

// 发送支付通知给管理员（WebSocket AI助手）
export async function sendPaymentNotification(data: WechatNotification): Promise<boolean> {
  try {
    console.log('[WeChat] 开始发送通知...');
    const cfg = getBotConfig();
    if (!cfg) {
      console.warn('[WeChat] 机器人未配置，跳过通知');
      return false;
    }

    const { botId, secret, adminUserId } = cfg;
    console.log('[WeChat] botId:', botId, 'adminUserId:', adminUserId);

    if (!adminUserId) {
      console.warn('[WeChat] 管理员用户ID未配置，跳过通知');
      return false;
    }

    // 动态 require 避免 webpack 静态分析
    let WSClient: any;
    try {
      const sdk = require('@wecom/aibot-node-sdk');
      WSClient = sdk.WSClient;
    } catch (e) {
      console.warn('[WeChat] SDK require 失败:', (e as Error).message);
      return false;
    }

    if (!WSClient) {
      console.warn('[WeChat] WSClient 不存在');
      return false;
    }

    console.log('[WeChat] 创建 WebSocket 客户端...');
    const wsClient = new WSClient({ 
      botId, 
      secret,
      logger: { info: console.log, warn: console.warn, error: console.error, debug: () => {} }
    });

    const content = `💰 收到新支付截图

订单号：${data.orderNo}
用户：${data.userEmail}
金额：¥${data.amount}
套餐：${data.planName}
支付方式：${data.paymentMethod === 'wechat' ? '微信' : '支付宝'}

⚠️ 请尽快登录后台审核确认`;

    // 等待连接建立
    console.log('[WeChat] 正在连接WebSocket...');
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('[WeChat] WebSocket连接超时(10s)');
        wsClient.disconnect();
        reject(new Error('连接超时'));
      }, 10000);
      
      wsClient.on('authenticated', () => {
        console.log('[WeChat] WebSocket认证成功');
        clearTimeout(timeout);
        resolve();
      });
      
      wsClient.on('error', (err: Error) => {
        console.error('[WeChat] WebSocket错误:', err.message);
        clearTimeout(timeout);
        reject(err);
      });
      
      wsClient.connect();
    });

    // 使用 sendMessage 发送消息
    console.log('[WeChat] 正在发送消息给', adminUserId);
    const result = await wsClient.sendMessage(adminUserId, {
      msgtype: 'markdown',
      markdown: { content }
    });
    console.log('[WeChat] 发送结果:', JSON.stringify(result));

    console.log('[WeChat] 支付通知已发送给', adminUserId);
    
    // 断开连接
    setTimeout(() => wsClient.disconnect(), 1000);
    
    return true;
  } catch (error) {
    console.error('[WeChat] 发送通知失败:', error);
    return false;
  }
}

// 备用：Webhook方式发送
export async function sendPaymentNotificationByWebhook(data: WechatNotification): Promise<boolean> {
  const webhookUrl = process.env.WECHAT_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('[WeChat] Webhook URL未配置，跳过通知');
    return false;
  }

  const content = `💰 收到新支付截图

订单号：${data.orderNo}
用户：${data.userEmail}
金额：¥${data.amount}
套餐：${data.planName}
支付方式：${data.paymentMethod === 'wechat' ? '微信' : '支付宝'}

⚠️ 请尽快审核确认`;

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        msgtype: 'text',
        text: { content }
      }),
    });

    const result = await res.json();
    
    if (result.errcode === 0) {
      console.log('[WeChat] Webhook通知已发送');
      return true;
    } else {
      console.error('[WeChat] Webhook发送失败:', result);
      return false;
    }
  } catch (error) {
    console.error('[WeChat] Webhook发送异常:', error);
    return false;
  }
}
