'use client';

import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  orderId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/notifications?limit=100');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (notificationIds?: string[]) => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationIds: notificationIds,
          markAll: !notificationIds,
        }),
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notifications:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT_SCREENSHOT':
        return '💰';
      case 'PAYMENT_REVIEW':
        return '✅';
      case 'NEW_ORDER':
        return '🛒';
      case 'USER_REGISTER':
        return '👤';
      default:
        return '🔔';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-[#6b7280] hover:text-white transition-all flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" />
          返回仪表盘
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">通知中心</h1>
            <p className="text-sm text-[#6b7280] mt-1">
              {unreadCount > 0 ? `${unreadCount} 条未读通知` : '暂无未读通知'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAsRead()}
              className="btn-primary flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              全部已读
            </button>
          )}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#6b7280] text-sm">
            加载中...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-10 h-10 text-[#6b7280] mx-auto mb-3" />
            <p className="text-[#6b7280] text-sm">暂无通知</p>
          </div>
        ) : (
          <div className="divide-y divide-[#2e2e42]/50">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-[#1e1e2e]/40 transition-colors ${
                  !notification.isRead ? 'bg-[#7c3aed]/5' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getTypeIcon(notification.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-white font-medium">
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#7c3aed]" />
                      )}
                    </div>
                    <p className="text-sm text-[#9ca3af] mt-1 whitespace-pre-line">
                      {notification.content}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-[#6b7280]">
                        {new Date(notification.createdAt).toLocaleString('zh-CN')}
                      </span>
                      {notification.orderId && (
                        <Link
                          href="/admin/orders"
                          className="text-xs text-[#a78bfa] hover:text-[#c4b5fd]"
                        >
                          查看订单
                        </Link>
                      )}
                    </div>
                  </div>
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead([notification.id])}
                      className="text-xs text-[#6b7280] hover:text-white"
                    >
                      标记已读
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
