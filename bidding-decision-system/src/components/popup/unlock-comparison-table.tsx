'use client';

import React from 'react';
import { Check, Minus } from 'lucide-react';

interface ComparisonRow {
  feature: string;
  free: string;
  paid: string;
}

const COMPARISONS: ComparisonRow[] = [
  { feature: '投标决策表（6大类）', free: '完整数据', paid: '完整数据' },
  { feature: '老板总结', free: '仅数量', paid: '完整内容' },
  { feature: '偏离表', free: '仅要求列', paid: '要求+响应' },
  { feature: '风险评估+废标', free: '—', paid: '✓' },
  { feature: '甲方确认问题', free: '—', paid: '✓' },
  { feature: '评分预测', free: '—', paid: '✓' },
  { feature: '关键词分析', free: '—', paid: '✓' },
  { feature: '准备分工项目包', free: '—', paid: '✓' },
  { feature: '投标文件评估', free: '—', paid: '免费追加' },
];

export function UnlockComparisonTable() {
  return (
    <div className="rounded-2xl border border-[#2e2e42] bg-[#0f0f1a] overflow-hidden">
      <div className="px-5 py-3 bg-[#1a1a2e] border-b border-[#2e2e42]">
        <h4 className="text-sm font-bold text-white">免费版 vs ¥19 完整版</h4>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#2e2e42]">
            <th className="text-left py-2.5 px-4 text-[#6b7280] font-medium">功能</th>
            <th className="text-center py-2.5 px-3 text-[#6b7280] font-medium w-24">免费版</th>
            <th className="text-center py-2.5 px-3 text-[#a78bfa] font-medium w-24">¥19版</th>
          </tr>
        </thead>
        <tbody>
          {COMPARISONS.map((row, idx) => (
            <tr key={idx} className="border-b border-[#2e2e42]/50">
              <td className="py-2 px-4 text-[#e2e8f0]">{row.feature}</td>
              <td className="py-2 px-3 text-center">
                {row.free === '—' ? (
                  <Minus className="w-4 h-4 text-[#6b7280] mx-auto" />
                ) : (
                  <span className="text-[#6b7280] text-xs">{row.free}</span>
                )}
              </td>
              <td className="py-2 px-3 text-center">
                {row.paid === '✓' ? (
                  <Check className="w-4 h-4 text-[#10b981] mx-auto" />
                ) : (
                  <span className="text-[#10b981] text-xs font-medium">{row.paid}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
