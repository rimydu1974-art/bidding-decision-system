'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import {
  User,
  CreditCard,
  BarChart3,
  Key,
  Eye,
  EyeOff,
  Save,
  Crown,
} from 'lucide-react';

interface QuotaInfo {
  user: {
    id: string;
    plan: string;
    isPro: boolean;
    isEnterprise: boolean;
    email: string;
    name: string;
    phone: string;
    planExpiresAt: string | null;
  };
  quota: {
    used: number;
    limit: number;
    remaining: number;
    resetAt: string;
  };
  hasApiKey: boolean;
}

export default function UserCenterPage() {
  const router = useRouter();
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadQuotaInfo();
  }, []);

  const loadQuotaInfo = async () => {
    try {
      const res = await fetch('/api/user/quota');
      const data = await res.json();
      setQuotaInfo(data);
    } catch (err) {
      console.error('Failed to load quota:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    setSaving(true);
    try {
      await fetch('/api/user/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      loadQuotaInfo();
    } catch (err) {
      console.error('Failed to save API key:', err);
    } finally {
      setSaving(false);
    }
  };

  const quota = quotaInfo?.quota;
  const circumference = 2 * Math.PI * 48;
  const usagePct = quota ? (quota.used / (quota.limit || 20)) * 100 : 0;
  const offset = circumference - (usagePct / 100) * circumference;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A12]">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[1000px] mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6">用户中心</h1>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-[#7c3aed]/20 border-t-[#7c3aed] rounded-full mx-auto" />
              <p className="mt-4 text-[#6b7280]">加载中...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Account Info */}
              <div className="glass-card p-6">
                <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#a78bfa]" />
                  账号信息
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">手机号</span>
                    <span className="text-[#e2e8f0]">{quotaInfo?.user?.phone || '未绑定'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">邮箱</span>
                    <span className="text-[#e2e8f0]">{quotaInfo?.user?.email || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">姓名</span>
                    <span className="text-[#e2e8f0]">{quotaInfo?.user?.name || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Plan Info */}
              <div className="glass-card p-6">
                <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-[#f59e0b]" />
                  套餐信息
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">当前套餐</span>
                    <span className="text-[#e2e8f0] font-medium">
                      {quotaInfo?.user?.plan === 'pro' ? '专业版' : quotaInfo?.user?.plan === 'enterprise' ? '企业版' : '免费版'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">剩余次数</span>
                    <span className="text-[#e2e8f0]">{quota?.remaining ?? 20} 次</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b7280]">到期时间</span>
                    <span className="text-[#e2e8f0]">
                      {quotaInfo?.user?.planExpiresAt
                        ? new Date(quotaInfo.user.planExpiresAt).toLocaleDateString('zh-CN')
                        : '永久'}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Usage Quota */}
              <div className="glass-card p-6">
                <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#06b6d4]" />
                  AI使用额度
                </h3>
                <div className="flex items-center gap-6">
                  <div>
                    <svg width="120" height="120" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(46,46,66,0.4)" strokeWidth="8" />
                      <circle
                        cx="60" cy="60" r="48" fill="none" stroke="#a78bfa" strokeWidth="8"
                        strokeDasharray={circumference} strokeDashoffset={offset}
                        strokeLinecap="round" transform="rotate(-90 60 60)"
                      />
                      <text x="60" y="57" textAnchor="middle" fill="white" fontSize="20" fontWeight="700">
                        {quota?.used || 0}
                      </text>
                      <text x="60" y="75" textAnchor="middle" fill="#6b7280" fontSize="11">
                        / {quota?.limit || 20}
                      </text>
                    </svg>
                  </div>
                  <div className="text-sm">
                    <p className="text-[#e2e8f0]">
                      本月已用 <b className="text-white">{quota?.used || 0}</b> / {quota?.limit || 20} 次
                    </p>
                    <p className="text-[#6b7280] text-xs mt-1">免费版每月 {quota?.limit || 20} 次深度分析</p>
                    <button onClick={() => router.push('/pricing')} className="btn-ghost text-xs mt-3">
                      升级无限制 →
                    </button>
                  </div>
                </div>
              </div>

              {/* API Key */}
              <div className="glass-card p-6">
                <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#10b981]" />
                  API密钥管理
                </h3>
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="input-field pr-10"
                      placeholder="输入您的API Key"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#e2e8f0]"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button onClick={handleSaveApiKey} disabled={saving} className="btn-primary w-full justify-center disabled:opacity-50">
                    <Save className="w-4 h-4" />
                    {saving ? '保存中...' : '保存API Key'}
                  </button>
                  <p className="text-xs text-[#6b7280]">
                    {quotaInfo?.hasApiKey ? '✅ 已配置API Key' : '未配置API Key，使用系统默认AI'}
                  </p>
                </div>
              </div>

              {/* Payment History */}
              <div className="glass-card p-6 md:col-span-2">
                <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#f97316]" />
                  支付记录
                </h3>
                <div className="text-center py-8">
                  <p className="text-[#6b7280] text-sm">暂无支付记录</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
