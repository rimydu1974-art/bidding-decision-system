'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  FolderOpen,
  ShoppingCart,
  DollarSign,
  Cpu,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

interface DashboardStats {
  users: { total: number; today: number };
  projects: { total: number; today: number };
  orders: { total: number; month: number };
  revenue: { month: number };
  aiCost: { total: number; month: number };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(res => res.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-[#6b7280] text-sm">加载中...</div>;
  }

  if (!stats) {
    return <div className="text-[#6b7280] text-sm">加载失败</div>;
  }

  const cards = [
    { label: '总用户', value: stats.users.total, today: stats.users.today, icon: Users, color: '#7c3aed' },
    { label: '总项目', value: stats.projects.total, today: stats.projects.today, icon: FolderOpen, color: '#06b6d4' },
    { label: '本月订单', value: stats.orders.month, icon: ShoppingCart, color: '#10b981' },
    { label: '本月收入', value: `¥${stats.revenue.month.toFixed(0)}`, icon: DollarSign, color: '#f59e0b' },
    { label: '本月AI成本', value: `¥${stats.aiCost.month.toFixed(2)}`, icon: Cpu, color: '#ef4444' },
    { label: '利润', value: `¥${(stats.revenue.month - stats.aiCost.month).toFixed(0)}`, icon: TrendingUp, color: '#10b981' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">管理仪表盘</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[#6b7280]">{card.label}</span>
                <Icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <div className="text-2xl font-bold text-white">{card.value}</div>
              {card.today !== undefined && (
                <div className="text-xs text-[#6b7280] mt-1">今日 +{card.today}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-white mb-4">快捷操作</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <a href="/admin/users" className="btn-secondary text-center text-sm py-3">
            👥 用户管理
          </a>
          <a href="/admin/ai-cost" className="btn-secondary text-center text-sm py-3">
            🤖 AI成本监控
          </a>
          <a href="/admin/behavior" className="btn-secondary text-center text-sm py-3">
            📈 行为漏斗
          </a>
          <a href="/admin/settings" className="btn-secondary text-center text-sm py-3">
            ⚙️ 系统配置
          </a>
        </div>
      </div>
    </div>
  );
}
