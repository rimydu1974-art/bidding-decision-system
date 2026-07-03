'use client';

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface RiskBadgeProps {
  level: RiskLevel;
  label?: string;
}

const levelConfig: Record<RiskLevel, { bg: string; txt: string; dot: string; l: string }> = {
  low:      { bg: 'bg-[#10b981]/10', txt: 'text-[#10b981]', dot: 'bg-[#10b981]', l: '低风险' },
  medium:   { bg: 'bg-[#f59e0b]/10', txt: 'text-[#f59e0b]', dot: 'bg-[#f59e0b]', l: '中风险' },
  high:     { bg: 'bg-[#f97316]/10', txt: 'text-[#f97316]', dot: 'bg-[#f97316]', l: '高风险' },
  critical: { bg: 'bg-[#ef4444]/10', txt: 'text-[#ef4444]', dot: 'bg-[#ef4444]', l: '极高风险' },
};

export function RiskBadge({ level, label }: RiskBadgeProps) {
  const config = levelConfig[level] || levelConfig.medium;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.txt}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {label || config.l}
    </span>
  );
}
