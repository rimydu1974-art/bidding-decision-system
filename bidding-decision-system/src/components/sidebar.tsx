'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  Briefcase,
  BookOpen,
  Settings,
  FileCode,
  User,
  LogOut,
  Menu,
  X,
  Zap,
  CreditCard,
  ChevronDown,
  ChevronRight,
  Scale,
  FileText,
  Gavel,
  BookMarked,
  Brain,
  MessageSquare,
  Database,
  History,
  Cloud,
} from 'lucide-react';

interface UserInfo {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface QuotaInfo {
  used: number;
  limit: number;
  plan: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon?: any;
  path: string;
  adminOnly?: boolean;
  type?: string;
  badge?: string;
}

interface NavigationConfig {
  top: MenuItem[];
  evaluation: {
    id: string;
    label: string;
    icon?: any;
    children: MenuItem[];
  };
  thinktank: MenuItem;
  engineConfig: {
    id: string;
    label: string;
    icon?: any;
    adminOnly: boolean;
    children: MenuItem[];
  };
  bottom: MenuItem[];
}

// 导航菜单配置
const navigationConfig: NavigationConfig = {
  top: [
    {
      id: 'workspace',
      label: '工作台',
      icon: LayoutDashboard,
      path: '/workspace',
    },
    {
      id: 'project-center',
      label: '项目中心',
      icon: FolderOpen,
      path: '/projects',
    },
    {
      id: 'enterprise-materials',
      label: '企业素材库',
      icon: Briefcase,
      path: '/materials',
    },
  ],
  evaluation: {
    id: 'evaluation-center',
    label: '评审中心',
    icon: Brain,
    children: [
      {
        id: 'eval-process',
        label: '评审流程库',
        path: '/evaluation/process',
        adminOnly: true,
      },
      {
        id: 'eval-rule',
        label: '评分规则库',
        path: '/evaluation/rules',
        adminOnly: true,
      },
      {
        id: 'eval-regulation',
        label: '法规库',
        path: '/evaluation/regulations',
      },
      {
        id: 'eval-case',
        label: '案例中心',
        path: '/evaluation/cases',
      },
    ],
  },
  thinktank: {
    id: 'bidding-thinktank',
    label: '招投标智库',
    icon: BookOpen,
    path: '/thinktank',
    badge: 'New',
  },
  engineConfig: {
    id: 'engine-config',
    label: '引擎配置',
    icon: Settings,
    adminOnly: true,
    children: [
      {
        id: 'config-prompt',
        label: 'Prompt 管理',
        path: '/config/prompts',
      },
      {
        id: 'config-model',
        label: '模型配置',
        path: '/config/models',
      },
      {
        id: 'config-version',
        label: '版本管理',
        path: '/config/versions',
      },
    ],
  },
  bottom: [
    {
      id: 'feishu-config',
      label: '飞书配置',
      icon: Cloud,
      path: '/feishu-config',
    },
    {
      id: 'api-docs',
      label: 'API 文档',
      icon: FileCode,
      path: '/docs',
      adminOnly: true, // 仅管理员可见
    },
    {
      id: 'pricing',
      label: '专业版与用量',
      icon: Zap,
      path: '/pricing',
      type: 'progress_bar',
    },
    {
      id: 'user-center',
      label: '用户中心',
      icon: User,
      path: '/profile',
    },
  ],
};

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['evaluation-center']);

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

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

  const isActive = (path: string) => {
    if (path === '/workspace') return pathname === '/workspace' || pathname === '/';
    return pathname.startsWith(path);
  };

  const isMenuExpanded = (menuId: string) => expandedMenus.includes(menuId);

  const isAdmin = user?.role === 'admin';

  const Logo = () => (
    <svg width="160" height="44" viewBox="0 0 440 120">
      <defs>
        <linearGradient id="sframe" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED"/>
          <stop offset="100%" stopColor="#06B6D4"/>
        </linearGradient>
        <linearGradient id="scheck" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#06B6D4"/>
          <stop offset="50%" stopColor="#A78BFA"/>
          <stop offset="100%" stopColor="#7C3AED"/>
        </linearGradient>
        <linearGradient id="sword" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#A78BFA"/>
          <stop offset="100%" stopColor="#22D3EE"/>
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="100" height="100" rx="26" fill="none" stroke="url(#sframe)" strokeWidth="2.5"/>
      <rect x="20" y="20" width="80" height="80" rx="19" fill="none" stroke="url(#sframe)" strokeWidth="0.6" opacity="0.25"/>
      <polyline points="38,62 56,82 84,48" fill="none" stroke="url(#scheck)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="84" cy="48" r="3" fill="#22D3EE"/>
      <text x="140" y="68" fontFamily="'Inter','Helvetica Neue','Arial Black','PingFang SC','Microsoft YaHei',sans-serif" fontSize="38" fontWeight="900" letterSpacing="-0.8" fill="url(#sword)">OpenCheck</text>
      <text x="142" y="88" fontFamily="'Inter','Helvetica Neue','PingFang SC','Microsoft YaHei',sans-serif" fontSize="11" fontWeight="500" letterSpacing="1.2" fill="#8B9BB4">BID DECISION OS</text>
    </svg>
  );

  const SidebarContent = () => (
    <>
      <div className="h-20 flex items-center px-5 border-b border-[#2e2e42]">
        <Link href="/workspace" className="flex items-center">
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        {/* 顶部菜单 */}
        {navigationConfig.top.map((item) => (
          <Link
            key={item.id}
            href={item.path}
            className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        ))}

        {/* 评审中心（折叠菜单） */}
        <div className="mt-1">
          <button
            onClick={() => toggleMenu('evaluation-center')}
            className={`sidebar-item w-full ${isMenuExpanded('evaluation-center') ? 'active' : ''}`}
          >
            <navigationConfig.evaluation.icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1 text-left">{navigationConfig.evaluation.label}</span>
            {isMenuExpanded('evaluation-center') ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {isMenuExpanded('evaluation-center') && (
            <div className="ml-4 border-l border-[#2e2e42] pl-3 space-y-0.5">
              {navigationConfig.evaluation.children
                .filter((child) => !child.adminOnly || isAdmin)
                .map((child) => (
                  <Link
                    key={child.id}
                    href={child.path}
                    className={`sidebar-item text-sm ${isActive(child.path) ? 'active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span>{child.label}</span>
                  </Link>
                ))}
            </div>
          )}
        </div>

        {/* 招投标智库 */}
        <Link
          href={navigationConfig.thinktank.path}
          className={`sidebar-item ${isActive(navigationConfig.thinktank.path) ? 'active' : ''}`}
          onClick={() => setMobileOpen(false)}
        >
          <navigationConfig.thinktank.icon className="w-5 h-5 flex-shrink-0" />
          <span>{navigationConfig.thinktank.label}</span>
          {navigationConfig.thinktank.badge && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] text-white rounded-full">
              {navigationConfig.thinktank.badge}
            </span>
          )}
        </Link>

        {/* 引擎配置（仅管理员） */}
        {isAdmin && (
          <div className="mt-1">
            <button
              onClick={() => toggleMenu('engine-config')}
              className={`sidebar-item w-full ${isMenuExpanded('engine-config') ? 'active' : ''}`}
            >
              <navigationConfig.engineConfig.icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1 text-left">{navigationConfig.engineConfig.label}</span>
              {isMenuExpanded('engine-config') ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            {isMenuExpanded('engine-config') && (
              <div className="ml-4 border-l border-[#2e2e42] pl-3 space-y-0.5">
                {navigationConfig.engineConfig.children.map((child) => (
                  <Link
                    key={child.id}
                    href={child.path}
                    className={`sidebar-item text-sm ${isActive(child.path) ? 'active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span>{child.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* 底部固定区域 */}
      <div className="mt-auto">
        <div className="px-3 py-2 border-t border-[#2e2e42]">
          <div className="h-px bg-gradient-to-r from-transparent via-[#2e2e42] to-transparent mb-2" />
        </div>

        {/* 底部菜单项 */}
        <div className="px-3 space-y-0.5">
          {navigationConfig.bottom
            .filter((item) => !item.adminOnly || user?.role === 'admin')
            .map((item) => (
              <Link
                key={item.id}
                href={item.path}
                className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            ))}
        </div>

        {/* 额度显示 */}
        {quota && (
          <div className="mx-3 mb-3 p-3 rounded-xl bg-[#1e1e2e] border border-[#2e2e42]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#a78bfa]" />
                <span className="text-xs text-[#9ca3af]">
                  {quota.plan === 'free' ? 'AI额度' : quota.plan === 'pro' ? '专业版' : '企业版'}
                </span>
              </div>
              <span className="text-xs font-medium text-[#e2e8f0]">
                {quota.limit === -1 ? '∞' : `${quota.used}/${quota.limit}`}
              </span>
            </div>
            {quota.limit === -1 ? (
              <div className="w-full h-1.5 bg-[#2e2e42] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#06b6d4]" style={{ width: '100%' }} />
              </div>
            ) : (
              <div className="w-full h-1.5 bg-[#2e2e42] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min((quota.used / quota.limit) * 100, 100)}%`,
                    backgroundColor: quota.used >= quota.limit ? '#ef4444' : quota.used >= quota.limit * 0.8 ? '#f59e0b' : '#10b981',
                  }}
                />
              </div>
            )}
            <p className="text-[10px] text-[#6b7280] mt-1.5">
              {quota.plan === 'free'
                ? (quota.used >= quota.limit ? '额度已用完，升级解锁无限次数' : `本月剩余 ${quota.limit - quota.used} 次`)
                : '无限AI分析次数'
              }
            </p>
          </div>
        )}

        {/* 用户信息 */}
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
