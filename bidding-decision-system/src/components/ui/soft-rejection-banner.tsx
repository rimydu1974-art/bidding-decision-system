'use client';

import { useState } from 'react';

interface SoftRejectionItem {
  ruleId: string;
  ruleName: string;
  riskLevel: string;
  weight: number;
  triggered: boolean;
  message: string;
  suggestion?: string;
}

interface HardRejectionItem {
  ruleId: string;
  ruleName: string;
  triggered: boolean;
  message: string;
  suggestion?: string;
}

interface SoftRejectionBannerProps {
  hardRejections: HardRejectionItem[];
  softRejections: SoftRejectionItem[];
  onConfirm?: () => void;
  onCancel?: () => void;
}

const riskLevelConfig: Record<string, { bg: string; txt: string; border: string; label: string }> = {
  low: { bg: 'bg-[#10b981]/10', txt: 'text-[#10b981]', border: 'border-[#10b981]/30', label: '低风险' },
  medium: { bg: 'bg-[#f59e0b]/10', txt: 'text-[#f59e0b]', border: 'border-[#f59e0b]/30', label: '中风险' },
  high: { bg: 'bg-[#f97316]/10', txt: 'text-[#f97316]', border: 'border-[#f97316]/30', label: '高风险' },
  critical: { bg: 'bg-[#ef4444]/10', txt: 'text-[#ef4444]', border: 'border-[#ef4444]/30', label: '极高风险' },
};

export function SoftRejectionBanner({
  hardRejections,
  softRejections,
  onConfirm,
  onCancel,
}: SoftRejectionBannerProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const triggeredHard = hardRejections.filter((r) => r.triggered);
  const triggeredSoft = softRejections.filter((r) => r.triggered);

  if (triggeredHard.length === 0 && triggeredSoft.length === 0) {
    return null;
  }

  const hasHardRejection = triggeredHard.length > 0;
  const overallRiskLevel = hasHardRejection
    ? 'critical'
    : triggeredSoft.some((r) => r.riskLevel === 'high')
    ? 'high'
    : triggeredSoft.some((r) => r.riskLevel === 'medium')
    ? 'medium'
    : 'low';

  const config = riskLevelConfig[overallRiskLevel];

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm?.();
  };

  return (
    <div className={`rounded-lg border ${config.border} ${config.bg} p-4 mb-4`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${config.txt.replace('text-', 'bg-')}`} />
          <span className={`font-semibold ${config.txt}`}>
            {hasHardRejection ? '废标风险拦截' : '风险提示'}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded ${config.bg} ${config.txt}`}>
            {config.label}
          </span>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-[#9ca3af] hover:text-white"
        >
          {showDetails ? '收起' : '查看详情'}
        </button>
      </div>

      {hasHardRejection && (
        <div className="mt-3 p-3 bg-[#ef4444]/5 rounded border border-[#ef4444]/20">
          <p className="text-sm text-[#ef4444] font-medium">
            🔴 检测到废标条件，投标将直接无效：
          </p>
          <ul className="mt-2 space-y-1">
            {triggeredHard.map((hr) => (
              <li key={hr.ruleId} className="text-sm text-[#9ca3af]">
                • {hr.message}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-[#ef4444]">
            建议：放弃本次投标或修正废标条件后再提交
          </p>
        </div>
      )}

      {showDetails && triggeredSoft.length > 0 && (
        <div className="mt-3 space-y-2">
          {triggeredSoft.map((sr) => {
            const srConfig = riskLevelConfig[sr.riskLevel];
            return (
              <div
                key={sr.ruleId}
                className={`p-2 rounded border ${srConfig.border} ${srConfig.bg}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${srConfig.txt} ${srConfig.bg}`}>
                    {srConfig.label}
                  </span>
                  <span className="text-sm font-medium text-white">{sr.ruleName}</span>
                  <span className="text-xs text-[#9ca3af]">权重: {sr.weight}</span>
                </div>
                <p className="mt-1 text-xs text-[#9ca3af]">{sr.message}</p>
                {sr.suggestion && (
                  <p className="mt-1 text-xs text-[#f59e0b]">💡 {sr.suggestion}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!hasHardRejection && triggeredSoft.length > 0 && !confirmed && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-[#f59e0b] text-black text-sm font-medium rounded hover:bg-[#f59e0b]/80"
          >
            我已知晓风险，继续投标
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-[#374151] text-white text-sm font-medium rounded hover:bg-[#4b5563]"
          >
            放弃投标
          </button>
        </div>
      )}

      {confirmed && (
        <div className="mt-3 text-xs text-[#10b981]">
          ✓ 已确认风险，继续投标流程
        </div>
      )}
    </div>
  );
}
