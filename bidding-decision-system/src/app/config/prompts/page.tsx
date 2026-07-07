'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import {
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle,
  Eye,
  Copy,
  Tag,
} from 'lucide-react';

interface PromptTemplate {
  id: string;
  title: string;
  category: string;
  content: string;
  variables: string[];
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
}

const defaultPrompts: PromptTemplate[] = [
  {
    id: '1',
    title: '投标文件分析',
    category: '文件分析',
    content: '请分析以下投标文件的关键信息，包括：\n1. 项目名称和编号\n2. 招标范围和要求\n3. 投标截止日期\n4. 评分标准\n5. 关键资质要求\n\n文件内容：\n{{file_content}}',
    variables: ['file_content'],
    status: 'active',
    createdAt: '2025-01-10',
    updatedAt: '2025-03-01',
  },
  {
    id: '2',
    title: '技术方案生成',
    category: '方案生成',
    content: '根据以下招标要求，生成一份完整的技术方案：\n\n项目名称：{{project_name}}\n技术要求：{{tech_requirements}}\n\n请包含以下章节：\n1. 项目理解\n2. 技术路线\n3. 实施方案\n4. 质量保障\n5. 风险控制',
    variables: ['project_name', 'tech_requirements'],
    status: 'active',
    createdAt: '2025-01-15',
    updatedAt: '2025-02-20',
  },
  {
    id: '3',
    title: '报价策略分析',
    category: '商务分析',
    content: '分析以下项目的报价策略：\n\n预算范围：{{budget}}\n竞争对手：{{competitors}}\n历史中标价：{{history_prices}}\n\n请给出：\n1. 建议报价区间\n2. 定价策略\n3. 利润空间分析',
    variables: ['budget', 'competitors', 'history_prices'],
    status: 'active',
    createdAt: '2025-02-01',
    updatedAt: '2025-02-28',
  },
  {
    id: '4',
    title: '资质文件检查',
    category: '合规检查',
    content: '检查以下资质文件是否满足招标要求：\n\n招标要求：{{requirements}}\n已提供资质：{{documents}}\n\n请列出：\n1. 已满足的资质\n2. 缺失的资质\n3. 建议补充的材料',
    variables: ['requirements', 'documents'],
    status: 'active',
    createdAt: '2025-01-20',
    updatedAt: '2025-03-05',
  },
  {
    id: '5',
    title: '风险评估报告',
    category: '风险分析',
    content: '对以下投标项目进行风险评估：\n\n项目信息：{{project_info}}\n公司情况：{{company_info}}\n\n请评估：\n1. 技术风险\n2. 商务风险\n3. 法律风险\n4. 风险等级和应对建议',
    variables: ['project_info', 'company_info'],
    status: 'draft',
    createdAt: '2025-03-01',
    updatedAt: '2025-03-10',
  },
];

const CATEGORIES = ['文件分析', '方案生成', '商务分析', '合规检查', '风险分析', '其他'];

const STATUS_MAP = {
  active: { label: '启用', color: 'text-[#10b981]', bg: 'bg-[#10b981]/10' },
  draft: { label: '草稿', color: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/10' },
  archived: { label: '已归档', color: 'text-[#6b7280]', bg: 'bg-[#6b7280]/10' },
};

const CATEGORY_COLORS: Record<string, string> = {
  '文件分析': 'bg-blue-500/15 text-blue-400',
  '方案生成': 'bg-purple-500/15 text-purple-400',
  '商务分析': 'bg-amber-500/15 text-amber-400',
  '合规检查': 'bg-emerald-500/15 text-emerald-400',
  '风险分析': 'bg-red-500/15 text-red-400',
};

export default function ConfigPromptsPage() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>(defaultPrompts);
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState<PromptTemplate | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('文件分析');
  const [formContent, setFormContent] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'draft' | 'archived'>('draft');
  const [filterCategory, setFilterCategory] = useState('all');

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{(\w+)\}\}/g) || [];
    return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))];
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormTitle('');
    setFormCategory('文件分析');
    setFormContent('');
    setFormStatus('draft');
    setShowModal(true);
  };

  const openEditModal = (p: PromptTemplate) => {
    setEditingId(p.id);
    setFormTitle(p.title);
    setFormCategory(p.category);
    setFormContent(p.content);
    setFormStatus(p.status);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formTitle.trim() || !formContent.trim()) return;
    const variables = extractVariables(formContent);
    const now = new Date().toISOString().slice(0, 10);
    if (editingId) {
      setPrompts(prompts.map(p =>
        p.id === editingId
          ? { ...p, title: formTitle, category: formCategory, content: formContent, variables, status: formStatus, updatedAt: now }
          : p
      ));
    } else {
      setPrompts([
        ...prompts,
        {
          id: Date.now().toString(),
          title: formTitle,
          category: formCategory,
          content: formContent,
          variables,
          status: formStatus,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此Prompt模板？')) {
      setPrompts(prompts.filter(p => p.id !== id));
    }
  };

  const filteredPrompts = filterCategory === 'all' ? prompts : prompts.filter(p => p.category === filterCategory);

  return (
    <div className="flex h-screen bg-[#0A0A12]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-8 h-16 border-b border-[#2e2e42] flex-shrink-0">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-[#a78bfa]" />
            <div>
              <h1 className="text-xl font-bold text-white">Prompt管理</h1>
              <p className="text-xs text-[#6b7280]">管理AI提示词模板，支持变量插值</p>
            </div>
          </div>
          <button className="btn-primary" onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-1" />
            新建Prompt
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scrollbar">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filterCategory === 'all'
                    ? 'bg-[#7c3aed]/15 text-[#a78bfa] border border-[#7c3aed]/30'
                    : 'text-[#6b7280] border border-[#2e2e42] hover:bg-[#1e1e2e] hover:text-[#e2e8f0]'
                }`}
              >
                全部
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filterCategory === cat
                      ? 'bg-[#7c3aed]/15 text-[#a78bfa] border border-[#7c3aed]/30'
                      : 'text-[#6b7280] border border-[#2e2e42] hover:bg-[#1e1e2e] hover:text-[#e2e8f0]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {filteredPrompts.length === 0 ? (
              <div className="glass-card flex flex-col items-center justify-center py-20">
                <MessageSquare className="h-12 w-12 text-[#6b7280] mb-4" />
                <p className="text-[#6b7280]">暂无Prompt模板</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPrompts.map((p) => {
                  const st = STATUS_MAP[p.status];
                  const catColor = CATEGORY_COLORS[p.category] || 'bg-[#2a2a3c] text-[#9ca3af]';
                  return (
                    <div key={p.id} className="glass-card p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-white">{p.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${catColor}`}>
                              {p.category}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>
                              {st.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            {p.variables.map((v) => (
                              <span key={v} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-[#7c3aed]/10 text-[#a78bfa]">
                                <Tag className="w-3 h-3" />
                                {`{{${v}}}`}
                              </span>
                            ))}
                          </div>
                          <p className="text-sm text-[#6b7280] line-clamp-2 font-mono bg-[#1e1e2e] rounded-lg p-3">
                            {p.content}
                          </p>
                          <div className="text-xs text-[#4b5563] mt-2">
                            更新于 {p.updatedAt}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                          <button
                            onClick={() => setShowPreview(p)}
                            className="p-2 rounded-lg hover:bg-[#1e1e2e] transition-colors"
                            title="预览"
                          >
                            <Eye className="w-4 h-4 text-[#6b7280] hover:text-[#60a5fa]" />
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(p.content);
                            }}
                            className="p-2 rounded-lg hover:bg-[#1e1e2e] transition-colors"
                            title="复制"
                          >
                            <Copy className="w-4 h-4 text-[#6b7280] hover:text-[#10b981]" />
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-2 rounded-lg hover:bg-[#1e1e2e] transition-colors"
                            title="编辑"
                          >
                            <Pencil className="w-4 h-4 text-[#6b7280] hover:text-[#a78bfa]" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-2 rounded-lg hover:bg-[#1e1e2e] transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4 text-[#6b7280] hover:text-[#ef4444]" />
                          </button>
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
          <div className="glass-card w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-[#2e2e42]">
              <h2 className="text-lg font-semibold text-white">
                {editingId ? '编辑Prompt' : '新建Prompt'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[#6b7280] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">模板名称</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="input-field"
                  placeholder="输入Prompt模板名称"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">分类</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="input-field"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
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
                    <option value="active">启用</option>
                    <option value="draft">草稿</option>
                    <option value="archived">归档</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">
                  Prompt内容
                  <span className="text-[#4b5563] ml-2">使用 {'{{variable}}'} 插入变量</span>
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={12}
                  className="input-field resize-none font-mono text-sm"
                  placeholder="输入Prompt内容，使用 {{variable}} 格式定义变量"
                />
              </div>
              {formContent && (
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">检测到的变量</label>
                  <div className="flex flex-wrap gap-2">
                    {extractVariables(formContent).map((v) => (
                      <span key={v} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-[#7c3aed]/10 text-[#a78bfa]">
                        <Tag className="w-3 h-3" />
                        {`{{${v}}}`}
                      </span>
                    ))}
                    {extractVariables(formContent).length === 0 && (
                      <span className="text-xs text-[#4b5563]">未检测到变量</span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-[#2e2e42]">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn-primary" onClick={handleSave} disabled={!formTitle.trim() || !formContent.trim()}>
                <CheckCircle className="h-4 w-4 mr-1" />
                {editingId ? '保存修改' : '创建模板'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPreview && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="glass-card w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-[#2e2e42]">
              <h2 className="text-lg font-semibold text-white">Prompt预览</h2>
              <button onClick={() => setShowPreview(null)} className="text-[#6b7280] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <div className="mb-3 flex items-center gap-2">
                <span className="font-medium text-white">{showPreview.title}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#2a2a3c] text-[#9ca3af]">{showPreview.category}</span>
              </div>
              <pre className="bg-[#1e1e2e] rounded-xl p-4 text-sm text-[#e2e8f0] font-mono whitespace-pre-wrap">
                {showPreview.content}
              </pre>
            </div>
            <div className="flex justify-end p-5 border-t border-[#2e2e42]">
              <button className="btn-ghost" onClick={() => setShowPreview(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
