'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import {
  Scale,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle,
} from 'lucide-react';

interface ScoringRule {
  id: string;
  title: string;
  category: string;
  weight: number;
  maxScore: number;
  description: string;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
}

const defaultRules: ScoringRule[] = [
  {
    id: '1',
    title: '技术方案完整性',
    category: '技术评分',
    weight: 25,
    maxScore: 100,
    description: '评估技术方案是否完整覆盖招标文件所有技术要求',
    status: 'active',
    createdAt: '2025-01-10',
  },
  {
    id: '2',
    title: '项目团队资质',
    category: '技术评分',
    weight: 15,
    maxScore: 100,
    description: '评估项目团队的经验和资质是否满足要求',
    status: 'active',
    createdAt: '2025-01-10',
  },
  {
    id: '3',
    title: '报价合理性',
    category: '商务评分',
    weight: 20,
    maxScore: 100,
    description: '评估投标报价是否合理且具有竞争力',
    status: 'active',
    createdAt: '2025-01-10',
  },
  {
    id: '4',
    title: '交付周期',
    category: '商务评分',
    weight: 10,
    maxScore: 100,
    description: '评估承诺的交付周期是否满足要求',
    status: 'active',
    createdAt: '2025-01-10',
  },
  {
    id: '5',
    title: '售后服务方案',
    category: '商务评分',
    weight: 10,
    maxScore: 100,
    description: '评估售后服务承诺和保障措施',
    status: 'draft',
    createdAt: '2025-02-15',
  },
  {
    id: '6',
    title: '企业资质',
    category: '资质评分',
    weight: 10,
    maxScore: 100,
    description: '评估企业资质等级和相关认证',
    status: 'active',
    createdAt: '2025-01-10',
  },
  {
    id: '7',
    title: '类似项目经验',
    category: '资质评分',
    weight: 10,
    maxScore: 100,
    description: '评估类似项目的成功案例和经验',
    status: 'active',
    createdAt: '2025-01-10',
  },
];

const CATEGORIES = ['技术评分', '商务评分', '资质评分', '价格评分', '其他'];

const STATUS_MAP = {
  active: { label: '启用', color: 'text-[#10b981]', bg: 'bg-[#10b981]/10' },
  draft: { label: '草稿', color: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/10' },
  archived: { label: '已归档', color: 'text-[#6b7280]', bg: 'bg-[#6b7280]/10' },
};

export default function EvaluationRulesPage() {
  const [rules, setRules] = useState<ScoringRule[]>(defaultRules);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('技术评分');
  const [formWeight, setFormWeight] = useState(10);
  const [formMaxScore, setFormMaxScore] = useState(100);
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'draft' | 'archived'>('draft');
  const [filterCategory, setFilterCategory] = useState('all');

  const openCreateModal = () => {
    setEditingId(null);
    setFormTitle('');
    setFormCategory('技术评分');
    setFormWeight(10);
    setFormMaxScore(100);
    setFormDescription('');
    setFormStatus('draft');
    setShowModal(true);
  };

  const openEditModal = (r: ScoringRule) => {
    setEditingId(r.id);
    setFormTitle(r.title);
    setFormCategory(r.category);
    setFormWeight(r.weight);
    setFormMaxScore(r.maxScore);
    setFormDescription(r.description);
    setFormStatus(r.status);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formTitle.trim()) return;
    if (editingId) {
      setRules(rules.map(r =>
        r.id === editingId
          ? { ...r, title: formTitle, category: formCategory, weight: formWeight, maxScore: formMaxScore, description: formDescription, status: formStatus }
          : r
      ));
    } else {
      setRules([
        ...rules,
        {
          id: Date.now().toString(),
          title: formTitle,
          category: formCategory,
          weight: formWeight,
          maxScore: formMaxScore,
          description: formDescription,
          status: formStatus,
          createdAt: new Date().toISOString().slice(0, 10),
        },
      ]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此评分规则？')) {
      setRules(rules.filter(r => r.id !== id));
    }
  };

  const totalWeight = rules.filter(r => r.status === 'active').reduce((sum, r) => sum + r.weight, 0);

  const filteredRules = filterCategory === 'all' ? rules : rules.filter(r => r.category === filterCategory);

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = filteredRules.filter(r => r.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {} as Record<string, ScoringRule[]>);

  return (
    <div className="flex h-screen bg-[#0A0A12]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-8 h-16 border-b border-[#2e2e42] flex-shrink-0">
          <div className="flex items-center gap-3">
            <Scale className="h-6 w-6 text-[#a78bfa]" />
            <div>
              <h1 className="text-xl font-bold text-white">评分规则库</h1>
              <p className="text-xs text-[#6b7280]">定义和管理评审评分规则与权重</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-[#6b7280]">已分配权重: </span>
              <span className={`font-bold ${totalWeight === 100 ? 'text-[#10b981]' : totalWeight > 100 ? 'text-[#ef4444]' : 'text-[#f59e0b]'}`}>
                {totalWeight}%
              </span>
              <span className="text-[#4b5563]"> / 100%</span>
            </div>
            <button className="btn-primary" onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-1" />
              新建规则
            </button>
          </div>
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

            {Object.entries(grouped).length === 0 ? (
              <div className="glass-card flex flex-col items-center justify-center py-20">
                <Scale className="h-12 w-12 text-[#6b7280] mb-4" />
                <p className="text-[#6b7280]">暂无评分规则</p>
              </div>
            ) : (
              Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <h2 className="text-sm font-medium text-[#6b7280] mb-3 uppercase tracking-wider">{category}</h2>
                  <div className="space-y-2">
                    {items.map((r) => {
                      const st = STATUS_MAP[r.status];
                      return (
                        <div key={r.id} className="glass-card p-4 flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <h3 className="font-medium text-white">{r.title}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>
                                {st.label}
                              </span>
                            </div>
                            <p className="text-xs text-[#6b7280] mt-1 truncate">{r.description}</p>
                          </div>
                          <div className="flex items-center gap-6 flex-shrink-0">
                            <div className="text-center">
                              <div className="text-lg font-bold text-[#a78bfa]">{r.weight}%</div>
                              <div className="text-xs text-[#4b5563]">权重</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-[#9ca3af]">{r.maxScore}</div>
                              <div className="text-xs text-[#4b5563]">满分</div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => openEditModal(r)}
                                className="p-2 rounded-lg hover:bg-[#1e1e2e] transition-colors"
                                title="编辑"
                              >
                                <Pencil className="w-4 h-4 text-[#6b7280] hover:text-[#a78bfa]" />
                              </button>
                              <button
                                onClick={() => handleDelete(r.id)}
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
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="glass-card w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-5 border-b border-[#2e2e42]">
              <h2 className="text-lg font-semibold text-white">
                {editingId ? '编辑评分规则' : '新建评分规则'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[#6b7280] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">规则名称</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="input-field"
                  placeholder="输入评分规则名称"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">评分分类</label>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">权重 (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formWeight}
                    onChange={(e) => setFormWeight(Number(e.target.value))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">满分</label>
                  <input
                    type="number"
                    min={0}
                    value={formMaxScore}
                    onChange={(e) => setFormMaxScore(Number(e.target.value))}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">规则描述</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="描述此评分规则的评判标准"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-[#2e2e42]">
              <button className="btn-ghost" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn-primary" onClick={handleSave} disabled={!formTitle.trim()}>
                <CheckCircle className="h-4 w-4 mr-1" />
                {editingId ? '保存修改' : '创建规则'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
