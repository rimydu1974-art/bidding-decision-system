'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Star, Award, Crown, Medal, Gem } from 'lucide-react';

interface Customer {
  userId: string;
  email: string;
  name: string | null;
  plan: string;
  totalSpent: number;
  totalAiCalls: number;
  projectCount: number;
  loginCount: number;
  score: number;
  level: string;
}

interface CustomersResponse {
  customers: Customer[];
}

const LEVEL_MAP: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  '钻石': { icon: Gem, color: '#06b6d4', bg: 'bg-[#06b6d4]/15' },
  '金牌': { icon: Crown, color: '#f59e0b', bg: 'bg-[#f59e0b]/15' },
  '银牌': { icon: Medal, color: '#9ca3af', bg: 'bg-[#9ca3af]/15' },
  '铜牌': { icon: Award, color: '#cd7f32', bg: 'bg-[#cd7f32]/15' },
  '普通': { icon: Star, color: '#6b7280', bg: 'bg-[#6b7280]/15' },
};

const PLAN_MAP: Record<string, string> = {
  free: '免费版',
  single: '单次基础版',
  pro: '专业会员版',
  'pro-year': '专业版年付',
  enterprise: '企业版',
};

export default function CustomersPage() {
  const [data, setData] = useState<CustomersResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/customers');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#6b7280] text-sm">加载中...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#6b7280] text-sm">加载失败</div>
      </div>
    );
  }

  const levelCounts: Record<string, number> = {};
  data.customers.forEach(c => {
    levelCounts[c.level] = (levelCounts[c.level] || 0) + 1;
  });

  const levelOrder = ['钻石', '金牌', '银牌', '铜牌', '普通'];

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Star className="w-7 h-7 text-[#a78bfa]" />
          高价值客户
        </h1>
        <p className="text-sm text-[#6b7280] mt-1">
          基于登录频率、项目数、消费金额综合评分，共 {data.customers.length} 位付费客户
        </p>
      </div>

      {/* Level Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {levelOrder.map(level => {
          const info = LEVEL_MAP[level];
          const Icon = info.icon;
          const count = levelCounts[level] || 0;
          return (
            <div key={level} className="glass-card p-4 text-center">
              <div className={`w-10 h-10 rounded-lg ${info.bg} flex items-center justify-center mx-auto mb-2`}>
                <span style={{ color: info.color }}><Icon className="w-5 h-5" /></span>
              </div>
              <div className="text-lg font-bold text-white">{count}</div>
              <div className="text-xs text-[#6b7280]">{level}客户</div>
            </div>
          );
        })}
      </div>

      {/* Customers Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2e2e42]">
                <th className="text-left px-4 py-3 text-[#6b7280] font-medium">#</th>
                <th className="text-left px-4 py-3 text-[#6b7280] font-medium">用户邮箱</th>
                <th className="text-left px-4 py-3 text-[#6b7280] font-medium">套餐</th>
                <th className="text-right px-4 py-3 text-[#6b7280] font-medium">总消费</th>
                <th className="text-right px-4 py-3 text-[#6b7280] font-medium">AI调用</th>
                <th className="text-right px-4 py-3 text-[#6b7280] font-medium">项目数</th>
                <th className="text-right px-4 py-3 text-[#6b7280] font-medium">登录次数</th>
                <th className="text-right px-4 py-3 text-[#6b7280] font-medium">评分</th>
                <th className="text-center px-4 py-3 text-[#6b7280] font-medium">等级</th>
              </tr>
            </thead>
            <tbody>
              {data.customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#6b7280]">暂无付费客户</td>
                </tr>
              ) : (
                data.customers.map((c, idx) => {
                  const levelInfo = LEVEL_MAP[c.level] || LEVEL_MAP['普通'];
                  const LevelIcon = levelInfo.icon;

                  return (
                    <tr
                      key={c.userId}
                      className="border-b border-[#2e2e42]/50 hover:bg-[#1e1e2e]/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-[#6b7280]">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="text-white font-medium">{c.email}</div>
                        {c.name && (
                          <div className="text-xs text-[#4b5563]">{c.name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-[#7c3aed]/15 text-[#a78bfa]">
                          {PLAN_MAP[c.plan] || c.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-white font-medium">
                        ¥{c.totalSpent.toFixed(0)}
                      </td>
                      <td className="px-4 py-3 text-right text-[#9ca3af]">{c.totalAiCalls}</td>
                      <td className="px-4 py-3 text-right text-[#9ca3af]">{c.projectCount}</td>
                      <td className="px-4 py-3 text-right text-[#9ca3af]">{c.loginCount}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-white font-bold">{c.score}</span>
                        <span className="text-[#6b7280] text-xs"> / 100</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${levelInfo.bg}`} style={{ color: levelInfo.color }}>
                          <LevelIcon className="w-3 h-3" />
                          {c.level}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
