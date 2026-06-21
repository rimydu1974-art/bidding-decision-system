'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

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

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [message, setMessage] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?status=${filter}`);
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
      } else {
        setMessage(data.error || '获取失败');
      }
    } catch {
      setMessage('网络错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const handleReview = async (orderId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, action }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        fetchOrders(); // 刷新列表
      } else {
        setMessage(data.error || '操作失败');
      }
    } catch {
      setMessage('网络错误');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />待审核</Badge>;
      case 'paid':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />已通过</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />已拒绝</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>管理员后台 - 支付审核</CardTitle>
          <CardDescription>审核用户提交的手动转账订单</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            {['pending', 'paid', 'failed'].map((status) => (
              <Button
                key={status}
                variant={filter === status ? 'default' : 'outline'}
                onClick={() => setFilter(status)}
              >
                {status === 'pending' ? '待审核' : status === 'paid' ? '已通过' : '已拒绝'}
              </Button>
            ))}
            <Button variant="ghost" onClick={fetchOrders} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无订单</div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{order.orderNo}</span>
                          {getStatusBadge(order.paymentStatus)}
                        </div>
                        <p className="text-sm text-gray-500">
                          用户：{order.user?.email || '未知'} | {order.user?.name || ''}
                        </p>
                        <p className="text-sm">
                          方案：<strong>{order.planName}</strong> | 金额：<strong>¥{order.amount}</strong>
                        </p>
                        <p className="text-sm text-gray-500">
                          付款人：{order.metadata.payerName || '-'} | 
                          交易号：{order.metadata.transactionId || '-'}
                        </p>
                        {order.metadata.note && (
                          <p className="text-sm text-gray-500">备注：{order.metadata.note}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          提交时间：{new Date(order.createdAt).toLocaleString('zh-CN')}
                        </p>
                      </div>

                      {order.paymentStatus === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-500 hover:bg-green-600"
                            onClick={() => handleReview(order.id, 'approve')}
                          >
                            通过
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReview(order.id, 'reject')}
                          >
                            拒绝
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
