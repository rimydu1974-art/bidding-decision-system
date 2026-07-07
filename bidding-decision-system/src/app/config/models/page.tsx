'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import {
  Cpu,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle,
  Star,
  Zap,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  apiKey: string;
  maxTokens: number;
  temperature: number;
  isDefault: boolean;
  status: 'active' | 'inactive' | 'testing';
  createdAt: string;
}

const defaultModels: AIModel[] = [
  {
    id: '1',
    name: 'GPT-4o',
    provider: 'OpenAI',
    modelId: 'gpt-4o',
    apiKey: 'sk-****...****',
    maxTokens: 128000,
    temperature: 0.7,
    isDefault: true,
    status: 'active',
    createdAt: '2025-01-10',
  },
  {
    id: '2',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    modelId: 'claude-3-5-sonnet-20241022',
    apiKey: 'sk-ant-****...****',
    maxTokens: 200000,
    temperature: 0.7,
    isDefault: false,
    status: 'active',
    createdAt: '2025-02-01',
  },
  {
    id: '3',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    modelId: 'gpt-4-turbo',
    apiKey: 'sk-****...****',
    maxTokens: 128000,
    temperature: 0.7,
    isDefault: false,
    status: 'active',
    createdAt: '2025-01-15',
  },
  {
    id: '4',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    modelId: 'deepseek-chat',
    apiKey: 'sk-****...****',
    maxTokens: 64000,
    temperature: 0.7,
    isDefault: false,
    status: 'inactive',
    createdAt: '2025-03-01',
  },
  {
    id: '5',
    name: 'Qwen Max',
    provider: 'Alibaba',
    modelId: 'qwen-max',
    apiKey: 'sk-****...****',
    maxTokens: 32000,
    temperature: 0.7,
    isDefault: false,
    status: 'testing',
    createdAt: '2025-03-10',
  },
];

const PROVIDERS = ['DeepSeek', '通义千问', '智谱', '月之暗面', '百川', '讯飞星火', '文心一言', 'OpenAI', 'Anthropic', 'Azure', 'Gemini', '其他'];

const STATUS_MAP = {
  active: { label: '已启用', color: 'text-[#10b981]', bg: 'bg-[#10b981]/10' },
  inactive: { label: '已停用', color: 'text-[#6b7280]', bg: 'bg-[#6b7280]/10' },
  testing: { label: '测试中', color: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/10' },
};

const PROVIDER_COLORS: Record<string, string> = {
  'DeepSeek': 'bg-purple-500/15 text-purple-400',
  '通义千问': 'bg-cyan-500/15 text-cyan-400',
  '智谱': 'bg-green-500/15 text-green-400',
  '月之暗面': 'bg-pink-500/15 text-pink-400',
  '百川': 'bg-blue-400/15 text-blue-300',
  '讯飞星火': 'bg-orange-500/15 text-orange-400',
  '文心一言': 'bg-red-500/15 text-red-400',
  'OpenAI': 'bg-emerald-500/15 text-emerald-400',
  'Anthropic': 'bg-orange-500/15 text-orange-400',
  'Azure': 'bg-blue-500/15 text-blue-400',
  'Gemini': 'bg-yellow-500/15 text-yellow-400',
  '其他': 'bg-gray-500/15 text-gray-400',
};

export default function ConfigModelsPage() {
  const router = useRouter();
  const [models, setModels] = useState<AIModel[]>(defaultModels);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showApiKeyMap, setShowApiKeyMap] = useState<Record<string, boolean>>({});
  const [userPlan, setUserPlan] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        const plan = data.user?.plan || 'free';
        setUserPlan(plan);
        // 免费/19元用户不能访问模型配置
        if (plan === 'free' || plan === 'single') {
          router.push('/pricing');
        }
      })
      .catch(() => router.push('/pricing'));
  }, [router]);

  const [formName, setFormName] = useState('');
  const [formProvider, setFormProvider] = useState('OpenAI');
  const [formModelId, setFormModelId] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formMaxTokens, setFormMaxTokens] = useState(128000);
  const [formTemperature, setFormTemperature] = useState(0.7);
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [formStatus, setFormStatus] = useState<'active' | 'inactive' | 'testing'>('active');

  const openCreateModal = () => {
    setEditingId(null);
    setFormName('');
    setFormProvider('OpenAI');
    setFormModelId('');
    setFormApiKey('');
    setFormMaxTokens(128000);
    setFormTemperature(0.7);
    setFormIsDefault(false);
    setFormStatus('active');
    setShowModal(true);
  };

  const openEditModal = (m: AIModel) => {
    setEditingId(m.id);
    setFormName(m.name);
    setFormProvider(m.provider);
    setFormModelId(m.modelId);
    setFormApiKey(m.apiKey);
    setFormMaxTokens(m.maxTokens);
    setFormTemperature(m.temperature);
    setFormIsDefault(m.isDefault);
    setFormStatus(m.status);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formModelId.trim()) return;
    const now = new Date().toISOString().slice(0, 10);
    let updated = models;
    if (editingId) {
      updated = models.map(m =>
        m.id === editingId
          ? { ...m, name: formName, provider: formProvider, modelId: formModelId, apiKey: formApiKey, maxTokens: formMaxTokens, temperature: formTemperature, isDefault: formIsDefault, status: formStatus }
          : m
      );
    } else {
      updated = [
        ...models,
        {
          id: Date.now().toString(),
          name: formName,
          provider: formProvider,
          modelId: formModelId,
          apiKey: formApiKey,
          maxTokens: formMaxTokens,
          temperature: formTemperature,
          isDefault: formIsDefault,
          status: formStatus,
          createdAt: now,
        },
      ];
    }
    if (formIsDefault) {
      const defaultId = editingId || (updated.length > 0 ? updated[updated.length - 1].id : '');
      updated = updated.map(m => ({ ...m, isDefault: m.id === defaultId }));
    }
    setModels(updated);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此模型配置？')) {
      setModels(models.filter(m => m.id !== id));
    }
  };

  const toggleDefault = (id: string) => {
    setModels(models.map(m => ({ ...m, isDefault: m.id === id })));
  };

  if (userPlan === null) {
    return (
      <div className="flex h-screen bg-[#0A0A12] items-center justify-center">
        <div className="text-[#9ca3af]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0A0A12]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-8 h-16 border-b border-[#2e2e42] flex-shrink-0">
          <div className="flex items-center gap-3">
            <Cpu className="h-6 w-6 text-[#a78bfa]" />
            <div>
              <h1 className="text-xl font-bold text-white">模型配置</h1>
              <p className="text-xs text-[#6b7280]">管理AI模型接入和配置参数</p>
            </div>
          </div>
          <button className="btn-primary" onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-1" />
            添加模型
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scrollbar">
          <div className="max-w-5xl mx-auto">
            {models.length === 0 ? (
              <div className="glass-card flex flex-col items-center justify-center py-20">
                <Cpu className="h-12 w-12 text-[#6b7280] mb-4" />
                <p className="text-[#6b7280]">暂无模型配置</p>
                <button className="btn-primary mt-4" onClick={openCreateModal}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加第一个模型
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {models.map((m) => {
                  const st = STATUS_MAP[m.status];
                  const provColor = PROVIDER_COLORS[m.provider] || 'bg-[#2a2a3c] text-[#9ca3af]';
                  const maskedKey = m.apiKey.length > 10
                    ? m.apiKey.slice(0, 6) + '****' + m.apiKey.slice(-4)
                    : m.apiKey;

                  return (
                    <div key={m.id} className={`glass-card p-5 relative ${m.isDefault ? 'ring-2 ring-[#7c3aed]/50' : ''}`}>
                      {m.isDefault && (
                        <div className="absolute -top-2 -right-2 bg-[#7c3aed] rounded-full p-1">
                          <Star className="w-3 h-3 text-white fill-white" />
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white text-lg">{m.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>
                              {st.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${provColor}`}>
                              {m.provider}
                            </span>
                            <span className="text-xs text-[#6b7280] font-mono">{m.modelId}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleDefault(m.id)}
                            className={`p-2 rounded-lg hover:bg-[#1e1e2e] transition-colors ${m.isDefault ? 'text-[#a78bfa]' : 'text-[#6b7280]'}`}
                            title={m.isDefault ? '当前默认模型' : '设为默认'}
                          >
                            <Star className={`w-4 h-4 ${m.isDefault ? 'fill-[#a78bfa]' : ''}`} />
                          </button>
                          <button
                            onClick={() => openEditModal(m)}
                            className="p-2 rounded-lg hover:bg-[#1e1e2e] transition-colors"
                            title="编辑"
                          >
                            <Pencil className="w-4 h-4 text-[#6b7280] hover:text-[#a78bfa]" />
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="p-2 rounded-lg hover:bg-[#1e1e2e] transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4 text-[#6b7280] hover:text-[#ef4444]" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[#6b7280]">API Key</span>
                          <span className="text-[#9ca3af] font-mono text-xs">{maskedKey}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#6b7280]">最大Tokens</span>
                          <span className="text-[#9ca3af]">{m.maxTokens.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#6b7280]">温度</span>
                          <span className="text-[#9ca3af]">{m.temperature}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="glass-card w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-[#2e2e42]">
              <h2 className="text-lg font-semibold text-white">
                {editingId ? '编辑模型' : '添加模型'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[#6b7280] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">模型名称</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="input-field"
                  placeholder="如 GPT-4o、Claude 3.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">提供商</label>
                  <select
                    value={formProvider}
                    onChange={(e) => setFormProvider(e.target.value)}
                    className="input-field"
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">状态</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as typeof formStatus)}
                    className="input-field"
                  >
                    <option value="active">已启用</option>
                    <option value="inactive">已停用</option>
                    <option value="testing">测试中</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">模型ID</label>
                <input
                  type="text"
                  value={formModelId}
                  onChange={(e) => setFormModelId(e.target.value)}
                  className="input-field font-mono"
                  placeholder="如 gpt-4o, claude-3-5-sonnet"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">API Key</label>
                <input
                  type="password"
                  value={formApiKey}
                  onChange={(e) => setFormApiKey(e.target.value)}
                  className="input-field font-mono"
                  placeholder="输入API密钥"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">最大Tokens</label>
                  <input
                    type="number"
                    min={1024}
                    max={1000000}
                    value={formMaxTokens}
                    onChange={(e) => setFormMaxTokens(Number(e.target.value))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">温度 (0-1)</label>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                    value={formTemperature}
                    onChange={(e) => setFormTemperature(Number(e.target.value))}
                    className="input-field"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1e1e2e] border border-[#2e2e42]">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formIsDefault}
                  onChange={(e) => setFormIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-[#0A0A12] text-[#7c3aed] focus:ring-[#7c3aed]"
                />
                <label htmlFor="isDefault" className="text-sm text-[#9ca3af]">设为默认模型</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-[#2e2e42]">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn-primary" onClick={handleSave} disabled={!formName.trim() || !formModelId.trim()}>
                <CheckCircle className="h-4 w-4 mr-1" />
                {editingId ? '保存修改' : '添加模型'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
