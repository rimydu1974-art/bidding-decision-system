'use client';

import React, { useState } from 'react';
import { Download, Users, ShoppingCart, Cpu, Activity, BarChart3 } from 'lucide-react';

interface ExportButton {
  label: string;
  description: string;
  type: string;
  endpoint: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const EXPORTS: ExportButton[] = [
  {
    label: '导出用户数据',
    description: '所有注册用户的详细信息（邮箱、套餐、消费等）',
    type: 'users',
    endpoint: '/api/admin/export/users',
    icon: Users,
    color: '#06b6d4',
  },
  {
    label: '导出订单数据',
    description: '所有支付订单记录（订单号、金额、状态等）',
    type: 'orders',
    endpoint: '/api/admin/export/orders',
    icon: ShoppingCart,
    color: '#10b981',
  },
  {
    label: '导出AI使用数据',
    description: '所有AI模型调用记录（模型、Token、成本等）',
    type: 'ai-usage',
    endpoint: '/api/admin/export/ai-usage',
    icon: Cpu,
    color: '#f59e0b',
  },
  {
    label: '导出行为漏斗',
    description: '用户行为转化漏斗数据（注册→支付完整链路）',
    type: 'behavior',
    endpoint: '/api/admin/export/behavior',
    icon: Activity,
    color: '#7c3aed',
  },
  {
    label: '导出行业数据',
    description: '招标项目行业分类统计（含占比分析）',
    type: 'industry',
    endpoint: '/api/admin/export/industry',
    icon: BarChart3,
    color: '#06b6d4',
  },
];

export default function ExportPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (item: ExportButton) => {
    setLoading(item.type);
    try {
      const res = await fetch(item.endpoint);
      if (res.ok) {
        const blob = await res.blob();
        const disposition = res.headers.get('Content-Disposition');
        let filename = `${item.type}_${Date.now()}.csv`;
        if (disposition) {
          const match = disposition.match(/filename="?([^";\n]+)"?/);
          if (match) filename = match[1];
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
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
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Download className="w-7 h-7 text-[#a78bfa]" />
          数据导出
        </h1>
        <p className="text-sm text-[#6b7280] mt-1">导出系统数据为CSV文件</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {EXPORTS.map(item => {
          const Icon = item.icon;
          const isLoading = loading === item.type;

          return (
            <div
              key={item.type}
              className="glass-card p-6 flex flex-col items-center text-center"
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${item.color}15` }}
              >
                <span style={{ color: item.color }}><Icon className="w-7 h-7" /></span>
              </div>

              <h3 className="text-lg font-bold text-white mb-2">{item.label}</h3>
              <p className="text-sm text-[#6b7280] mb-6 flex-1">{item.description}</p>

              <button
                onClick={() => handleExport(item)}
                disabled={isLoading}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    导出中...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    下载 CSV
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
