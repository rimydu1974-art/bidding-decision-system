'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { BarChart3, Download } from 'lucide-react';

interface IndustryStat {
  industry: string;
  count: number;
}

interface AnalyticsData {
  industries: IndustryStat[];
  totalProjects: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedMonth) params.set('month', selectedMonth);
      const res = await fetch(`/api/admin/analytics?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (selectedMonth) params.set('month', selectedMonth);
      const res = await fetch(`/api/admin/export/industry?${params.toString()}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `industry_stats_${selectedMonth || 'all'}_${Date.now()}.csv`;
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

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedMonth(e.target.value);
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

  const maxCount = data.industries.length > 0
    ? Math.max(...data.industries.map(i => i.count))
    : 1;

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-[#a78bfa]" />
            行业统计
          </h1>
          <p className="text-sm text-[#6b7280] mt-1">
            共 {data.totalProjects} 个项目，涵盖 {data.industries.length} 个行业
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={handleMonthChange}
            className="bg-[#1e1e2e] border border-[#2e2e42] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#7c3aed]/50"
          />
          {selectedMonth && (
            <button
              onClick={() => setSelectedMonth('')}
              className="text-xs text-[#6b7280] hover:text-white transition-colors"
            >
              清除
            </button>
          )}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#1e1e2e] text-[#9ca3af] hover:text-white hover:bg-[#2e2e42] transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? '导出中...' : '导出CSV'}
          </button>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-white mb-6">
          项目行业分布 {selectedMonth && `(${selectedMonth})`}
        </h2>
        {data.industries.length === 0 ? (
          <div className="text-center py-12 text-[#6b7280] text-sm">暂无行业数据</div>
        ) : (
          <div className="space-y-4">
            {data.industries.map(item => {
              const pct = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
              return (
                <div key={item.industry} className="flex items-center gap-4">
                  <span className="text-sm text-[#9ca3af] w-32 text-right truncate flex-shrink-0">
                    {item.industry}
                  </span>
                  <div className="flex-1 bg-[#2e2e42] rounded-full h-7 relative overflow-hidden">
                    <div
                      className="h-7 rounded-full transition-all duration-700 flex items-center justify-end pr-3"
                      style={{
                        width: `${Math.max(pct, 8)}%`,
                        background: 'linear-gradient(90deg, #7c3aed, #06b6d4)',
                      }}
                    >
                      <span className="text-xs text-white font-medium">{item.count}</span>
                    </div>
                  </div>
                  <span className="text-xs text-[#6b7280] w-12 text-right">
                    {data.totalProjects > 0
                      ? ((item.count / data.totalProjects) * 100).toFixed(1) + '%'
                      : '0%'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2e2e42]">
          <h2 className="text-lg font-bold text-white">行业明细</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2e2e42]">
                <th className="text-left px-6 py-3 text-[#6b7280] font-medium">#</th>
                <th className="text-left px-6 py-3 text-[#6b7280] font-medium">行业</th>
                <th className="text-right px-6 py-3 text-[#6b7280] font-medium">项目数</th>
                <th className="text-right px-6 py-3 text-[#6b7280] font-medium">占比</th>
                <th className="text-left px-6 py-3 text-[#6b7280] font-medium min-w-[140px]">分布</th>
              </tr>
            </thead>
            <tbody>
              {data.industries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#6b7280]">暂无数据</td>
                </tr>
              ) : (
                data.industries.map((item, idx) => {
                  const pct = data.totalProjects > 0
                    ? (item.count / data.totalProjects) * 100
                    : 0;
                  return (
                    <tr
                      key={item.industry}
                      className="border-b border-[#2e2e42]/50 hover:bg-[#1e1e2e]/50 transition-colors"
                    >
                      <td className="px-6 py-3 text-[#6b7280]">{idx + 1}</td>
                      <td className="px-6 py-3 text-white font-medium">{item.industry}</td>
                      <td className="px-6 py-3 text-right text-[#9ca3af]">{item.count}</td>
                      <td className="px-6 py-3 text-right text-[#9ca3af]">{pct.toFixed(1)}%</td>
                      <td className="px-6 py-3">
                        <div className="w-full bg-[#2e2e42] rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background: 'linear-gradient(90deg, #7c3aed, #06b6d4)',
                            }}
                          />
                        </div>
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
