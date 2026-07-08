'use client';

import React from 'react';
import { Check, Minus } from 'lucide-react';

interface ComparisonRow {
  feature: string;
  free: string;
  paid19: string;
  paid99: string;
}

const COMPARISONS: ComparisonRow[] = [
  { feature: '投标决策表（6大类）', free: '完整内容', paid19: '完整内容', paid99: '完整内容' },
  { feature: '老板总结', free: '仅数量', paid19: '完整内容', paid99: '完整内容' },
  { feature: '偏离表', free: '仅要求列', paid19: '要求+响应', paid99: '要求+响应' },
  { feature: '项目深度诊断', free: '仅数量', paid19: '完整内容', paid99: '完整内容' },
  { feature: '风险评估+废标', free: '仅数量', paid19: '完整内容', paid99: '完整内容' },
  { feature: '甲方确认问题', free: '—', paid19: '✓', paid99: '✓' },
  { feature: '评分预测', free: '—', paid19: '✓', paid99: '✓' },
  { feature: '关键词分析', free: '—', paid19: '✓', paid99: '✓' },
  { feature: '准备分工项目包', free: '—', paid19: '✓', paid99: '✓' },
  { feature: '投标文件评估', free: '—', paid19: '免费追加', paid99: '✓' },
  { feature: '不限项目分析', free: '—', paid19: '—', paid99: '✓' },
  { feature: 'AI投标助手', free: '—', paid19: '—', paid99: '✓' },
  { feature: 'API接口', free: '—', paid19: '—', paid99: '✓' },
  { feature: '企业知识库', free: '—', paid19: '—', paid99: '✓' },
];

export function UnlockComparisonTable() {
  return (
    <div className="rounded-2xl border border-[#2e2e42] bg-[#0f0f1a] overflow-hidden">
      <div className="px-5 py-3 bg-[#1a1a2e] border-b border-[#2e2e42]">
        <h4 className="text-sm font-bold text-white">功能对比：免费版 · ¥19版 · ¥99版</h4>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#2e2e42]">
            <th className="text-left py-2.5 px-3 text-[#6b7280] font-medium">功能</th>
            <th className="text-center py-2.5 px-2 text-[#6b7280] font-medium w-18">免费版</th>
            <th className="text-center py-2.5 px-2 text-[#a78bfa] font-medium w-16">¥19版</th>
            <th className="text-center py-2.5 px-2 text-[#10b981] font-medium w-16">¥99版</th>
          </tr>
        </thead>
        <tbody>
          {COMPARISONS.map((row, idx) => {
            const is99Feature = row.paid99 === '✓' && row.paid19 === '—';
            return (
              <tr key={idx} className={`border-b border-[#2e2e42]/50 ${is99Feature ? 'bg-[#10b981]/[0.03]' : ''}`}>
                <td className={`py-2 px-3 ${is99Feature ? 'text-[#10b981]' : 'text-[#e2e8f0]'}`}>{row.feature}</td>
                <td className="py-2 px-2 text-center">
                  {row.free === '—' ? (
                    <Minus className="w-4 h-4 text-[#6b7280] mx-auto" />
                  ) : (
                    <span className="text-[#6b7280] text-[11px]">{row.free}</span>
                  )}
                </td>
                <td className="py-2 px-2 text-center">
                  {(row.paid19 === '✓' || row.paid19 === '免费追加') ? (
                    row.paid19 === '免费追加' ? (
                      <span className="text-[#a78bfa] text-[11px] font-medium">免费追加</span>
                    ) : (
                      <Check className="w-4 h-4 text-[#a78bfa] mx-auto" />
                    )
                  ) : (
                    <Minus className="w-4 h-4 text-[#6b7280] mx-auto" />
                  )}
                </td>
                <td className="py-2 px-2 text-center">
                  {row.paid99 === '✓' ? (
                    <Check className="w-4 h-4 text-[#10b981] mx-auto" />
                  ) : (
                    <span className="text-[#10b981] text-[11px] font-medium">{row.paid99}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
