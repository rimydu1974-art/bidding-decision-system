'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Shield,
  RotateCcw,
  Users,
  Filter,
  X,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  status: string;
  plan: string;
  planExpiresAt: string | null;
  aiQuotaUsed: number;
  totalAiCalls: number;
  totalOrders: number;
  totalSpent: number;
  lastLoginAt: string | null;
  createdAt: string;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const PLAN_MAP: Record<string, string> = {
  free: '免费版',
  single: '单次基础版',
  pro: '专业会员版',
  'pro-year': '专业版年付',
  enterprise: '企业版',
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: '正常', color: 'text-[#10b981]' },
  disabled: { label: '禁用', color: 'text-[#ef4444]' },
  suspended: { label: '暂停', color: 'text-[#f59e0b]' },
};

export default function AdminUsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '20');
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (planFilter) params.set('plan', planFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, planFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const clearFilters = () => {
    setSearch('');
    setSearchInput('');
    setStatusFilter('');
    setPlanFilter('');
    setPage(1);
  };

  const hasFilters = search || statusFilter || planFilter;

  const handleAction = async (userId: string, action: string, value?: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, value }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || '操作失败');
      }
    } catch {
      alert('请求失败');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMoney = (amount: number) => {
    return amount >= 1 ? `¥${amount.toFixed(0)}` : '-';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">用户管理</h1>
          <p className="text-sm text-[#6b7280] mt-1">
            {data ? `共 ${data.total} 位用户` : '加载中...'}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
              <input
                type="text"
                placeholder="搜索邮箱、姓名、手机号..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <button type="submit" className="btn-primary">
              搜索
            </button>
          </form>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-ghost ${showFilters ? 'bg-[#7c3aed]/10 border-[rgba(167,139,250,0.45)]' : ''}`}
          >
            <Filter className="w-4 h-4" />
            筛选
            {hasFilters && (
              <span className="w-2 h-2 rounded-full bg-[#7c3aed] ml-1" />
            )}
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-ghost">
              <X className="w-4 h-4" />
              清除
            </button>
          )}
        </div>

        {showFilters && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#2e2e42]">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#6b7280]">状态:</span>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="input-field w-auto"
              >
                <option value="">全部</option>
                <option value="active">正常</option>
                <option value="disabled">禁用</option>
                <option value="suspended">暂停</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#6b7280]">套餐:</span>
              <select
                value={planFilter}
                onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
                className="input-field w-auto"
              >
                <option value="">全部</option>
                <option value="free">免费版</option>
                <option value="single">单次基础版</option>
                <option value="pro">专业会员版</option>
                <option value="pro-year">专业版年付</option>
                <option value="enterprise">企业版</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#6b7280] text-sm">
            加载中...
          </div>
        ) : !data || data.users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-[#6b7280] mx-auto mb-3" />
            <p className="text-[#6b7280] text-sm">暂无用户数据</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2e2e42]">
                  <th className="text-left px-4 py-3 text-[#6b7280] font-medium">邮箱</th>
                  <th className="text-left px-4 py-3 text-[#6b7280] font-medium">姓名</th>
                  <th className="text-left px-4 py-3 text-[#6b7280] font-medium">手机</th>
                  <th className="text-left px-4 py-3 text-[#6b7280] font-medium">套餐</th>
                  <th className="text-left px-4 py-3 text-[#6b7280] font-medium">状态</th>
                  <th className="text-left px-4 py-3 text-[#6b7280] font-medium">AI用量</th>
                  <th className="text-left px-4 py-3 text-[#6b7280] font-medium">订单</th>
                  <th className="text-left px-4 py-3 text-[#6b7280] font-medium">最后登录</th>
                  <th className="text-right px-4 py-3 text-[#6b7280] font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => {
                  const statusInfo = STATUS_MAP[user.status] || STATUS_MAP.active;
                  const isBusy = actionLoading === user.id;

                  return (
                    <tr
                      key={user.id}
                      className="border-b border-[#2e2e42]/50 hover:bg-[#1e1e2e]/40 transition-colors"
                    >
                      <td className="px-4 py-3 text-white font-medium max-w-[200px] truncate">
                        {user.email}
                      </td>
                      <td className="px-4 py-3 text-[#9ca3af]">
                        {user.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-[#9ca3af]">
                        {user.phone || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-[#7c3aed]/15 text-[#a78bfa]">
                          {PLAN_MAP[user.plan] || user.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${statusInfo.color}`}>
                          {user.status === 'active' ? (
                            <UserCheck className="w-3 h-3" />
                          ) : (
                            <UserX className="w-3 h-3" />
                          )}
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#9ca3af]">
                        {user.aiQuotaUsed}
                      </td>
                      <td className="px-4 py-3 text-[#9ca3af]">
                        {user.totalOrders}
                      </td>
                      <td className="px-4 py-3 text-[#6b7280] text-xs">
                        {formatDate(user.lastLoginAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleAction(user.id, 'toggleStatus')}
                            disabled={isBusy}
                            className="p-1.5 rounded-lg hover:bg-[#1e1e2e] transition-colors group"
                            title={user.status === 'active' ? '禁用' : '启用'}
                          >
                            {user.status === 'active' ? (
                              <UserX className="w-4 h-4 text-[#6b7280] group-hover:text-[#ef4444] transition-colors" />
                            ) : (
                              <UserCheck className="w-4 h-4 text-[#6b7280] group-hover:text-[#10b981] transition-colors" />
                            )}
                          </button>

                          <div className="relative group">
                            <button
                              className="p-1.5 rounded-lg hover:bg-[#1e1e2e] transition-colors"
                              title="设置角色"
                            >
                              <Shield className="w-4 h-4 text-[#6b7280] group-hover:text-[#a78bfa] transition-colors" />
                            </button>
                            <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10">
                              <div className="glass-card p-1 min-w-[100px] shadow-lg">
                                {['user', 'admin'].map((role) => (
                                  <button
                                    key={role}
                                    onClick={() => handleAction(user.id, 'setRole', role)}
                                    disabled={isBusy || user.role === role}
                                    className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
                                      user.role === role
                                        ? 'text-[#a78bfa] bg-[#7c3aed]/10'
                                        : 'text-[#9ca3af] hover:bg-[#1e1e2e]'
                                    }`}
                                  >
                                    {role === 'admin' ? '管理员' : '普通用户'}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleAction(user.id, 'resetQuota')}
                            disabled={isBusy}
                            className="p-1.5 rounded-lg hover:bg-[#1e1e2e] transition-colors group"
                            title="重置AI配额"
                          >
                            <RotateCcw className="w-4 h-4 text-[#6b7280] group-hover:text-[#f59e0b] transition-colors" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#2e2e42]">
            <span className="text-xs text-[#6b7280]">
              第 {data.page} / {data.totalPages} 页
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                let pageNum: number;
                if (data.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= data.totalPages - 2) {
                  pageNum = data.totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-[#7c3aed] text-white'
                        : 'text-[#9ca3af] hover:bg-[#1e1e2e]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="btn-ghost disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
