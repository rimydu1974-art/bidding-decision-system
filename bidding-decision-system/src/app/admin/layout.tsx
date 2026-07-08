'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Activity,
  Cpu,
  Settings,
  BarChart3,
  MessageSquare,
  Download,
  Star,
  FileText,
  Bell,
  Check,
  CheckCheck,
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';

const adminNav = [
  { href: '/admin', label: '仪表盘', icon: LayoutDashboard },
  { href: '/admin/users', label: '用户管理', icon: Users },
  { href: '/admin/orders', label: '订单管理', icon: ShoppingCart },
  { href: '/admin/ai-cost', label: 'AI成本', icon: Cpu },
  { href: '/admin/behavior', label: '行为漏斗', icon: Activity },
  { href: '/admin/analytics', label: '行业统计', icon: BarChart3 },
  { href: '/admin/feedback', label: '用户反馈', icon: MessageSquare },
  { href: '/admin/export', label: '数据导出', icon: Download },
  { href: '/admin/customers', label: '高价值客户', icon: Star },
  { href: '/admin/rules', label: '规则管理', icon: FileText },
  { href: '/admin/notifications', label: '通知中心', icon: Bell },
  { href: '/admin/settings', label: '系统配置', icon: Settings },
];

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // 检查管理员权限
    fetch('/api/admin/check')
      .then(res => {
        if (res.ok) {
          setAuthorized(true);
        } else {
          window.location.href = '/login';
        }
      })
      .catch(() => {
        window.location.href = '/login';
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (!authorized) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/admin/notifications?limit=10');
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [authorized]);

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
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark notifications:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A12] flex items-center justify-center">
        <div className="text-[#6b7280] text-sm">验证权限中...</div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A0A12] flex">
      {/* Admin Sidebar */}
      <aside className="w-64 glass-card border-r border-[#2e2e42] p-4 flex flex-col">
        <div className="mb-6">
          <Logo width={160} height={44} />
          <p className="text-xs text-[#6b7280] mt-1">管理后台</p>
        </div>

        <nav className="flex-1 space-y-1">
          {adminNav.map(item => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive 
                    ? 'bg-[#7c3AED]/20 text-[#a78bfa] border border-[#7c3AED]/30' 
                    : 'text-[#9ca3af] hover:bg-[#1e1e2e] hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#2e2e42] pt-4 mt-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-[#6b7280] hover:text-white transition-all"
          >
            ← 返回前台
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {/* Top Bar with Notifications */}
        <div className="flex items-center justify-end mb-4">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-[#1e1e2e] transition-colors"
            >
              <Bell className="w-5 h-5 text-[#9ca3af]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ef4444] text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 glass-card border border-[#2e2e42] rounded-xl shadow-xl z-50">
                <div className="p-3 border-b border-[#2e2e42] flex items-center justify-between">
                  <span className="text-sm font-medium text-white">通知</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAsRead()}
                      className="text-xs text-[#a78bfa] hover:text-[#c4b5fd] flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" />
                      全部已读
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-[#6b7280] text-sm">
                      暂无通知
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-[#2e2e42]/50 hover:bg-[#1e1e2e]/50 transition-colors ${
                          !notification.isRead ? 'bg-[#7c3aed]/5' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {!notification.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#7c3aed] mt-1.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">
                              {notification.title}
                            </p>
                            <p className="text-xs text-[#6b7280] mt-0.5 line-clamp-2">
                              {notification.content}
                            </p>
                            <p className="text-xs text-[#4b5563] mt-1">
                              {new Date(notification.createdAt).toLocaleString('zh-CN')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-2 border-t border-[#2e2e42]">
                    <Link
                      href="/admin/notifications"
                      className="block text-center text-xs text-[#a78bfa] hover:text-[#c4b5fd] py-1"
                      onClick={() => setShowNotifications(false)}
                    >
                      查看全部通知
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
