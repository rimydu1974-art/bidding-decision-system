'use client';

import { useState, useEffect } from 'react';
import { X, Zap } from 'lucide-react';
import { shouldShowNudge, markNudgeShown, dismissNudge, type NudgeConfig } from '@/lib/progressive-nudge';

interface NudgeBannerProps {
  config: NudgeConfig;
  onUpgrade?: () => void;
}

export function NudgeBanner({ config, onUpgrade }: NudgeBannerProps) {
  const [nudge, setNudge] = useState<{ show: boolean; milestone: number; message: string; savings?: string } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const result = shouldShowNudge(config);
    if (result?.show) {
      setNudge(result);
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        markNudgeShown(result.milestone);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [config.plan, config.analyzeCount, config.singleSpend]);

  const handleClose = () => {
    setVisible(false);
    if (nudge) {
      markNudgeShown(nudge.milestone);
      dismissNudge();
    }
  };

  const handleUpgrade = () => {
    handleClose();
    onUpgrade?.();
  };

  if (!nudge || !visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top">
      <div className="bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-white px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 flex-shrink-0" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="text-sm font-medium">{nudge.message}</span>
              {nudge.savings && (
                <span className="text-xs text-white/80 hidden sm:inline">· {nudge.savings}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUpgrade}
              className="text-xs font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              立即升级
            </button>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
