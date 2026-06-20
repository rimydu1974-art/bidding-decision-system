'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Key,
  BarChart3,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface QuotaInfo {
  user: {
    id: string;
    plan: string;
    isPro: boolean;
    isEnterprise: boolean;
    hasTempAccess: boolean;
    tempExpiresAt: string | null;
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
      const response = await fetch('/api/user/quota');
      const data = await response.json();
      if (response.ok) {
        setQuotaInfo(data);
      }
    } catch (error) {
      console.error('Failed to load quota info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.startsWith('sk-')) {
      alert('无效的API Key格式');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/user/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('API Key保存成功');
        setApiKey('');
        loadQuotaInfo();
      } else {
        alert(data.error || '保存失败');
      }
    } catch (error) {
      console.error('Failed to save API key:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteApiKey = async () => {
    if (!confirm('确定要删除API Key吗？')) return;

    try {
      const response = await fetch('/api/user/api-key', {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('API Key已删除');
        loadQuotaInfo();
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <h1 className="text-xl font-bold text-gray-900">用户中心</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* 当前套餐 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              当前套餐
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold">
                    {quotaInfo?.user.plan === 'enterprise'
                      ? '企业版'
                      : quotaInfo?.user.plan === 'pro'
                      ? '专业版'
                      : '免费版'}
                  </span>
                  {quotaInfo?.user.isPro && (
                    <Badge className="bg-blue-100 text-blue-800">专业版</Badge>
                  )}
                  {quotaInfo?.user.isEnterprise && (
                    <Badge className="bg-purple-100 text-purple-800">企业版</Badge>
                  )}
                  {quotaInfo?.user.hasTempAccess && (
                    <Badge className="bg-green-100 text-green-800">临时权限</Badge>
                  )}
                </div>
                {quotaInfo?.user.planExpiresAt && (
                  <p className="text-gray-500 mt-1">
                    有效期至：{new Date(quotaInfo.user.planExpiresAt).toLocaleDateString('zh-CN')}
                  </p>
                )}
                {quotaInfo?.user.tempExpiresAt && (
                  <p className="text-gray-500 mt-1">
                    临时权限至：{new Date(quotaInfo.user.tempExpiresAt).toLocaleDateString('zh-CN')}
                  </p>
                )}
              </div>
              <Button onClick={() => router.push('/pricing')}>
                {quotaInfo?.user.plan === 'free' ? '升级订阅' : '管理订阅'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI额度 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              AI使用额度
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quotaInfo?.quota.limit === -1 ? (
              <div className="text-center py-4">
                <div className="text-4xl font-bold text-green-600">无限制</div>
                <p className="text-gray-500 mt-2">您的套餐享有无限AI调用额度</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600">本月已使用</span>
                  <span className="font-semibold">
                    {quotaInfo?.quota.used} / {quotaInfo?.quota.limit} 次
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full"
                    style={{
                      width: `${((quotaInfo?.quota.used || 0) / (quotaInfo?.quota.limit || 20)) * 100}%`,
                    }}
                  ></div>
                </div>
                <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                  <span>剩余 {quotaInfo?.quota.remaining} 次</span>
                  <span>
                    下次重置：每月1日
                  </span>
                </div>
                {quotaInfo?.quota.remaining === 0 && !quotaInfo?.hasApiKey && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center text-yellow-800">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      <span>额度已用完，请升级订阅或配置自己的API Key</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Key管理 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Key className="h-5 w-5 mr-2" />
              API Key管理
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              配置自己的DeepSeek API Key，额度用完后可继续使用AI功能
            </p>

            {quotaInfo?.hasApiKey ? (
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span>API Key已配置</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleDeleteApiKey}>
                  删除
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <Button onClick={handleSaveApiKey} disabled={saving || !apiKey}>
                  {saving ? '保存中...' : '保存API Key'}
                </Button>
              </div>
            )}

            <div className="text-sm text-gray-500">
              <p>• API Key将加密存储，仅用于AI调用</p>
              <p>• 您可以在 <a href="https://platform.deepseek.com" target="_blank" className="text-blue-500">DeepSeek平台</a> 获取API Key</p>
            </div>
          </CardContent>
        </Card>

        {/* 升级提示 */}
        {quotaInfo?.user.plan === 'free' && (
          <Card className="border-2 border-blue-500">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">升级专业版，解锁全部功能</h3>
                <p className="text-gray-600 mb-4">
                  无限AI调用 + 完整标书生成 + 企业知识库 + 优先客服
                </p>
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">¥99</div>
                    <div className="text-sm text-gray-500">月付</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">¥799</div>
                    <div className="text-sm text-gray-500">年付 <span className="text-red-500">省¥389</span></div>
                  </div>
                </div>
                <Button className="mt-4" onClick={() => router.push('/pricing')}>
                  查看套餐详情
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
