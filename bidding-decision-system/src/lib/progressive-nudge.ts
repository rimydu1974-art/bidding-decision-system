'use client';

export interface NudgeConfig {
  plan: 'free' | 'single' | 'pro' | 'enterprise';
  analyzeCount: number;
  singleSpend?: number;
}

interface NudgeState {
  shownMilestones: number[];
  lastDismissedAt?: number;
}

const STORAGE_KEY = 'oc_progressive_nudge';

const FREE_MILESTONES = [5, 10, 15];
const SINGLE_MILESTONES = [3, 5];

function getStorage(): NudgeState {
  if (typeof window === 'undefined') return { shownMilestones: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { shownMilestones: [] };
    return JSON.parse(raw);
  } catch {
    return { shownMilestones: [] };
  }
}

function setStorage(state: NudgeState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function shouldShowNudge(config: NudgeConfig): { show: boolean; milestone: number; message: string; savings?: string } | null {
  if (config.plan === 'pro' || config.plan === 'enterprise') return null;

  const state = getStorage();
  const milestones = config.plan === 'free' ? FREE_MILESTONES : SINGLE_MILESTONES;

  for (const milestone of milestones) {
    if (config.analyzeCount >= milestone && !state.shownMilestones.includes(milestone)) {
      if (config.plan === 'free') {
        return {
          show: true,
          milestone,
          message: `已使用${milestone}次免费分析，19元解锁完整功能更智慧`,
        };
      } else if (config.plan === 'single') {
        const totalSpend = config.singleSpend ?? milestone * 19;
        const proMonthly = 99;
        const saved = totalSpend - proMonthly;
        return {
          show: true,
          milestone,
          message: `您已使用19元版${milestone}次，共花费${totalSpend}元`,
          savings: saved > 0 ? `升级99元专业版可无限使用，已为您节省${saved}元` : `升级99元专业版后，下次分析即可开始省钱`,
        };
      }
    }
  }

  return null;
}

export function markNudgeShown(milestone: number): void {
  const state = getStorage();
  if (!state.shownMilestones.includes(milestone)) {
    state.shownMilestones.push(milestone);
    setStorage(state);
  }
}

export function dismissNudge(): void {
  const state = getStorage();
  state.lastDismissedAt = Date.now();
  setStorage(state);
}

export function resetNudges(): void {
  setStorage({ shownMilestones: [] });
}
