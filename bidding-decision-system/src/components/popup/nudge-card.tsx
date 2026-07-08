'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, ArrowRight, X } from 'lucide-react';
import { shouldShowNudge, markNudgeShown, dismissNudge, type NudgeConfig } from '@/lib/progressive-nudge';

interface NudgeCardProps {
  config: NudgeConfig;
  onUpgrade?: () => void;
}

export function NudgeCard({ config, onUpgrade }: NudgeCardProps) {
  const [nudge, setNudge] = useState<{ show: boolean; milestone: number; message: string; savings?: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const result = shouldShowNudge(config);
    if (result?.show) {
      setNudge(result);
    }
  }, [config.plan, config.analyzeCount, config.singleSpend]);

  const handleClose = () => {
    setDismissed(true);
    if (nudge) {
      markNudgeShown(nudge.milestone);
      dismissNudge();
    }
  };

  const handleUpgrade = () => {
    handleClose();
    onUpgrade?.();
  };

  if (!nudge || dismissed) return null;

  return (
    <div className="mt-4 rounded-xl border border-[#7c3aed]/30 bg-gradient-to-r from-[#7c3aed]/10 to-[#06b6d4]/10 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-[#a78bfa]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white mb-1">{nudge.message}</p>
            {nudge.savings && (
              <p className="text-xs text-[#9ca3af]">{nudge.savings}</p>
            )}
            <button
              onClick={handleUpgrade}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#a78bfa] hover:text-[#c4b5fd] transition-colors"
            >
              查看升级方案
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="text-[#6b7280] hover:text-[#9ca3af] p-1 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
