/**
 * 弹窗触发判断逻辑
 * 管理各类弹窗的显示时机和频率控制
 */

// localStorage keys
const QUOTA_WARN_KEY = 'oc_quota_warn';
const GUIDE_SHOWN_KEY = 'oc_guide_shown';

export function shouldShowQuotaWarning(): boolean {
  try {
    const stored = localStorage.getItem(QUOTA_WARN_KEY);
    if (!stored) return true;
    const data = JSON.parse(stored);
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return new Date(data.shownAt).getTime() < oneDayAgo;
  } catch {
    return true;
  }
}

export function markQuotaWarningShown() {
  try {
    localStorage.setItem(QUOTA_WARN_KEY, JSON.stringify({
      shownAt: new Date().toISOString(),
    }));
  } catch {}
}

export function shouldShowGuide(): boolean {
  try {
    const stored = localStorage.getItem(GUIDE_SHOWN_KEY);
    return !stored;
  } catch {
    return true;
  }
}

export function markGuideShown() {
  try {
    localStorage.setItem(GUIDE_SHOWN_KEY, JSON.stringify({
      shownAt: new Date().toISOString(),
    }));
  } catch {}
}
