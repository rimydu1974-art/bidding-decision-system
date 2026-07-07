'use client';

import React, { useState } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { UPGRADE_POPUP_REASONS } from '@/lib/behavior';

interface UpgradeDialogProps {
  open: boolean;
  onClose: () => void;
  onGoPricing: () => void;
}

export function UpgradeDialog({ open, onClose, onGoPricing }: UpgradeDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customContent, setCustomContent] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setSubmitting(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: selectedReason,
          content: customContent || null,
          page: window.location.pathname,
        }),
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0F0F1A] border border-[#2A2A40] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in">
        {!submitted ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">为什么暂时不买？</h3>
              <button onClick={onClose} className="text-[#6b7280] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-[#9ca3af] mb-4">
              告诉我们原因，帮助我们做得更好
            </p>

            <div className="space-y-2 mb-4">
              {UPGRADE_POPUP_REASONS.map((reason) => (
                <button
                  key={reason.key}
                  onClick={() => setSelectedReason(reason.label)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                    selectedReason === reason.label
                      ? 'bg-[#7c3aed]/15 border-[#7c3aed]/40 text-[#a78bfa]'
                      : 'bg-[#1e1e2e] border-[#2e2e42] text-[#9ca3af] hover:text-white hover:border-[#4e4e62]'
                  }`}
                >
                  {reason.label}
                </button>
              ))}
            </div>

            <textarea
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              placeholder="补充说明（选填）..."
              rows={3}
              className="w-full bg-[#1e1e2e] border border-[#2e2e42] rounded-xl px-4 py-3 text-sm text-white placeholder-[#6b7280] resize-none focus:outline-none focus:border-[#7c3aed]/50 mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={onGoPricing}
                className="flex-1 btn-primary flex items-center justify-center gap-1"
              >
                ¥19 解锁单项目
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={onGoPricing}
                className="flex-1 bg-[#1e1e2e] hover:bg-[#2e2e42] text-[#9ca3af] hover:text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
              >
                查看全部方案
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">感谢反馈</h3>
              <button onClick={onClose} className="text-[#6b7280] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-[#9ca3af] mb-6">
              我们会根据您的反馈持续改进
            </p>
            <button
              onClick={onClose}
              className="w-full btn-primary"
            >
              知道了
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export interface UpgradeTrigger {
  /** 第N次分析后触发 */
  analyzeCount: number;
}

const UPGRADE_STORAGE_KEY = 'oc_upgrade_popup';

export function shouldShowUpgrade(trigger: UpgradeTrigger): boolean {
  try {
    const stored = localStorage.getItem(UPGRADE_STORAGE_KEY);
    if (!stored) return true;
    const data = JSON.parse(stored);
    if (data.dismissed) return false;
    if (data.lastShownAt) {
      const lastShown = new Date(data.lastShownAt).getTime();
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (lastShown > weekAgo && data.count >= trigger.analyzeCount) return false;
    }
    return true;
  } catch {
    return true;
  }
}

export function markUpgradeShown(analyzeCount: number) {
  try {
    localStorage.setItem(UPGRADE_STORAGE_KEY, JSON.stringify({
      lastShownAt: new Date().toISOString(),
      count: analyzeCount,
      dismissed: false,
    }));
  } catch {}
}

export function dismissUpgradePopup() {
  try {
    localStorage.setItem(UPGRADE_STORAGE_KEY, JSON.stringify({
      lastShownAt: new Date().toISOString(),
      dismissed: true,
    }));
  } catch {}
}
