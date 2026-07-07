'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Filter,
  X,
  CheckCircle,
  Clock,
  RotateCcw,
  CreditCard,
  Wallet,
  Image,
  Eye,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface Order {
  id: string;
  orderNo: string;
  userEmail: string;
  planName: string;
  amount: number;
  paymentMethod: string | null;
  paymentStatus: string;
  screenshotUrl: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  paidAt: string | null;
}

interface OrdersResponse {
  orders: Order[];
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

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: '待支付', color: 'text-[#f59e0b]', icon: Clock },
  paid: { label: '已支付', color: 'text-[#10b981]', icon: CheckCircle },
  refunded: { label: '已退款', color: 'text-[#ef4444]', icon: RotateCcw },
  failed: { label: '失败', color: 'text-[#ef4444]', icon: XCircle },
};

const METHOD_MAP: Record<string, { label: string; icon: typeof CreditCard }> = {
  alipay: { label: '支付宝', icon: CreditCard },
  wechat: { label: '微信支付', icon: Wallet },
  manual: { label: '手动', icon: Wallet },
};

export default function AdminOrdersPage() {
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNote, setReviewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', '20');
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const clearFilters = () => {
    setSearch('');
    setSearchInput('');
    setStatusFilter('');
    setPage(1);
  };

  const hasFilters = search || statusFilter;

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
    return `¥${amount.toFixed(2)}`;
  };

  const handleReview = async () => {
    if (!selectedOrder) return;
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/orders/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          action: reviewAction,
          note: reviewNote,
        }),
      });

      if (res.ok) {
        setShowReviewModal(false);
        setSelectedOrder(null);
        setReviewNote('');
        fetchOrders(); // Refresh list
      } else {
        const err = await res.json();
        alert(err.error || '审核失败');
      }
    } catch (error) {
      console.error('Review error:', error);
      alert('审核失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">订单管理</h1>
          <p className="text-sm text-[#6b7280] mt-1">
            {data ? `共 ${data.total} 条订单` : '加载中...'}
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
                placeholder="搜索订单号、用户邮箱..."
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
                <option value="pending">待支付</option>
                <option value="paid">已支付</option>
                <option value="refunded">已退款</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#6b7280] text-sm">
            加载中...
          </div>
        ) : !data || data.orders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingCart className="w-10 h-10 text-[#6b7280] mx-auto mb-3" />
            <p className="text-[#6b7280] text-sm">暂无订单数据</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2e2e42]">
                  <th className="text-left px-4 py-3 text-[#6b7280] font-medium">订单号</th>
                  <th className="text-left px-4 py-3 text-[#6b7280] font-medium">用户邮箱</th>
                  <th className="text-left px-4 py-3 text-[#6b7280] font-medium">套餐</th>
                  <th className="text-right px-4 py-3 text-[#6b7280] font-medium">金额</th>
                  <th className="text-left px-4 py-3 text-[#6b7280] font-medium">支付方式</th>
                  <th className="text-left px-4 py-3 text-[#6b7280] font-medium">截图</th>
                  <th className="text-left px-4 py-3 text-[#6b7280] font-medium">状态</th>
                  <th className="text-left px-4 py-3 text-[#6b7280] font-medium">创建时间</th>
                  <th className="text-left px-4 py-3 text-[#6b7280] font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((order) => {
                  const statusInfo = STATUS_MAP[order.paymentStatus] || STATUS_MAP.pending;
                  const methodInfo = order.paymentMethod ? METHOD_MAP[order.paymentMethod] : null;
                  const StatusIcon = statusInfo.icon;
                  const MethodIcon = methodInfo?.icon || CreditCard;

                  return (
                    <tr
                      key={order.id}
                      className="border-b border-[#2e2e42]/50 hover:bg-[#1e1e2e]/40 transition-colors"
                    >
                      <td className="px-4 py-3 text-white font-mono text-xs">
                        {order.orderNo}
                      </td>
                      <td className="px-4 py-3 text-[#9ca3af] max-w-[200px] truncate">
                        {order.userEmail}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-[#7c3aed]/15 text-[#a78bfa]">
                          {PLAN_MAP[order.planName] || order.planName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white text-right font-medium">
                        {formatMoney(order.amount)}
                      </td>
                      <td className="px-4 py-3">
                        {methodInfo ? (
                          <span className="inline-flex items-center gap-1 text-xs text-[#9ca3af]">
                            <MethodIcon className="w-3 h-3" />
                            {methodInfo.label}
                          </span>
                        ) : (
                          <span className="text-[#6b7280]">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {order.screenshotUrl ? (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowReviewModal(true);
                            }}
                            className="inline-flex items-center gap-1 text-xs text-[#10b981] hover:text-[#34d399]"
                          >
                            <Image className="w-3 h-3" />
                            查看
                          </button>
                        ) : (
                          <span className="text-[#6b7280] text-xs">无</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#6b7280] text-xs">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {order.screenshotUrl && order.paymentStatus === 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowReviewModal(true);
                            }}
                            className="text-xs text-[#a78bfa] hover:text-[#c4b5fd]"
                          >
                            审核
                          </button>
                        )}
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

      {/* Review Modal */}
      {showReviewModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold text-white mb-4">审核订单</h3>
            
            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-[#6b7280]">订单号</span>
                <span className="text-white font-mono">{selectedOrder.orderNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">用户</span>
                <span className="text-[#9ca3af]">{selectedOrder.userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b7280]">金额</span>
                <span className="text-white font-medium">{formatMoney(selectedOrder.amount)}</span>
              </div>
            </div>

            {/* Screenshot Preview */}
            {selectedOrder.screenshotUrl && (
              <div className="mb-4">
                <p className="text-sm text-[#6b7280] mb-2">支付截图</p>
                <div className="bg-[#0f0f1a] rounded-lg p-2">
                  <img 
                    src={selectedOrder.screenshotUrl} 
                    alt="支付截图" 
                    className="w-full max-h-64 object-contain rounded"
                  />
                </div>
              </div>
            )}

            {/* Review Action */}
            <div className="mb-4">
              <p className="text-sm text-[#6b7280] mb-2">审核操作</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setReviewAction('approve')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    reviewAction === 'approve'
                      ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/50'
                      : 'bg-[#1e1e2e] text-[#6b7280] hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 inline mr-1" />
                  通过
                </button>
                <button
                  onClick={() => setReviewAction('reject')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    reviewAction === 'reject'
                      ? 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/50'
                      : 'bg-[#1e1e2e] text-[#6b7280] hover:text-white'
                  }`}
                >
                  <XCircle className="w-4 h-4 inline mr-1" />
                  拒绝
                </button>
              </div>
            </div>

            {/* Review Note */}
            <div className="mb-4">
              <p className="text-sm text-[#6b7280] mb-2">审核备注</p>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="可选填写审核备注..."
                className="input-field w-full h-20 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedOrder(null);
                  setReviewNote('');
                }}
                className="flex-1 btn-ghost"
              >
                取消
              </button>
              <button
                onClick={handleReview}
                disabled={submitting}
                className="flex-1 btn-primary"
              >
                {submitting ? '提交中...' : '确认提交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
