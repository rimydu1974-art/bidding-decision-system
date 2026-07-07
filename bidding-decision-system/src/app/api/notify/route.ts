import { NextRequest, NextResponse } from 'next/server';
import { validateSession, getTokenFromRequest } from '@/lib/auth';
import {
  sendBidReminder,
  sendQueryDeadlineReminder,
  sendRiskAlert,
  sendReportReady,
} from '@/lib/feishu/notify';

// POST: 发送通知
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

    const { type, data } = await request.json();

    switch (type) {
      case 'bid_reminder':
        await sendBidReminder(
          session.user.id,
          data.projectName,
          new Date(data.bidOpeningTime),
          data.daysLeft
        );
        break;

      case 'query_deadline':
        await sendQueryDeadlineReminder(
          session.user.id,
          data.projectName,
          new Date(data.queryDeadline)
        );
        break;

      case 'risk_alert':
        await sendRiskAlert(
          session.user.id,
          data.projectName,
          data.risks
        );
        break;

      case 'report_ready':
        await sendReportReady(
          session.user.id,
          data.projectName,
          data.reportType
        );
        break;

      default:
        return NextResponse.json({ error: '无效的通知类型' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: '通知已发送' });
  } catch (error) {
    console.error('Send notification error:', error);
    return NextResponse.json({ error: '发送失败' }, { status: 500 });
  }
}
