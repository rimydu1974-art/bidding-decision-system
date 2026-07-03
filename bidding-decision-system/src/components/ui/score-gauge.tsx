'use client';

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const sizeConfig = {
  sm: { w: 56, h: 56, r: 24, sw: 4, fs: 15 },
  md: { w: 110, h: 110, r: 48, sw: 7, fs: 28 },
  lg: { w: 160, h: 160, r: 70, sw: 9, fs: 40 },
};

function getColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

function getLabel(score: number): string {
  if (score >= 85) return '强烈建议';
  if (score >= 70) return '建议参与';
  if (score >= 50) return '谨慎参与';
  if (score >= 30) return '不建议';
  return '高风险';
}

export function ScoreGauge({ score, size = 'md', showLabel = true }: ScoreGaugeProps) {
  const s = sizeConfig[size];
  const color = getColor(score);
  const label = getLabel(score);
  const c = 2 * Math.PI * s.r;
  const offset = c - (score / 100) * c;

  return (
    <div className="flex flex-col items-center">
      <svg width={s.w} height={s.h} viewBox={`0 0 ${s.w} ${s.h}`}>
        <circle
          cx={s.w / 2}
          cy={s.h / 2}
          r={s.r}
          fill="none"
          stroke="rgba(46,46,66,0.4)"
          strokeWidth={s.sw}
        />
        <circle
          cx={s.w / 2}
          cy={s.h / 2}
          r={s.r}
          fill="none"
          stroke={color}
          strokeWidth={s.sw}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${s.w / 2} ${s.h / 2})`}
        />
        <text
          x={s.w / 2}
          y={s.h / 2 + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize={s.fs}
          fontWeight="700"
        >
          {score}
        </text>
      </svg>
      {showLabel && (
        <span className="text-[#9ca3af] font-medium" style={{ fontSize: size === 'sm' ? 10 : 12 }}>
          {label}
        </span>
      )}
    </div>
  );
}
