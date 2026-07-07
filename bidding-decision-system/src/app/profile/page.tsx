'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { UpgradeDialog, shouldShowUpgrade, markUpgradeShown } from '@/components/popup/upgrade-dialog';
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
    aiQuotaUsed: number;
    totalAiCalls: number;
    totalOrders: number;
    totalSpent: number;
  };
  quota: {
    used: number;
    limit: number;
    resetAt: string;
  };
  hasApiKey: boolean;
}

const API_PROVIDERS = [
  { id: 'deepseek', name: 'DeepSeek', placeholder: 'sk-', baseUrl: 'https://api.deepseek.com' },
  { id: 'tongyi', name: '通义千问', placeholder: 'sk-', baseUrl: 'https://dashscope.aliyuncs.com' },
  { id: 'zhipu', name: '智谱', placeholder: 'sk-', baseUrl: 'https://open.bigmodel.cn' },
  { id: 'moonshot', name: '月之暗面', placeholder: 'sk-', baseUrl: 'https://api.moonshot.cn' },
  { id: 'baichuan', name: '百川', placeholder: 'sk-', baseUrl: 'https://api.baichuan-ai.com' },
  { id: 'spark', name: '讯飞星火', placeholder: 'sk-', baseUrl: 'https://spark-api.xf-yun.com' },
  { id: 'ernie', name: '文心一言', placeholder: 'sk-', baseUrl: 'https://aip.baidubce.com' },
  { id: 'openai', name: 'OpenAI', placeholder: 'sk-', baseUrl: 'https://api.openai.com' },
  { id: 'anthropic', name: 'Anthropic', placeholder: 'sk-ant-', baseUrl: 'https://api.anthropic.com' },
  { id: 'gemini', name: 'Gemini', placeholder: 'sk-', baseUrl: 'https://generativelanguage.googleapis.com' },
];

export default function ProfilePage() {
  const router = useRouter();
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'api-key'>('overview');
  const [userApiKey, setUserApiKey] = useState('');
  const [userApiProvider, setUserApiProvider] = useState('deepseek');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);

  useEffect(() => {
    fetch('/api/user/quota')
      .then((res) => res.json())
      .then((data) => {
        setQuotaInfo(data);
        setLoading(false);
        if (data.plan === 'free' && data.quota.used >= data.quota.limit && shouldShowUpgrade({ analyzeCount: 3 })) {
          setShowUpgradePopup(true);
        }
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleSaveApiKey = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: userApiKey, provider: userApiProvider }),
      });
      if (res.ok) {
        alert('API Key 保存成功');
      }
    } catch {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const planLabels: Record<string, string> = {
    free: '免费版',
    single: '单次购买',
    pro: '专业版',
    enterprise: '企业版',
  };

  const planColors: Record<string, string> = {
    free: 'text-[#6b7280]',
    single: 'text-[#06b6d4]',
    pro: 'text-[#a78bfa]',
    enterprise: 'text-[#10b981]',
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0A0A12]">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0A0A12]">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">用户中心</h1>
            <p className="text-[#6b7280]">管理您的账户和订阅</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-8 p-1 bg-[#1e1e2e] rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-[#7c3aed] text-white'
                  : 'text-[#6b7280] hover:text-white'
              }`}
            >
              概览
            </button>
            <button
              onClick={() => setActiveTab('api-key')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'api-key'
                  ? 'bg-[#7c3aed] text-white'
                  : 'text-[#6b7280] hover:text-white'
              }`}
            >
              API Key
            </button>
          </div>

          {activeTab === 'overview' && quotaInfo && (
            <div className="space-y-6">
              {/* Plan Card */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Crown className={`w-6 h-6 ${planColors[quotaInfo.user.plan]}`} />
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {planLabels[quotaInfo.user.plan]}
                      </h3>
                      <p className="text-sm text-[#6b7280]">当前订阅方案</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/pricing')}
                    className="btn-primary text-sm"
                  >
                    升级方案
                  </button>
                </div>
              </div>

              {/* 专业版/企业版 API配置提示 */}
              {(quotaInfo.user.plan === 'pro' || quotaInfo.user.plan === 'pro-year' || quotaInfo.user.plan === 'enterprise') && (
                <div className={`p-4 rounded-xl border ${
                  !quotaInfo.hasApiKey
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-green-500/10 border-green-500/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Key className={`w-5 h-5 ${
                        !quotaInfo.hasApiKey
                          ? 'text-red-400'
                          : 'text-green-400'
                      }`} />
                      <div>
                        <p className={`text-sm font-medium ${
                          !quotaInfo.hasApiKey
                            ? 'text-red-400'
                            : 'text-green-400'
                        }`}>
                          {!quotaInfo.hasApiKey
                            ? '⚠️ 请配置AI模型API，否则无法使用AI分析'
                            : '✅ 已配置AI模型API'}
                        </p>
                        <p className="text-xs text-[#6b7280] mt-1">
                           专业版/企业版需使用自己的AI API（DeepSeek/通义千问/智谱等）
                         </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('api-key')}
                      className="btn-primary text-sm"
                    >
                      {!quotaInfo.hasApiKey ? '立即配置' : '管理配置'}
                    </button>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <BarChart3 className="w-5 h-5 text-[#a78bfa]" />
                    <span className="text-sm text-[#6b7280]">AI 使用量</span>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {quotaInfo.quota.used}
                    <span className="text-lg text-[#6b7280]"> / {quotaInfo.quota.limit === -1 ? '∞' : quotaInfo.quota.limit}</span>
                  </p>
                </div>

                <div className="glass-card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <BarChart3 className="w-5 h-5 text-[#06b6d4]" />
                    <span className="text-sm text-[#6b7280]">总调用次数</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{quotaInfo.user.totalAiCalls}</p>
                </div>

                <div className="glass-card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <CreditCard className="w-5 h-5 text-[#10b981]" />
                    <span className="text-sm text-[#6b7280]">总消费</span>
                  </div>
                  <p className="text-3xl font-bold text-white">¥{quotaInfo.user.totalSpent.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api-key' && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-[#a78bfa]" />
                自定义 API Key
              </h3>

              {(quotaInfo?.user.plan === 'free' || quotaInfo?.user.plan === 'single') ? (
                <div className="space-y-4">
                  <div className="p-4 bg-[#10b981]/10 border border-[#10b981]/20 rounded-xl">
                    <p className="text-sm text-[#10b981]">
                      您当前使用的是平台提供的AI服务，无需配置API Key。
                    </p>
                    <p className="text-xs text-[#6b7280] mt-2">
                      免费版和19元版用户可直接使用平台AI配额。升级到99元专业版可配置自己的API Key，不受配额限制。
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-[#6b7280]">
                    配置您自己的API Key，享受无限调用。
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-[#9ca3af] mb-2">AI供应商</label>
                    <select
                      value={userApiProvider}
                      onChange={(e) => setUserApiProvider(e.target.value)}
                      className="w-full bg-[#1a1a2e] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#60a5fa]"
                    >
                      {API_PROVIDERS.map((p) => (
                        <option key={p.id} value={p.id} style={{ background: '#1a1a2e', color: '#e2e8f0' }}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#9ca3af] mb-2">API Key</label>
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={userApiKey}
                          onChange={(e) => setUserApiKey(e.target.value)}
                          className="input-field pr-10"
                          placeholder={API_PROVIDERS.find(p => p.id === userApiProvider)?.placeholder || 'sk-...'}
                        />
                        <button
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-white"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <button
                        onClick={handleSaveApiKey}
                        disabled={saving || !userApiKey}
                        className="btn-primary disabled:opacity-50"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        {saving ? '保存中...' : '保存'}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#6b7280]">
                    API Key仅保存在您的账户中，用于直接调用AI服务。
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <UpgradeDialog
        open={showUpgradePopup}
        onClose={() => {
          setShowUpgradePopup(false);
          markUpgradeShown(3);
        }}
        onGoPricing={() => {
          fetch('/api/behavior/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'click_pay', metadata: { source: 'quota_exhausted' } }),
          }).catch(() => {});
          router.push('/pricing');
        }}
      />
    </div>
  );
}
