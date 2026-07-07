'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Cpu,
  Users,
  DollarSign,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  Zap,
  Activity,
  Filter,
} from 'lucide-react';

interface ModelStat {
  model: string;
  cost: number;
  tokens: number;
  count: number;
}

interface TopUser {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  totalCost: number;
  totalCalls: number;
}

interface AlertUser {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  totalPaid: number;
  totalCost: number;
}

interface DailyStat {
  date: string;
  cost: number;
  tokens: number;
  count: number;
}

interface AiCostData {
  total: {
    cost: number;
    tokens: number;
    promptTokens: number;
    completionTokens: number;
    count: number;
  };
  byModel: ModelStat[];
  daily: DailyStat[];
  topUsers: TopUser[];
  alerts: AlertUser[];
}

const MODEL_LABELS: Record<string, string> = {
  deepseek: 'DeepSeek',
  tongyi: '通义千问',
  zhipu: '智谱',
  moonshot: '月之暗面',
  baichuan: '百川',
  spark: '讯飞星火',
  ernie: '文心一言',
  gemini: 'Gemini',
  gpt: 'GPT',
};

function getModelLabel(model: string): string {
  const key = model.toLowerCase();
  for (const [k, v] of Object.entries(MODEL_LABELS)) {
    if (key.includes(k)) return v;
  }
  return model;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toFixed(0);
}

export default function AiCostPage() {
  const [data, setData] = useState<AiCostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate && endDate) {
        params.set('startDate', startDate);
        params.set('endDate', endDate);
      } else {
        params.set('days', String(days));
      }
      const res = await fetch(`/api/admin/ai-cost?${params}`);
      const json = await res.json();
      if (!res.ok || !json.total) {
        console.error('AI cost API error:', json.error || 'No total data');
        setData(null);
        return;
      }
      setData(json);
    } catch (e) {
      console.error('Failed to fetch AI cost data:', e);
    } finally {
      setLoading(false);
    }
  }, [days, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleQuickDays = (d: number) => {
    setDays(d);
    setStartDate('');
    setEndDate('');
  };

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

  const avgCostPerCall = data.total?.count > 0 ? data.total.cost / data.total.count : 0;

  const summaryCards = [
    {
      label: '总成本',
      value: `¥${(data.total?.cost || 0).toFixed(2)}`,
      icon: DollarSign,
      color: '#ef4444',
    },
    {
      label: '总 Tokens',
      value: formatNumber(data.total?.tokens || 0),
      sub: `提示 ${formatNumber(data.total?.promptTokens || 0)} / 补全 ${formatNumber(data.total?.completionTokens || 0)}`,
      icon: Zap,
      color: '#f59e0b',
    },
    {
      label: '总调用次数',
      value: formatNumber(data.total?.count || 0),
      icon: Activity,
      color: '#06b6d4',
    },
    {
      label: '平均成本/次',
      value: `¥${avgCostPerCall.toFixed(4)}`,
      icon: TrendingUp,
      color: '#10b981',
    },
  ];

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Cpu className="w-7 h-7 text-[#a78bfa]" />
            AI 成本监控
          </h1>
          <p className="text-sm text-[#6b7280] mt-1">追踪各模型调用成本与用户消耗情况</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-[#9ca3af] text-sm">
            <Filter className="w-4 h-4" />
            <span>时间范围:</span>
          </div>
          <div className="flex gap-1">
            {[7, 15, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => handleQuickDays(d)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                  days === d && !startDate && !endDate
                    ? 'bg-[#7c3aed]/20 text-[#a78bfa] border border-[#7c3aed]/30'
                    : 'text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#1e1e2e] border border-transparent'
                }`}
              >
                {d}天
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-2">
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="input-field text-xs py-1.5 px-3 w-auto"
            />
            <span className="text-[#6b7280] text-xs">至</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="input-field text-xs py-1.5 px-3 w-auto"
            />
            {(startDate || endDate) && (
              <button onClick={fetchData} className="btn-primary text-xs py-1.5 px-3">
                查询
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[#6b7280]">{card.label}</span>
                <Icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <div className="text-2xl font-bold text-white">{card.value}</div>
              {card.sub && <div className="text-xs text-[#6b7280] mt-1">{card.sub}</div>}
            </div>
          );
        })}
      </div>

      {/* Model Breakdown */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#06b6d4]" />
          按模型统计
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2e2e42]">
                <th className="text-left py-3 px-4 text-[#6b7280] font-medium">模型</th>
                <th className="text-right py-3 px-4 text-[#6b7280] font-medium">调用次数</th>
                <th className="text-right py-3 px-4 text-[#6b7280] font-medium">Token 数</th>
                <th className="text-right py-3 px-4 text-[#6b7280] font-medium">成本 (¥)</th>
                <th className="text-right py-3 px-4 text-[#6b7280] font-medium">占比</th>
                <th className="text-left py-3 px-4 text-[#6b7280] font-medium min-w-[120px]">分布</th>
              </tr>
            </thead>
            <tbody>
              {data.byModel.map(m => {
                const pct = (data.total?.cost || 0) > 0 ? (m.cost / data.total.cost) * 100 : 0;
                return (
                  <tr key={m.model} className="border-b border-[#2e2e42]/50 hover:bg-[#1e1e2e]/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-[#a78bfa]" />
                        <span className="text-white font-medium">{getModelLabel(m.model)}</span>
                        <span className="text-[#4b5563] text-xs">{m.model}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 text-[#9ca3af]">{formatNumber(m.count)}</td>
                    <td className="text-right py-3 px-4 text-[#9ca3af]">{formatNumber(m.tokens)}</td>
                    <td className="text-right py-3 px-4 text-white font-medium">¥{m.cost.toFixed(2)}</td>
                    <td className="text-right py-3 px-4 text-[#9ca3af]">{pct.toFixed(1)}%</td>
                    <td className="py-3 px-4">
                      <div className="w-full bg-[#2e2e42] rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, #7c3aed, #06b6d4)`,
                          }}
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

      {/* Daily Trend */}
      {data.daily.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#f59e0b]" />
            每日趋势
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2e2e42]">
                  <th className="text-left py-3 px-4 text-[#6b7280] font-medium">日期</th>
                  <th className="text-right py-3 px-4 text-[#6b7280] font-medium">调用次数</th>
                  <th className="text-right py-3 px-4 text-[#6b7280] font-medium">Token 数</th>
                  <th className="text-right py-3 px-4 text-[#6b7280] font-medium">成本 (¥)</th>
                </tr>
              </thead>
              <tbody>
                {data.daily.map((d, i) => (
                  <tr key={i} className="border-b border-[#2e2e42]/50 hover:bg-[#1e1e2e]/50 transition-colors">
                    <td className="py-3 px-4 text-white">{new Date(d.date).toLocaleDateString('zh-CN')}</td>
                    <td className="text-right py-3 px-4 text-[#9ca3af]">{formatNumber(Number(d.count))}</td>
                    <td className="text-right py-3 px-4 text-[#9ca3af]">{formatNumber(Number(d.tokens))}</td>
                    <td className="text-right py-3 px-4 text-white font-medium">¥{Number(d.cost).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Users */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#06b6d4]" />
          高消耗用户 Top 10
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2e2e42]">
                <th className="text-left py-3 px-4 text-[#6b7280] font-medium">#</th>
                <th className="text-left py-3 px-4 text-[#6b7280] font-medium">用户</th>
                <th className="text-left py-3 px-4 text-[#6b7280] font-medium">套餐</th>
                <th className="text-right py-3 px-4 text-[#6b7280] font-medium">调用次数</th>
                <th className="text-right py-3 px-4 text-[#6b7280] font-medium">总成本 (¥)</th>
                <th className="text-right py-3 px-4 text-[#6b7280] font-medium">平均/次 (¥)</th>
              </tr>
            </thead>
            <tbody>
              {data.topUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#6b7280]">暂无数据</td>
                </tr>
              ) : (
                data.topUsers.map((u, i) => {
                  const avg = u.totalCalls > 0 ? u.totalCost / u.totalCalls : 0;
                  return (
                    <tr key={u.id} className="border-b border-[#2e2e42]/50 hover:bg-[#1e1e2e]/50 transition-colors">
                      <td className="py-3 px-4 text-[#6b7280]">{i + 1}</td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="text-white font-medium">{u.name || u.email}</div>
                          {u.name && <div className="text-xs text-[#4b5563]">{u.email}</div>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 text-xs rounded-full bg-[#7c3aed]/15 text-[#a78bfa]">
                          {u.plan}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-[#9ca3af]">{u.totalCalls}</td>
                      <td className="text-right py-3 px-4 text-white font-medium">¥{u.totalCost.toFixed(2)}</td>
                      <td className="text-right py-3 px-4 text-[#9ca3af]">¥{avg.toFixed(4)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerts */}
      <div className="glass-card p-6 border border-[#ef4444]/20">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[#ef4444]" />
          成本预警
          <span className="text-xs text-[#ef4444] bg-[#ef4444]/10 px-2 py-0.5 rounded-full ml-2">
            成本 &gt; 收入
          </span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2e2e42]">
                <th className="text-left py-3 px-4 text-[#6b7280] font-medium">用户</th>
                <th className="text-left py-3 px-4 text-[#6b7280] font-medium">套餐</th>
                <th className="text-right py-3 px-4 text-[#6b7280] font-medium">已付金额 (¥)</th>
                <th className="text-right py-3 px-4 text-[#6b7280] font-medium">AI成本 (¥)</th>
                <th className="text-right py-3 px-4 text-[#6b7280] font-medium">亏损 (¥)</th>
              </tr>
            </thead>
            <tbody>
              {data.alerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#6b7280]">暂无预警</td>
                </tr>
              ) : (
                data.alerts.map((u) => {
                  const loss = u.totalCost - u.totalPaid;
                  return (
                    <tr key={u.id} className="border-b border-[#2e2e42]/50 hover:bg-[#ef4444]/5 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <div className="text-white font-medium">{u.name || u.email}</div>
                          {u.name && <div className="text-xs text-[#4b5563]">{u.email}</div>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 text-xs rounded-full bg-[#7c3aed]/15 text-[#a78bfa]">
                          {u.plan}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-[#9ca3af]">¥{u.totalPaid.toFixed(2)}</td>
                      <td className="text-right py-3 px-4 text-[#ef4444] font-medium">¥{u.totalCost.toFixed(2)}</td>
                      <td className="text-right py-3 px-4 text-[#ef4444] font-bold">¥{loss.toFixed(2)}</td>
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
