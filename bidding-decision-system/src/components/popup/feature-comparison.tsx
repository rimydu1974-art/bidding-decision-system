'use client';

import React from 'react';
import { Check, X, Lock } from 'lucide-react';

interface FeatureRow {
  name: string;
  free: string | boolean;
  paid: string | boolean;
}

const FEATURES: FeatureRow[] = [
  { name: '投标决策表（6大类信息）', free: '完整数据', paid: '完整数据' },
  { name: '老板总结', free: '仅显示数量', paid: '结论+关键提醒+准备重点' },
  { name: '偏离表', free: '仅招标要求列', paid: '招标要求+投标响应' },
  { name: '风险评估+废标风险', free: false, paid: true },
  { name: '甲方确认问题清单', free: false, paid: true },
  { name: '评分预测拆解', free: false, paid: true },
  { name: '关键词分析', free: false, paid: true },
  { name: '准备分工项目包', free: false, paid: true },
  { name: '同项目投标文件评估', free: false, paid: '免费追加' },
];

export function FeatureComparison() {
  return (
    <div className="rounded-2xl border border-[#7c3aed]/30 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📋</span>
        <h3 className="text-base font-bold text-white">本项目完整分析包含</h3>
        <span className="ml-auto text-sm font-bold gradient-text">¥19/项目</span>
      </div>

      <div className="space-y-2 mb-4">
        {FEATURES.map((feature, idx) => (
          <div key={idx} className="flex items-center gap-3 text-sm">
            <div className="w-5 h-5 rounded-full bg-[#10b981]/20 flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3 text-[#10b981]" />
            </div>
            <span className="text-[#e2e8f0] flex-1">{feature.name}</span>
            {typeof feature.paid === 'boolean' ? (
              <span className="text-[#10b981] text-xs">✓</span>
            ) : (
              <span className="text-[#10b981] text-xs">{feature.paid}</span>
            )}
          </div>
        ))}
      </div>

      <div className="p-3 rounded-xl bg-[#f59e0b]/5 border border-[#f59e0b]/20">
        <p className="text-xs text-[#f59e0b]">
          💡 免费版：老板总结仅显示数量，偏离表仅显示要求列，风险/评分/关键词模糊预览
        </p>
      </div>
    </div>
  );
}
