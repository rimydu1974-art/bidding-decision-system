import prisma from '@/lib/db';

export type BehaviorAction =
  // 转化漏斗
  | 'register'
  | 'login'
  | 'upload'
  | 'analyze'
  | 'view_result'
  | 'click_pay'
  | 'pay_success'
  // 留存漏斗（记忆层）
  | 'record_decision'
  | 'view_profile'
  | 'retrospective_match'
  | 'repeat_analysis'
  | 'profile_generated';

interface TrackParams {
  userId: string;
  action: BehaviorAction;
  projectId?: string;
  metadata?: Record<string, unknown>;
}

export async function trackBehavior({ userId, action, projectId, metadata }: TrackParams) {
  try {
    await prisma.userBehavior.create({
      data: {
        userId,
        action,
        projectId: projectId || null,
        metadata: JSON.stringify(metadata || {}),
      },
    });
  } catch (error) {
    console.error(`[Behavior] Failed to track ${action}:`, error);
  }
}

const UPGRADE_POPUP_REASONS = [
  { key: 'too_expensive', label: '太贵' },
  { key: 'low_value', label: '分析价值不够' },
  { key: 'trying', label: '先试试' },
  { key: 'has_tool', label: '已有其他工具' },
  { key: 'company_process', label: '公司流程原因' },
  { key: 'other', label: '其他' },
];

export { UPGRADE_POPUP_REASONS };
