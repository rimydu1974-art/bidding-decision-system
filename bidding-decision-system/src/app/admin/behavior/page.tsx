'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Activity, TrendingDown, Users, Filter, Download } from 'lucide-react';

interface FunnelStep {
  step: string;
  count: number;
}

interface FunnelData {
  steps: FunnelStep[];
  dropoff: {
    from: string;
    to: string;
    lost: number;
    rate: number;
  }[];
  totalUsers: number;
  days: number;
}

const STEPS = [
  { key: 'register', label: '注册', icon: '📝' },
  { key: 'upload', label: '上传标书', icon: '📄' },
  { key: 'analyze', label: 'AI分析', icon: '🤖' },
  { key: 'viewResult', label: '查看结果', icon: '📊' },
  { key: 'clickPay', label: '点击付费', icon: '💰' },
  { key: 'paySuccess', label: '支付成功', icon: '✅' },
];

export default function BehaviorFunnelPage() {
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [groupBy, setGroupBy] = useState<'total' | 'day' | 'week'>('total');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('days', String(days));
    if (groupBy !== 'total') params.set('groupBy', groupBy);
    fetch(`/api/admin/behavior?${params.toString()}`)
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [days, groupBy]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.set('days', String(days));
      if (groupBy !== 'total') params.set('groupBy', groupBy);
      const res = await fetch(`/api/admin/export/behavior?${params.toString()}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `behavior_funnel_${days}d_${groupBy}_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const err = await res.json();
        alert(err.error || '导出失败');
      }
    } catch {
      alert('导出请求失败');
    } finally {
      setExporting(false);
    }
  };

  const funnelSteps = useMemo(() => {
    if (!data) return [];
    return STEPS.map((s, i) => {
      const stepData = data.steps.find(st => st.step === s.key);
      const count = stepData?.count ?? 0;
      const prevCount = i > 0 ? (data.steps.find(st => st.step === STEPS[i - 1].key)?.count ?? 0) : count;
      const conversionRate = prevCount > 0 ? ((count / prevCount) * 100) : 0;
      const dropoffRate = i > 0 ? ((1 - count / prevCount) * 100) : 0;
      return { ...s, count, conversionRate, dropoffRate, prevCount };
    });
  }, [data]);

  const maxCount = useMemo(() => {
    return funnelSteps.length > 0 ? funnelSteps[0].count : 0;
  }, [funnelSteps]);

  if (loading) {
    return <div className="text-[#6b7280] text-sm">加载中...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-[#7c3aed]" />
          用户行为漏斗
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#1e1e2e] rounded-lg p-1">
            {(['total', 'day', 'week'] as const).map(g => (
              <button
                key={g}
                onClick={() => setGroupBy(g)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  groupBy === g
                    ? 'bg-[#7c3aed] text-white'
                    : 'text-[#9ca3af] hover:text-white'
                }`}
              >
                {g === 'total' ? '累计' : g === 'day' ? '按日' : '按周'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#6b7280]" />
            {[7, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  days === d
                    ? 'bg-[#7c3aed] text-white'
                    : 'bg-[#1e1e2e] text-[#9ca3af] hover:text-white hover:bg-[#2e2e42]'
                }`}
              >
                {d}天
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1e1e2e] text-[#9ca3af] hover:text-white hover:bg-[#2e2e42] transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? '导出中...' : '导出CSV'}
          </button>
        </div>
      </div>

      {funnelSteps.length > 0 && (
        <>
          <div className="glass-card p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-6">
              转化漏斗 {groupBy !== 'total' && `(${groupBy === 'day' ? '今日' : '本周'})`}
            </h2>
            <div className="flex flex-col items-center gap-0">
              {funnelSteps.map((step, i) => {
                const widthPercent = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
                const minWidth = Math.max(widthPercent, 12);
                return (
                  <div key={step.key} className="w-full flex flex-col items-center">
                    <div
                      className="relative flex items-center justify-between px-6 py-4 rounded-xl transition-all"
                      style={{
                        width: `${minWidth}%`,
                        minWidth: '200px',
                        background: `linear-gradient(135deg, rgba(124,58,237,${0.15 + (i / STEPS.length) * 0.2}), rgba(124,58,237,${0.08 + (i / STEPS.length) * 0.15}))`,
                        border: '1px solid rgba(124,58,237,0.25)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{step.icon}</span>
                        <span className="text-sm font-medium text-white">{step.label}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-white">{step.count.toLocaleString()}</div>
                        <div className="text-[10px] text-[#9ca3af]">
                          {i === 0 ? '100%' : `${step.conversionRate.toFixed(1)}%`}
                        </div>
                      </div>
                    </div>
                    {i < funnelSteps.length - 1 && (
                      <div className="flex flex-col items-center py-1">
                        <div className="text-[10px] text-[#ef4444] flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" />
                          流失 {step.dropoffRate.toFixed(1)}%
                        </div>
                        <div className="w-px h-3 bg-[#2e2e42]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="glass-card p-4">
              <div className="text-sm text-[#6b7280] mb-1">总用户数</div>
              <div className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#7c3aed]" />
                {data?.totalUsers.toLocaleString()}
              </div>
            </div>
            <div className="glass-card p-4">
              <div className="text-sm text-[#6b7280] mb-1">整体转化率</div>
              <div className="text-xl font-bold text-white">
                {funnelSteps.length > 0 && maxCount > 0
                  ? ((funnelSteps[funnelSteps.length - 1].count / maxCount) * 100).toFixed(2)
                  : '0.00'}%
              </div>
            </div>
            <div className="glass-card p-4">
              <div className="text-sm text-[#6b7280] mb-1">最大流失环节</div>
              <div className="text-xl font-bold text-[#ef4444]">
                {funnelSteps.length > 0
                  ? (() => {
                      let maxDropIdx = 0;
                      let maxDrop = 0;
                      funnelSteps.forEach((s, i) => {
                        if (s.dropoffRate > maxDrop) {
                          maxDrop = s.dropoffRate;
                          maxDropIdx = i;
                        }
                      });
                      return `${funnelSteps[maxDropIdx > 0 ? maxDropIdx - 1 : 0].label} → ${funnelSteps[maxDropIdx > 0 ? maxDropIdx : 1].label}`;
                    })()
                  : '-'}
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-[#ef4444]" />
              流失分析
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2e2e42]">
                    <th className="text-left py-3 px-4 text-[#6b7280] font-medium">流失环节</th>
                    <th className="text-right py-3 px-4 text-[#6b7280] font-medium">流失人数</th>
                    <th className="text-right py-3 px-4 text-[#6b7280] font-medium">流失率</th>
                    <th className="text-left py-3 px-4 text-[#6b7280] font-medium">趋势</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.dropoff.map((item, i) => {
                    const stepFrom = STEPS.find(s => s.key === item.from);
                    const stepTo = STEPS.find(s => s.key === item.to);
                    return (
                      <tr key={i} className="border-b border-[#2e2e42]/50 hover:bg-[#1e1e2e]/50">
                        <td className="py-3 px-4 text-white">
                          {stepFrom?.label || item.from} → {stepTo?.label || item.to}
                        </td>
                        <td className="py-3 px-4 text-right text-[#ef4444] font-medium">{item.lost.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            item.rate > 60
                              ? 'bg-[#ef4444]/20 text-[#ef4444]'
                              : item.rate > 30
                              ? 'bg-[#f59e0b]/20 text-[#f59e0b]'
                              : 'bg-[#10b981]/20 text-[#10b981]'
                          }`}>
                            {item.rate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="w-full bg-[#1e1e2e] rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                item.rate > 60 ? 'bg-[#ef4444]' : item.rate > 30 ? 'bg-[#f59e0b]' : 'bg-[#10b981]'
                              }`}
                              style={{ width: `${Math.min(item.rate, 100)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
