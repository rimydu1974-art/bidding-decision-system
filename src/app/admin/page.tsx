'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/sidebar';
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ShieldCheck,
  Search,
  FileText,
  User as UserIcon,
  DollarSign,
  Calendar,
  MessageSquare,
} from 'lucide-react';

interface Order {
  id: string;
  orderNo: string;
  planName: string;
  amount: number;
  paymentStatus: string;
  createdAt: string;
  user?: { email: string; name: string };
  metadata: {
    payerName?: string;
    transactionId?: string;
    screenshot?: string;
    note?: string;
  };
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待审核', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  paid: { label: '已通过', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  failed: { label: '已拒绝', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
};

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/admin/orders?status=${filter}`);
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
      } else {
        setMessage(data.error || '获取失败');
        setMessageType('error');
      }
    } catch {
      setMessage('网络错误');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const handleReview = async (orderId: string, action: 'approve' | 'reject') => {
    setProcessingId(orderId);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setMessageType('success');
        fetchOrders();
      } else {
        setMessage(data.error || '操作失败');
        setMessageType('error');
      }
    } catch {
      setMessage('网络错误');
      setMessageType('error');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      order.orderNo.toLowerCase().includes(q) ||
      order.planName.toLowerCase().includes(q) ||
      order.user?.email?.toLowerCase().includes(q) ||
      order.user?.name?.toLowerCase().includes(q) ||
      order.metadata.payerName?.toLowerCase().includes(q)
    );
  });

  const statusCounts = {
    pending: orders.filter((o) => o.paymentStatus === 'pending').length,
    paid: orders.filter((o) => o.paymentStatus === 'paid').length,
    failed: orders.filter((o) => o.paymentStatus === 'failed').length,
  };

  return (
    <div className="flex h-screen bg-[#0A0A12]">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 border-b border-[#2e2e42] bg-[#0f0f1a]/80 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">管理员后台</h1>
              <p className="text-xs text-[#6b7280]">支付审核管理</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#6b7280]">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar">
          {message && (
            <div
              className={`glass-card px-5 py-3.5 flex items-center gap-3 animate-in ${
                messageType === 'error'
                  ? 'border-[rgba(239,68,68,0.3)]'
                  : 'border-[rgba(16,185,129,0.3)]'
              }`}
            >
              {messageType === 'error' ? (
                <XCircle className="w-4.5 h-4.5 text-[#EF4444] flex-shrink-0" />
              ) : (
                <CheckCircle className="w-4.5 h-4.5 text-[#10B981] flex-shrink-0" />
              )}
              <span className="text-sm text-[#e2e8f0]">{message}</span>
              <button
                onClick={() => setMessage('')}
                className="ml-auto text-[#6b7280] hover:text-white transition-colors text-xs"
              >
                关闭
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(['pending', 'paid', 'failed'] as const).map((status) => {
              const cfg = statusConfig[status];
              return (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`glass-card p-5 text-left transition-all ${
                    filter === status
                      ? 'border-[rgba(124,58,237,0.5)] shadow-[0_0_20px_rgba(124,58,237,0.1)]'
                      : 'hover:border-[rgba(124,58,237,0.2)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wider">
                      {cfg.label}
                    </span>
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cfg.color }}
                    />
                  </div>
                  <p className="text-3xl font-bold text-white">{statusCounts[status]}</p>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
              <input
                type="text"
                placeholder="搜索订单号、方案、用户..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-11"
              />
            </div>
            <button onClick={fetchOrders} className="btn-ghost" disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>刷新</span>
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-6 skeleton h-32" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="glass-card p-16 text-center">
              <FileText className="w-12 h-12 text-[#2e2e42] mx-auto mb-4" />
              <p className="text-[#6b7280] text-sm">暂无订单</p>
              <p className="text-[#4b5563] text-xs mt-1">
                {searchQuery ? '试试其他搜索关键词' : '当前筛选条件下没有订单'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const cfg = statusConfig[order.paymentStatus] || {
                  label: order.paymentStatus,
                  color: '#6b7280',
                  bg: 'rgba(107,114,128,0.12)',
                };
                const isProcessing = processingId === order.id;

                return (
                  <div key={order.id} className="glass-card p-6 animate-in">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-mono text-sm font-semibold text-white">
                            {order.orderNo}
                          </span>
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                            style={{ color: cfg.color, background: cfg.bg }}
                          >
                            {order.paymentStatus === 'pending' && <Clock className="w-3 h-3" />}
                            {order.paymentStatus === 'paid' && <CheckCircle className="w-3 h-3" />}
                            {order.paymentStatus === 'failed' && <XCircle className="w-3 h-3" />}
                            {cfg.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-[#9ca3af]">
                            <UserIcon className="w-3.5 h-3.5 text-[#6b7280]" />
                            <span>{order.user?.email || '未知'}</span>
                            {order.user?.name && (
                              <span className="text-[#6b7280]">({order.user.name})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[#9ca3af]">
                            <FileText className="w-3.5 h-3.5 text-[#6b7280]" />
                            <span>
                              方案：<strong className="text-white font-medium">{order.planName}</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[#9ca3af]">
                            <DollarSign className="w-3.5 h-3.5 text-[#6b7280]" />
                            <span>
                              金额：<strong className="text-[#a78bfa] font-semibold">¥{order.amount}</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[#9ca3af]">
                            <span className="text-[#6b7280] text-xs">付款人</span>
                            <span>{order.metadata.payerName || '-'}</span>
                          </div>
                        </div>

                        {order.metadata.transactionId && (
                          <p className="text-xs text-[#6b7280]">
                            交易号：{order.metadata.transactionId}
                          </p>
                        )}

                        {order.metadata.note && (
                          <div className="flex items-start gap-2 text-xs text-[#6b7280]">
                            <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>备注：{order.metadata.note}</span>
                          </div>
                        )}

                        <p className="text-xs text-[#4b5563]">
                          提交于 {new Date(order.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </div>

                      {order.paymentStatus === 'pending' && (
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleReview(order.id, 'approve')}
                            disabled={isProcessing}
                            className="btn-primary text-xs !px-4 !py-2"
                            style={{
                              background: isProcessing
                                ? '#2e2e42'
                                : 'linear-gradient(135deg, #10B981, #059669)',
                            }}
                          >
                            {isProcessing ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3 h-3" />
                            )}
                            通过
                          </button>
                          <button
                            onClick={() => handleReview(order.id, 'reject')}
                            disabled={isProcessing}
                            className="btn-ghost text-xs !px-4 !py-2 !text-[#EF4444] !border-[rgba(239,68,68,0.25)] hover:!bg-[rgba(239,68,68,0.1)] hover:!border-[rgba(239,68,68,0.45)]"
                          >
                            {isProcessing ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            拒绝
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
