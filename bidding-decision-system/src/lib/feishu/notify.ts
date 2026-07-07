// 飞书消息通知服务
import { sendTextMessage, sendCardMessage } from '@/lib/feishu';

// 通知类型
export type NotificationType =
  | 'bid_reminder'      // 开标提醒
  | 'query_deadline'    // 质疑截止提醒
  | 'risk_alert'        // 风险提醒
  | 'report_ready'      // 报告生成完成
  | 'subscription_expiry'; // 订阅到期提醒

// 通知配置
interface NotificationConfig {
  enabled: boolean;
  feishuUserId?: string; // 飞书用户ID (open_id)
  feishuChatId?: string; // 飞书群组ID (chat_id)
}

// 获取用户通知配置
async function getUserNotificationConfig(userId: string): Promise<NotificationConfig> {
  // 这里可以从数据库读取用户的通知配置
  // 暂时返回默认配置
  return {
    enabled: true,
    feishuUserId: process.env.FEISHU_NOTIFY_USER_ID || '',
    feishuChatId: process.env.FEISHU_NOTIFY_CHAT_ID || '',
  };
}

// 发送开标时间提醒
export async function sendBidReminder(
  userId: string,
  projectName: string,
  bidOpeningTime: Date,
  daysLeft: number
) {
  const config = await getUserNotificationConfig(userId);
  if (!config.enabled || !config.feishuUserId) return;

  const timeStr = bidOpeningTime.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const card = {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '⏰ 开标时间提醒' },
      template: 'orange',
    },
    elements: [
      {
        tag: 'div',
        fields: [
          { is_short: true, text: { tag: 'lark_md', content: `**项目名称**\n${projectName}` } },
          { is_short: true, text: { tag: 'lark_md', content: `**剩余天数**\n${daysLeft}天` } },
        ],
      },
      {
        tag: 'div',
        text: { tag: 'lark_md', content: `**开标时间**：${timeStr}` },
      },
      {
        tag: 'hr',
      },
      {
        tag: 'note',
        elements: [{ tag: 'plain_text', content: '请确保标书已准备完毕，按时参加开标' }],
      },
    ],
  };

  return sendCardMessage(config.feishuUserId, card);
}

// 发送质疑截止提醒
export async function sendQueryDeadlineReminder(
  userId: string,
  projectName: string,
  queryDeadline: Date
) {
  const config = await getUserNotificationConfig(userId);
  if (!config.enabled || !config.feishuUserId) return;

  const timeStr = queryDeadline.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const card = {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '📝 质疑截止提醒' },
      template: 'red',
    },
    elements: [
      {
        tag: 'div',
        fields: [
          { is_short: true, text: { tag: 'lark_md', content: `**项目名称**\n${projectName}` } },
          { is_short: true, text: { tag: 'lark_md', content: `**截止时间**\n${timeStr}` } },
        ],
      },
      {
        tag: 'hr',
      },
      {
        tag: 'note',
        elements: [{ tag: 'plain_text', content: '如有疑问请在截止前提出质疑' }],
      },
    ],
  };

  return sendCardMessage(config.feishuUserId, card);
}

// 发送风险提醒
export async function sendRiskAlert(
  userId: string,
  projectName: string,
  risks: Array<{ title: string; level: string; description: string }>
) {
  const config = await getUserNotificationConfig(userId);
  if (!config.enabled || !config.feishuUserId) return;

  const riskList = risks
    .map((r) => {
      const levelIcon = r.level === 'critical' ? '🔴' : r.level === 'high' ? '🟠' : '🟡';
      return `${levelIcon} **${r.title}**：${r.description}`;
    })
    .join('\n');

  const card = {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '⚠️ 投标风险提醒' },
      template: 'red',
    },
    elements: [
      {
        tag: 'div',
        text: { tag: 'lark_md', content: `**项目名称**：${projectName}` },
      },
      {
        tag: 'div',
        text: { tag: 'lark_md', content: `**发现以下风险**：\n${riskList}` },
      },
      {
        tag: 'hr',
      },
      {
        tag: 'note',
        elements: [{ tag: 'plain_text', content: '请及时处理风险点，避免废标' }],
      },
    ],
  };

  return sendCardMessage(config.feishuUserId, card);
}

// 发送报告生成完成通知
export async function sendReportReady(
  userId: string,
  projectName: string,
  reportType: string
) {
  const config = await getUserNotificationConfig(userId);
  if (!config.enabled || !config.feishuUserId) return;

  const card = {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '✅ 报告生成完成' },
      template: 'green',
    },
    elements: [
      {
        tag: 'div',
        fields: [
          { is_short: true, text: { tag: 'lark_md', content: `**项目名称**\n${projectName}` } },
          { is_short: true, text: { tag: 'lark_md', content: `**报告类型**\n${reportType}` } },
        ],
      },
      {
        tag: 'hr',
      },
      {
        tag: 'note',
        elements: [{ tag: 'plain_text', content: '请登录系统查看并下载报告' }],
      },
    ],
  };

  return sendCardMessage(config.feishuUserId, card);
}

// 发送订阅到期提醒
export async function sendSubscriptionExpiry(
  userId: string,
  planName: string,
  expiresAt: Date
) {
  const config = await getUserNotificationConfig(userId);
  if (!config.enabled || !config.feishuUserId) return;

  const timeStr = expiresAt.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const card = {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '🔔 订阅到期提醒' },
      template: 'orange',
    },
    elements: [
      {
        tag: 'div',
        fields: [
          { is_short: true, text: { tag: 'lark_md', content: `**订阅方案**\n${planName}` } },
          { is_short: true, text: { tag: 'lark_md', content: `**到期时间**\n${timeStr}` } },
        ],
      },
      {
        tag: 'hr',
      },
      {
        tag: 'note',
        elements: [{ tag: 'plain_text', content: '请及时续费，避免功能受限' }],
      },
    ],
  };

  return sendCardMessage(config.feishuUserId, card);
}
