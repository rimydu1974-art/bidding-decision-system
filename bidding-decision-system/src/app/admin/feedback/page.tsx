'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MessageSquare, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';

interface Feedback {
  id: string;
  email: string;
  reason: string;
  content: string | null;
  page: string;
  createdAt: string;
}

interface FeedbackResponse {
  feedbacks: Feedback[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const REASONS = ['太贵', '分析价值不够', '先试试', '已有工具', '公司流程', '其他'];

export default function FeedbackPage() {
  const [data, setData] = useState<FeedbackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reasonFilter, setReasonFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '20');
      if (reasonFilter) params.set('reason', reasonFilter);

      const res = await fetch(`/api/admin/feedback?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
    } finally {
      setLoading(false);
    }
  }, [page, reasonFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const clearFilters = () => {
    setReasonFilter('');
    setPage(1);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <MessageSquare className="w-7 h-7 text-[#a78bfa]" />
          用户反馈
        </h1>
        <p className="text-sm text-[#6b7280] mt-1">
          {data ? `共 ${data.total} 条反馈` : '加载中...'}
        </p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-[#9ca3af] text-sm">
            <Filter className="w-4 h-4" />
            <span>筛选原因:</span>
          </div>
          <div className="flex gap-1 flex-wrap">
            {REASONS.map(r => (
              <button
                key={r}
                onClick={() => { setReasonFilter(r === reasonFilter ? '' : r); setPage(1); }}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                  reasonFilter === r
                    ? 'bg-[#7c3aed]/20 text-[#a78bfa] border border-[#7c3aed]/30'
                    : 'text-[#6b7280] hover:text-[#9ca3af] hover:bg-[#1e1e2e] border border-transparent'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          {reasonFilter && (
            <button onClick={clearFilters} className="btn-ghost text-xs">
              <X className="w-3 h-3 mr-1" />
              清除
            </button>
          )}
        </div>
      </div>

      {/* Feedback Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#6b7280] text-sm">加载中...</div>
        ) : !data || data.feedbacks.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-10 h-10 text-[#6b7280] mx-auto mb-3" />
            <p className="text-[#6b7280] text-sm">暂无反馈数据</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2e2e42]">
                  <th className="text-left px-4 py-3 text-[#6b7280] font-medium">用户邮箱</th>
                  <th className="text-left px-4 py-3 text-[#6b7280] font-medium">原因</th>
                  <th className="text-left px-4 py-3 text-[#6b7280] font-medium">内容</th>
                  <th className="text-left px-4 py-3 text-[#6b7280] font-medium">页面</th>
                  <th className="text-left px-4 py-3 text-[#6b7280] font-medium">创建时间</th>
                </tr>
              </thead>
              <tbody>
                {data.feedbacks.map(f => (
                  <tr
                    key={f.id}
                    className="border-b border-[#2e2e42]/50 hover:bg-[#1e1e2e]/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-white font-medium max-w-[200px] truncate">
                      {f.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-[#7c3aed]/15 text-[#a78bfa]">
                        {f.reason}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#9ca3af] max-w-[280px] truncate">
                      {f.content || '-'}
                    </td>
                    <td className="px-4 py-3 text-[#6b7280] text-xs">{f.page}</td>
                    <td className="px-4 py-3 text-[#6b7280] text-xs">
                      {formatDate(f.createdAt)}
                    </td>
                  </tr>
                ))}
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
