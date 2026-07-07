'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import {
  GitBranch,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle,
  XCircle,
  GripVertical,
} from 'lucide-react';

interface ProcessStep {
  id: string;
  title: string;
  description: string;
}

interface ProcessTemplate {
  id: string;
  title: string;
  description: string;
  steps: ProcessStep[];
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
}

const defaultTemplates: ProcessTemplate[] = [
  {
    id: '1',
    title: '标准评审流程',
    description: '适用于一般项目的评审决策流程',
    steps: [
      { id: '1', title: '需求分析', description: '分析招标文件要求' },
      { id: '2', title: '资格审查', description: '审查投标资格条件' },
      { id: '3', title: '技术评审', description: '评估技术方案可行性' },
      { id: '4', title: '商务评审', description: '评估报价和商务条款' },
      { id: '5', title: '综合评分', description: '汇总各项评分得出结论' },
    ],
    status: 'active',
    createdAt: '2025-01-15',
  },
  {
    id: '2',
    title: '快速评审流程',
    description: '适用于小额项目的简化评审流程',
    steps: [
      { id: '1', title: '初步筛选', description: '快速筛选基本条件' },
      { id: '2', title: '综合评审', description: '合并技术和商务评审' },
    ],
    status: 'active',
    createdAt: '2025-02-20',
  },
  {
    id: '3',
    title: '专家评审流程',
    description: '适用于复杂项目的多专家评审流程',
    steps: [
      { id: '1', title: '专家分组', description: '按专业领域分组评审' },
      { id: '2', title: '独立评审', description: '各专家组独立评分' },
      { id: '3', title: '交叉复核', description: '专家组交叉复核结果' },
      { id: '4', title: '终审确认', description: '最终评审结果确认' },
    ],
    status: 'draft',
    createdAt: '2025-03-10',
  },
];

const STATUS_MAP = {
  active: { label: '启用', color: 'text-[#10b981]', bg: 'bg-[#10b981]/10' },
  draft: { label: '草稿', color: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/10' },
  archived: { label: '已归档', color: 'text-[#6b7280]', bg: 'bg-[#6b7280]/10' },
};

export default function EvaluationProcessPage() {
  const [templates, setTemplates] = useState<ProcessTemplate[]>(defaultTemplates);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSteps, setFormSteps] = useState<ProcessStep[]>([]);
  const [formStatus, setFormStatus] = useState<'active' | 'draft' | 'archived'>('draft');

  const openCreateModal = () => {
    setEditingId(null);
    setFormTitle('');
    setFormDescription('');
    setFormSteps([{ id: Date.now().toString(), title: '', description: '' }]);
    setFormStatus('draft');
    setShowModal(true);
  };

  const openEditModal = (t: ProcessTemplate) => {
    setEditingId(t.id);
    setFormTitle(t.title);
    setFormDescription(t.description);
    setFormSteps([...t.steps]);
    setFormStatus(t.status);
    setShowModal(true);
  };

  const addStep = () => {
    setFormSteps([...formSteps, { id: Date.now().toString(), title: '', description: '' }]);
  };

  const updateStep = (index: number, field: 'title' | 'description', value: string) => {
    const updated = [...formSteps];
    updated[index] = { ...updated[index], [field]: value };
    setFormSteps(updated);
  };

  const removeStep = (index: number) => {
    setFormSteps(formSteps.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!formTitle.trim()) return;
    if (editingId) {
      setTemplates(templates.map(t =>
        t.id === editingId
          ? { ...t, title: formTitle, description: formDescription, steps: formSteps, status: formStatus }
          : t
      ));
    } else {
      setTemplates([
        ...templates,
        {
          id: Date.now().toString(),
          title: formTitle,
          description: formDescription,
          steps: formSteps,
          status: formStatus,
          createdAt: new Date().toISOString().slice(0, 10),
        },
      ]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此流程模板？')) {
      setTemplates(templates.filter(t => t.id !== id));
    }
  };

  return (
    <div className="flex h-screen bg-[#0A0A12]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-8 h-16 border-b border-[#2e2e42] flex-shrink-0">
          <div className="flex items-center gap-3">
            <GitBranch className="h-6 w-6 text-[#a78bfa]" />
            <div>
              <h1 className="text-xl font-bold text-white">评审流程库</h1>
              <p className="text-xs text-[#6b7280]">管理评审流程模板，定义标准化评审步骤</p>
            </div>
          </div>
          <button className="btn-primary" onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-1" />
            新建流程
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scrollbar">
          <div className="max-w-5xl mx-auto space-y-4">
            {templates.length === 0 ? (
              <div className="glass-card flex flex-col items-center justify-center py-20">
                <GitBranch className="h-12 w-12 text-[#6b7280] mb-4" />
                <p className="text-[#6b7280]">暂无评审流程模板</p>
                <button className="btn-primary mt-4" onClick={openCreateModal}>
                  <Plus className="h-4 w-4 mr-1" />
                  创建第一个流程
                </button>
              </div>
            ) : (
              templates.map((t) => {
                const st = STATUS_MAP[t.status];
                return (
                  <div key={t.id} className="glass-card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-white text-lg">{t.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>
                            {st.label}
                          </span>
                        </div>
                        <p className="text-sm text-[#6b7280] mt-1">{t.description}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(t)}
                          className="p-2 rounded-lg hover:bg-[#1e1e2e] transition-colors"
                          title="编辑"
                        >
                          <Pencil className="w-4 h-4 text-[#6b7280] hover:text-[#a78bfa]" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-2 rounded-lg hover:bg-[#1e1e2e] transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4 text-[#6b7280] hover:text-[#ef4444]" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {t.steps.map((step, idx) => (
                        <div key={step.id} className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e1e2e] border border-[#2e2e42]">
                            <GripVertical className="w-3 h-3 text-[#4b5563]" />
                            <span className="text-xs text-[#9ca3af]">{step.title || `步骤 ${idx + 1}`}</span>
                          </div>
                          {idx < t.steps.length - 1 && (
                            <span className="text-[#4b5563] text-xs">→</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-[#4b5563] mt-3">
                      {t.steps.length} 个步骤 · 创建于 {t.createdAt}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="glass-card w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-[#2e2e42]">
              <h2 className="text-lg font-semibold text-white">
                {editingId ? '编辑流程模板' : '新建流程模板'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[#6b7280] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">流程名称</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="input-field"
                  placeholder="输入流程名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">流程描述</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="input-field resize-none"
                  placeholder="描述此流程的用途"
                />
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
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[#9ca3af]">流程步骤</label>
                  <button onClick={addStep} className="text-xs text-[#a78bfa] hover:text-[#c4b5fd]">
                    + 添加步骤
                  </button>
                </div>
                <div className="space-y-2">
                  {formSteps.map((step, idx) => (
                    <div key={step.id} className="flex items-center gap-2">
                      <span className="text-xs text-[#4b5563] w-6">{idx + 1}.</span>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => updateStep(idx, 'title', e.target.value)}
                        className="input-field flex-1"
                        placeholder="步骤标题"
                      />
                      <input
                        type="text"
                        value={step.description}
                        onChange={(e) => updateStep(idx, 'description', e.target.value)}
                        className="input-field flex-1"
                        placeholder="步骤描述"
                      />
                      <button
                        onClick={() => removeStep(idx)}
                        className="p-1.5 rounded-lg hover:bg-[#1e1e2e] text-[#6b7280] hover:text-[#ef4444]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-[#2e2e42]">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn-primary" onClick={handleSave} disabled={!formTitle.trim()}>
                <CheckCircle className="h-4 w-4 mr-1" />
                {editingId ? '保存修改' : '创建流程'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
