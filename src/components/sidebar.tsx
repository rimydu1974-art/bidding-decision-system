'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  BookOpen,
  FileCode,
  User,
  LogOut,
  Menu,
  X,
  Zap,
  CreditCard,
} from 'lucide-react';

interface UserInfo {
  id: string;
  email: string;
  name: string | null;
}

interface QuotaInfo {
  used: number;
  limit: number;
  plan: string;
}

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));

    fetch('/api/user/quota')
      .then((res) => res.json())
      .then((data) => setQuota({ used: data.quota?.used || 0, limit: data.quota?.limit || 20, plan: data.user?.plan || 'free' }))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setMobileOpen(false);
    router.push('/');
    router.refresh();
  };

  const navItems = [
    { href: '/', label: '工作台', icon: LayoutDashboard },
    { href: '/projects', label: '项目中心', icon: FolderOpen },
    { href: '/knowledge', label: '知识库', icon: BookOpen },
    { href: '/api-docs', label: 'API文档', icon: FileCode },
    { href: '/pricing', label: '定价', icon: CreditCard },
  ];

  const bottomItems = [
    { href: '/user-center', label: '用户中心', icon: User },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const Logo = () => (
    <svg width="26" height="26" viewBox="0 0 32 32">
      <defs>
        <linearGradient id="slogo" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa"/>
          <stop offset="100%" stopColor="#06b6d4"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="28" height="28" rx="7" fill="url(#slogo)"/>
      <path d="M9 16l4 4 10-10" stroke="#fff" strokeWidth="2.5" fill="none"
            strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center px-5 border-b border-[#2e2e42]">
        <Link href="/" className="flex items-center">
          <Logo />
          <span className="ml-3 font-bold text-lg tracking-tight text-white">投标AI</span>
        </Link>
      </div>

      <nav className="flex-1 py-3 px-3 space-y-0.5">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-item ${isActive(item.href) ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto">
        {/* Quota Display */}
        {quota && quota.plan === 'free' && (
          <div className="mx-3 mb-3 p-3 rounded-xl bg-[#1e1e2e] border border-[#2e2e42]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#a78bfa]" />
                <span className="text-xs text-[#9ca3af]">AI额度</span>
              </div>
              <span className="text-xs font-medium text-[#e2e8f0]">{quota.used}/{quota.limit}</span>
            </div>
            <div className="w-full h-1.5 bg-[#2e2e42] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min((quota.used / quota.limit) * 100, 100)}%`,
                  backgroundColor: quota.used >= quota.limit ? '#ef4444' : quota.used >= quota.limit * 0.8 ? '#f59e0b' : '#10b981',
                }}
              />
            </div>
            <p className="text-[10px] text-[#6b7280] mt-1.5">
              {quota.used >= quota.limit ? '额度已用完，升级解锁无限次数' : `本月剩余 ${quota.limit - quota.used} 次`}
            </p>
          </div>
        )}

        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-item mx-3 mb-1 ${isActive(item.href) ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        ))}

        <div className="p-3 border-t border-[#2e2e42]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#06b6d4] flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#e2e8f0] truncate">
                {user?.name || '用户'}
              </p>
              <p className="text-xs text-[#6b7280] truncate">{user?.email || ''}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-[#6b7280] hover:text-[#ef4444] transition-colors"
              title="退出登录"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden lg:flex w-[232px] flex-shrink-0 h-screen flex-col border-r border-[#2e2e42] bg-[#0f0f1a]">
        <SidebarContent />
      </aside>

      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-[#1e1e2e] border border-[#2e2e42] text-[#e2e8f0]"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[232px] flex flex-col border-r border-[#2e2e42] bg-[#0f0f1a]">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-[#6b7280] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
