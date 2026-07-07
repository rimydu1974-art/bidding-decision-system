'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, TestTube, Shield, CreditCard, Mail, Server, Key, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface AISettings {
  provider: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

interface PaymentSettings {
  wechatEnabled: boolean;
  wechatAppId: string;
  wechatMchId: string;
  wechatApiKey: string;
  alipayEnabled: boolean;
  alipayAppId: string;
  alipayPrivateKey: string;
  alipayPublicKey: string;
}

interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromName: string;
  fromEmail: string;
  useSsl: boolean;
}

interface BasicSettings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  maxUploadSize: number;
  sessionTimeout: number;
}

interface Settings {
  ai: AISettings;
  payment: PaymentSettings;
  email: EmailSettings;
  basic: BasicSettings;
}

const tabs = [
  { id: 'ai', name: 'AI服务', icon: Server },
  { id: 'payment', name: '支付配置', icon: CreditCard },
  { id: 'email', name: '邮件配置', icon: Mail },
  { id: 'basic', name: '基础设置', icon: Settings },
];

const aiProviders = [
  { id: 'deepseek', name: 'DeepSeek' },
  { id: 'tongyi', name: '通义千问' },
  { id: 'zhipu', name: '智谱' },
  { id: 'moonshot', name: '月之暗面' },
  { id: 'baichuan', name: '百川' },
  { id: 'spark', name: '讯飞星火' },
  { id: 'ernie', name: '文心一言' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'azure', name: 'Azure OpenAI' },
  { id: 'gemini', name: 'Gemini' },
  { id: 'local', name: '本地模型' },
];

const aiModels: Record<string, string[]> = {
  deepseek: ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'],
  tongyi: ['qwen-plus', 'qwen-turbo', 'qwen-max', 'qwen-long'],
  zhipu: ['glm-4', 'glm-4-flash', 'glm-3-turbo'],
  moonshot: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  baichuan: ['baichuan-4', 'baichuan-3-turbo', 'baichuan2-turbo'],
  spark: ['general', 'generalv3.5', '4.0Ultra'],
  ernie: ['ernie-4.0-8k', 'ernie-3.5-8k', 'ernie-speed-128k'],
  openai: ['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  azure: ['gpt-4', 'gpt-4-turbo', 'gpt-35-turbo'],
  gemini: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
  local: ['llama-3-70b', 'qwen-72b', 'mistral-7b'],
};

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('ai');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const defaultSettings: Settings = {
    ai: { provider: 'openai', apiKey: '', model: 'gpt-4', temperature: 0.7, maxTokens: 4096 },
    payment: { wechatEnabled: false, wechatAppId: '', wechatMchId: '', wechatApiKey: '', alipayEnabled: false, alipayAppId: '', alipayPrivateKey: '', alipayPublicKey: '' },
    email: { smtpHost: '', smtpPort: 587, smtpUser: '', smtpPassword: '', fromName: '', fromEmail: '', useSsl: true },
    basic: { siteName: '投标决策系统', siteDescription: '', maintenanceMode: false, maxUploadSize: 10, sessionTimeout: 30 },
  };

  const parseSettingsFromDB = (dbSettings: { key: string; value: string; category: string }[]): Settings => {
    const result = { ...defaultSettings };
    for (const s of dbSettings) {
      const cat = s.category as keyof Settings;
      if (!result[cat]) continue;
      let val: any = s.value;
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (!isNaN(Number(val)) && val !== '') val = Number(val);
      (result[cat] as any)[s.key] = val;
    }
    return result;
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings && Array.isArray(data.settings)) {
          setSettings(parseSettingsFromDB(data.settings));
        } else {
          setSettings(defaultSettings);
        }
      } else {
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const categorySettings = settings[activeTab as keyof Settings];
      const entries = Object.entries(categorySettings);
      let allOk = true;
      for (const [key, value] of entries) {
        const res = await fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value: String(value), category: activeTab }),
        });
        if (!res.ok) { allOk = false; break; }
      }
      alert(allOk ? '设置已保存' : '保存失败');
    } catch (error) {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!settings?.ai) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: settings.ai.provider, apiKey: settings.ai.apiKey, model: settings.ai.model }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ success: false, message: '连接测试失败' });
    } finally {
      setTesting(false);
    }
  };

  const updateAISettings = (updates: Partial<AISettings>) => {
    if (!settings) return;
    setSettings({ ...settings, ai: { ...settings.ai, ...updates } });
  };

  const updatePaymentSettings = (updates: Partial<PaymentSettings>) => {
    if (!settings) return;
    setSettings({ ...settings, payment: { ...settings.payment, ...updates } });
  };

  const updateEmailSettings = (updates: Partial<EmailSettings>) => {
    if (!settings) return;
    setSettings({ ...settings, email: { ...settings.email, ...updates } });
  };

  const updateBasicSettings = (updates: Partial<BasicSettings>) => {
    if (!settings) return;
    setSettings({ ...settings, basic: { ...settings.basic, ...updates } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A12] flex items-center justify-center">
        <div className="glass-card p-8 rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#60a5fa] mx-auto"></div>
          <p className="text-[#9ca3af] mt-4">加载中...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-[#0A0A12] flex items-center justify-center">
        <div className="glass-card p-8 rounded-2xl">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto" />
          <p className="text-[#9ca3af] mt-4">加载设置失败</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A12] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-[#60a5fa]" />
            <h1 className="text-2xl font-bold text-white">系统设置</h1>
          </div>
          <p className="text-[#9ca3af] mt-2">配置系统参数和服务集成</p>
        </div>

        <div className="flex gap-6">
          <div className="w-64 flex-shrink-0">
            <div className="glass-card rounded-2xl p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        activeTab === tab.id
                          ? 'bg-[#60a5fa]/20 text-[#60a5fa] border border-[#60a5fa]/30'
                          : 'text-[#9ca3af] hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="flex-1">
            <div className="glass-card rounded-2xl p-6">
              {activeTab === 'ai' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Server className="h-6 w-6 text-[#60a5fa]" />
                    <h2 className="text-xl font-bold text-white">AI服务配置</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#9ca3af] mb-2">AI提供商</label>
                      <select
                        value={settings.ai.provider}
                        onChange={(e) => {
                          const provider = e.target.value;
                          updateAISettings({
                            provider,
                            model: aiModels[provider]?.[0] || '',
                          });
                        }}
                        className="w-full bg-[#1a1a2e] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#60a5fa]"
                      >
                        {aiProviders.map((provider) => (
                          <option key={provider.id} value={provider.id}>
                            {provider.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#9ca3af] mb-2">API密钥</label>
                      <div className="relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={settings.ai.apiKey}
                          onChange={(e) => updateAISettings({ apiKey: e.target.value })}
                          className="w-full bg-[#1a1a2e] border border-gray-700 rounded-xl px-4 py-3 text-white pr-12 focus:outline-none focus:border-[#60a5fa]"
                          placeholder="输入API密钥"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-white"
                        >
                          {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#9ca3af] mb-2">模型</label>
                      <select
                        value={settings.ai.model}
                        onChange={(e) => updateAISettings({ model: e.target.value })}
                        className="w-full bg-[#1a1a2e] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#60a5fa]"
                      >
                        {aiModels[settings.ai.provider]?.map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#9ca3af] mb-2">温度 (0-1)</label>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={settings.ai.temperature}
                          onChange={(e) => updateAISettings({ temperature: parseFloat(e.target.value) })}
                          className="w-full bg-[#1a1a2e] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#60a5fa]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#9ca3af] mb-2">最大Token数</label>
                        <input
                          type="number"
                          min="256"
                          max="128000"
                          value={settings.ai.maxTokens}
                          onChange={(e) => updateAISettings({ maxTokens: parseInt(e.target.value) })}
                          className="w-full bg-[#1a1a2e] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#60a5fa]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-6">
                    <h3 className="text-lg font-bold text-white mb-4">连接测试</h3>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleTestConnection}
                        disabled={testing || !settings.ai.apiKey}
                        className="flex items-center gap-2 bg-[#60a5fa] hover:bg-[#3b82f6] disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-all"
                      >
                        {testing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            测试中...
                          </>
                        ) : (
                          <>
                            <TestTube className="h-5 w-5" />
                            测试连接
                          </>
                        )}
                      </button>
                      {testResult && (
                        <div className={`flex items-center gap-2 ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                          {testResult.success ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <AlertCircle className="h-5 w-5" />
                          )}
                          <span>{testResult.message}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'payment' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <CreditCard className="h-6 w-6 text-[#60a5fa]" />
                    <h2 className="text-xl font-bold text-white">支付配置</h2>
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 bg-[#1a1a2e] rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">微信支付</h3>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.payment.wechatEnabled}
                            onChange={(e) => updatePaymentSettings({ wechatEnabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#60a5fa]"></div>
                        </label>
                      </div>
                      {settings.payment.wechatEnabled && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-[#9ca3af] mb-2">AppID</label>
                            <input
                              type="text"
                              value={settings.payment.wechatAppId}
                              onChange={(e) => updatePaymentSettings({ wechatAppId: e.target.value })}
                              className="w-full bg-[#0A0A12] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#60a5fa]"
                              placeholder="微信AppID"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#9ca3af] mb-2">商户号</label>
                            <input
                              type="text"
                              value={settings.payment.wechatMchId}
                              onChange={(e) => updatePaymentSettings({ wechatMchId: e.target.value })}
                              className="w-full bg-[#0A0A12] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#60a5fa]"
                              placeholder="商户号"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#9ca3af] mb-2">API密钥</label>
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                value={settings.payment.wechatApiKey}
                                onChange={(e) => updatePaymentSettings({ wechatApiKey: e.target.value })}
                                className="w-full bg-[#0A0A12] border border-gray-700 rounded-xl px-4 py-3 text-white pr-12 focus:outline-none focus:border-[#60a5fa]"
                                placeholder="API密钥"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-white"
                              >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-[#1a1a2e] rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">支付宝</h3>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.payment.alipayEnabled}
                            onChange={(e) => updatePaymentSettings({ alipayEnabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#60a5fa]"></div>
                        </label>
                      </div>
                      {settings.payment.alipayEnabled && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-[#9ca3af] mb-2">AppID</label>
                            <input
                              type="text"
                              value={settings.payment.alipayAppId}
                              onChange={(e) => updatePaymentSettings({ alipayAppId: e.target.value })}
                              className="w-full bg-[#0A0A12] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#60a5fa]"
                              placeholder="支付宝AppID"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#9ca3af] mb-2">应用私钥</label>
                            <textarea
                              value={settings.payment.alipayPrivateKey}
                              onChange={(e) => updatePaymentSettings({ alipayPrivateKey: e.target.value })}
                              className="w-full bg-[#0A0A12] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#60a5fa] h-24"
                              placeholder="应用私钥"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#9ca3af] mb-2">支付宝公钥</label>
                            <textarea
                              value={settings.payment.alipayPublicKey}
                              onChange={(e) => updatePaymentSettings({ alipayPublicKey: e.target.value })}
                              className="w-full bg-[#0A0A12] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#60a5fa] h-24"
                              placeholder="支付宝公钥"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'email' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Mail className="h-6 w-6 text-[#60a5fa]" />
                    <h2 className="text-xl font-bold text-white">邮件配置</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#9ca3af] mb-2">SMTP服务器</label>
                        <input
                          type="text"
                          value={settings.email.smtpHost}
                          onChange={(e) => updateEmailSettings({ smtpHost: e.target.value })}
                          className="w-full bg-[#1a1a2e] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#60a5fa]"
                          placeholder="smtp.example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#9ca3af] mb-2">端口</label>
                        <input
                          type="number"
                          value={settings.email.smtpPort}
                          onChange={(e) => updateEmailSettings({ smtpPort: parseInt(e.target.value) })}
                          className="w-full bg-[#1a1a2e] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#60a5fa]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#9ca3af] mb-2">用户名</label>
                      <input
                        type="text"
                        value={settings.email.smtpUser}
                        onChange={(e) => updateEmailSettings({ smtpUser: e.target.value })}
                        className="w-full bg-[#1a1a2e] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#60a5fa]"
                        placeholder="邮箱用户名"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#9ca3af] mb-2">密码</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={settings.email.smtpPassword}
                          onChange={(e) => updateEmailSettings({ smtpPassword: e.target.value })}
                          className="w-full bg-[#1a1a2e] border border-gray-700 rounded-xl px-4 py-3 text-white pr-12 focus:outline-none focus:border-[#60a5fa]"
                          placeholder="邮箱密码"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-white"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#9ca3af] mb-2">发件人名称</label>
                        <input
                          type="text"
                          value={settings.email.fromName}
                          onChange={(e) => updateEmailSettings({ fromName: e.target.value })}
                          className="w-full bg-[#1a1a2e] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#60a5fa]"
                          placeholder="系统名称"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#9ca3af] mb-2">发件人邮箱</label>
                        <input
                          type="email"
                          value={settings.email.fromEmail}
                          onChange={(e) => updateEmailSettings({ fromEmail: e.target.value })}
                          className="w-full bg-[#1a1a2e] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#60a5fa]"
                          placeholder="noreply@example.com"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="useSsl"
                        checked={settings.email.useSsl}
                        onChange={(e) => updateEmailSettings({ useSsl: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-700 bg-[#1a1a2e] text-[#60a5fa] focus:ring-[#60a5fa]"
                      />
                      <label htmlFor="useSsl" className="text-[#9ca3af]">使用SSL加密</label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Shield className="h-6 w-6 text-[#60a5fa]" />
                    <h2 className="text-xl font-bold text-white">基础设置</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#9ca3af] mb-2">站点名称</label>
                      <input
                        type="text"
                        value={settings.basic.siteName}
                        onChange={(e) => updateBasicSettings({ siteName: e.target.value })}
                        className="w-full bg-[#1a1a2e] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#60a5fa]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#9ca3af] mb-2">站点描述</label>
                      <textarea
                        value={settings.basic.siteDescription}
                        onChange={(e) => updateBasicSettings({ siteDescription: e.target.value })}
                        className="w-full bg-[#1a1a2e] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#60a5fa] h-24"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#9ca3af] mb-2">最大上传大小 (MB)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={settings.basic.maxUploadSize}
                          onChange={(e) => updateBasicSettings({ maxUploadSize: parseInt(e.target.value) })}
                          className="w-full bg-[#1a1a2e] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#60a5fa]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#9ca3af] mb-2">会话超时 (分钟)</label>
                        <input
                          type="number"
                          min="5"
                          max="1440"
                          value={settings.basic.sessionTimeout}
                          onChange={(e) => updateBasicSettings({ sessionTimeout: parseInt(e.target.value) })}
                          className="w-full bg-[#1a1a2e] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#60a5fa]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <input
                        type="checkbox"
                        id="maintenanceMode"
                        checked={settings.basic.maintenanceMode}
                        onChange={(e) => updateBasicSettings({ maintenanceMode: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-700 bg-[#1a1a2e] text-red-500 focus:ring-red-500"
                      />
                      <label htmlFor="maintenanceMode" className="text-red-400">启用维护模式</label>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-700 mt-6 pt-6 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-[#60a5fa] hover:bg-[#3b82f6] disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-all"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      保存设置
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
