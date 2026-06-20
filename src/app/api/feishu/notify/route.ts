import { NextRequest, NextResponse } from 'next/server';
import { sendTextMessage, sendRichTextMessage, sendCardMessage } from '@/lib/feishu';
import { validateSession, getTokenFromRequest } from '@/lib/auth';

// 发送投标提醒
async function sendBidReminder(
  chatId: string,
  projectName: string,
  deadline: string,
  daysRemaining: number
) {
  const card = {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '投标提醒' },
      template: daysRemaining <= 1 ? 'red' : daysRemaining <= 3 ? 'orange' : 'blue',
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**项目名称**：${projectName}\n**截止时间**：${deadline}\n**剩余天数**：${daysRemaining}天`,
        },
      },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: { tag: 'plain_text', content: '查看详情' },
            type: 'primary',
            url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          },
        ],
      },
    ],
  };

  return sendCardMessage(chatId, card, 'chat_id');
}

// 发送风险预警
async function sendRiskAlert(
  chatId: string,
  projectName: string,
  riskLevel: string,
  riskDescription: string
) {
  const riskColors: Record<string, string> = {
    critical: 'red',
    high: 'orange',
    medium: 'yellow',
    low: 'blue',
  };

  const riskLabels: Record<string, string> = {
    critical: '严重',
    high: '高',
    medium: '中',
    low: '低',
  };

  const card = {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '风险预警' },
      template: riskColors[riskLevel] || 'blue',
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**项目名称**：${projectName}\n**风险等级**：${riskLabels[riskLevel] || riskLevel}\n**风险描述**：${riskDescription}`,
        },
      },
    ],
  };

  return sendCardMessage(chatId, card, 'chat_id');
}

// 发送分析完成通知
async function sendAnalysisComplete(
  chatId: string,
  projectName: string,
  recommendation: string
) {
  const recLabels: Record<string, string> = {
    bid: '建议投',
    caution: '谨慎投',
    'no-bid': '不建议投',
  };

  const recColors: Record<string, string> = {
    bid: 'green',
    caution: 'yellow',
    'no-bid': 'red',
  };

  const card = {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '分析完成' },
      template: recColors[recommendation] || 'blue',
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**项目名称**：${projectName}\n**投标建议**：${recLabels[recommendation] || recommendation}`,
        },
      },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: { tag: 'plain_text', content: '查看报告' },
            type: 'primary',
            url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          },
        ],
      },
    ],
  };

  return sendCardMessage(chatId, card, 'chat_id');
}

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

    const { type, chatId, data } = await request.json();

    if (!type || !chatId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    let result;

    switch (type) {
      case 'bid_reminder':
        result = await sendBidReminder(
          chatId,
          data.projectName,
          data.deadline,
          data.daysRemaining
        );
        break;

      case 'risk_alert':
        result = await sendRiskAlert(
          chatId,
          data.projectName,
          data.riskLevel,
          data.riskDescription
        );
        break;

      case 'analysis_complete':
        result = await sendAnalysisComplete(
          chatId,
          data.projectName,
          data.recommendation
        );
        break;

      case 'text':
        result = await sendTextMessage(chatId, data.text);
        break;

      default:
        return NextResponse.json({ error: '未知消息类型' }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Feishu notification error:', error);
    return NextResponse.json(
      { error: '发送飞书消息失败' },
      { status: 500 }
    );
  }
}
