'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import {
  History,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle,
  Tag,
  ArrowUp,
  ArrowDown,
  RotateCcw,
} from 'lucide-react';

interface Version {
  id: string;
  version: string;
  date: string;
  changes: string[];
  status: 'released' | 'testing' | 'draft' | 'deprecated';
  createdAt: string;
}

const defaultVersions: Version[] = [
  {
    id: '1',
    version: 'v2.1.0',
    date: '2025-03-15',
    changes: [
      '新增评审流程库功能',
      '优化AI评分准确度',
      '修复已知bug',
    ],
    status: 'released',
    createdAt: '2025-03-15',
  },
  {
    id: '2',
    version: 'v2.0.0',
    date: '2025-02-20',
    changes: [
      '全新UI设计',
      '支持多模型切换',
      '新增案例中心',
      '性能优化提升50%',
    ],
    status: 'released',
    createdAt: '2025-02-20',
  },
  {
    id: '3',
    version: 'v1.5.0',
    date: '2025-01-10',
    changes: [
      '新增智能推荐功能',
      '支持导出评审报告',
      '用户权限管理优化',
    ],
    status: 'released',
    createdAt: '2025-01-10',
  },
  {
    id: '4',
    version: 'v2.2.0-beta',
    date: '2025-04-01',
    changes: [
      '新增批量评审功能',
      '集成更多AI模型',
      '报表功能升级',
    ],
    status: 'testing',
    createdAt: '2025-03-20',
  },
  {
    id: '5',
    version: 'v2.3.0',
    date: '待定',
    changes: [
      '企业SSO集成',
      'API开放平台',
      '移动端适配',
    ],
    status: 'draft',
    createdAt: '2025-03-25',
  },
];

const STATUS_MAP = {
  released: { label: '已发布', color: 'text-[#10b981]', bg: 'bg-[#10b981]/10' },
  testing: { label: '测试中', color: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/10' },
  draft: { label: '规划中', color: 'text-[#6b7280]', bg: 'bg-[#6b7280]/10' },
  deprecated: { label: '已废弃', color: 'text-[#ef4444]', bg: 'bg-[#ef4444]/10' },
};

export default function ConfigVersionsPage() {
  const [versions, setVersions] = useState<Version[]>(defaultVersions);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formVersion, setFormVersion] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formChanges, setFormChanges] = useState<string[]>(['']);
  const [formStatus, setFormStatus] = useState<'released' | 'testing' | 'draft' | 'deprecated'>('draft');

  const openCreateModal = () => {
    setEditingId(null);
    setFormVersion('');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormChanges(['']);
    setFormStatus('draft');
    setShowModal(true);
  };

  const openEditModal = (v: Version) => {
    setEditingId(v.id);
    setFormVersion(v.version);
    setFormDate(v.date);
    setFormChanges([...v.changes]);
    setFormStatus(v.status);
    setShowModal(true);
  };

  const addChange = () => {
    setFormChanges([...formChanges, '']);
  };

  const updateChange = (index: number, value: string) => {
    const updated = [...formChanges];
    updated[index] = value;
    setFormChanges(updated);
  };

  const removeChange = (index: number) => {
    setFormChanges(formChanges.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!formVersion.trim()) return;
    const filteredChanges = formChanges.filter(c => c.trim());
    const now = new Date().toISOString().slice(0, 10);
    if (editingId) {
      setVersions(versions.map(v =>
        v.id === editingId
          ? { ...v, version: formVersion, date: formDate || now, changes: filteredChanges, status: formStatus }
          : v
      ));
    } else {
      setVersions([
        {
          id: Date.now().toString(),
          version: formVersion,
          date: formDate || now,
          changes: filteredChanges,
          status: formStatus,
          createdAt: now,
        },
        ...versions,
      ]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此版本？')) {
      setVersions(versions.filter(v => v.id !== id));
    }
  };

  const moveVersion = (id: string, direction: 'up' | 'down') => {
    const idx = versions.findIndex(v => v.id === id);
    if (idx === -1) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= versions.length) return;
    const updated = [...versions];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    setVersions(updated);
  };

  return (
    <div className="flex h-screen bg-[#0A0A12]">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-8 h-16 border-b border-[#2e2e42] flex-shrink-0">
          <div className="flex items-center gap-3">
            <History className="h-6 w-6 text-[#a78bfa]" />
            <div>
              <h1 className="text-xl font-bold text-white">版本管理</h1>
              <p className="text-xs text-[#6b7280]">管理产品版本发布记录和更新计划</p>
            </div>
          </div>
          <button className="btn-primary" onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-1" />
            新建版本
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scrollbar">
          <div className="max-w-4xl mx-auto">
            {versions.length === 0 ? (
              <div className="glass-card flex flex-col items-center justify-center py-20">
                <History className="h-12 w-12 text-[#6b7280] mb-4" />
                <p className="text-[#6b7280]">暂无版本记录</p>
                <button className="btn-primary mt-4" onClick={openCreateModal}>
                  <Plus className="h-4 w-4 mr-1" />
                  创建第一个版本
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-8 top-0 bottom-0 w-px bg-[#2e2e42]" />
                <div className="space-y-6">
                  {versions.map((v, idx) => {
                    const st = STATUS_MAP[v.status];
                    return (
                      <div key={v.id} className="relative flex items-start gap-6">
                        <div className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          v.status === 'released' ? 'bg-[#10b981]/10 border border-[#10b981]/30' :
                          v.status === 'testing' ? 'bg-[#f59e0b]/10 border border-[#f59e0b]/30' :
                          v.status === 'draft' ? 'bg-[#7c3aed]/10 border border-[#7c3aed]/30' :
                          'bg-[#ef4444]/10 border border-[#ef4444]/30'
                        }`}>
                          <Tag className={`w-6 h-6 ${
                            v.status === 'released' ? 'text-[#10b981]' :
                            v.status === 'testing' ? 'text-[#f59e0b]' :
                            v.status === 'draft' ? 'text-[#a78bfa]' :
                            'text-[#ef4444]'
                          }`} />
                        </div>
                        <div className="glass-card p-5 flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold text-white text-lg">{v.version}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>
                                {st.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => moveVersion(v.id, 'up')}
                                disabled={idx === 0}
                                className="p-1.5 rounded-lg hover:bg-[#1e1e2e] transition-colors disabled:opacity-30"
                                title="上移"
                              >
                                <ArrowUp className="w-3.5 h-3.5 text-[#6b7280]" />
                              </button>
                              <button
                                onClick={() => moveVersion(v.id, 'down')}
                                disabled={idx === versions.length - 1}
                                className="p-1.5 rounded-lg hover:bg-[#1e1e2e] transition-colors disabled:opacity-30"
                                title="下移"
                              >
                                <ArrowDown className="w-3.5 h-3.5 text-[#6b7280]" />
                              </button>
                              <button
                                onClick={() => openEditModal(v)}
                                className="p-1.5 rounded-lg hover:bg-[#1e1e2e] transition-colors"
                                title="编辑"
                              >
                                <Pencil className="w-3.5 h-3.5 text-[#6b7280] hover:text-[#a78bfa]" />
                              </button>
                              <button
                                onClick={() => handleDelete(v.id)}
                                className="p-1.5 rounded-lg hover:bg-[#1e1e2e] transition-colors"
                                title="删除"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-[#6b7280] hover:text-[#ef4444]" />
                              </button>
                            </div>
                          </div>
                          <div className="text-xs text-[#6b7280] mb-3">发布日期: {v.date}</div>
                          <ul className="space-y-1.5">
                            {v.changes.map((change, ci) => (
                              <li key={ci} className="flex items-start gap-2 text-sm text-[#9ca3af]">
                                <span className="text-[#10b981] mt-1">•</span>
                                {change}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                {editingId ? '编辑版本' : '新建版本'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[#6b7280] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">版本号</label>
                <input
                  type="text"
                  value={formVersion}
                  onChange={(e) => setFormVersion(e.target.value)}
                  className="input-field"
                  placeholder="如 v2.1.0"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">发布日期</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#9ca3af] mb-1.5">状态</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as typeof formStatus)}
                    className="input-field"
                  >
                    <option value="draft">规划中</option>
                    <option value="testing">测试中</option>
                    <option value="released">已发布</option>
                    <option value="deprecated">已废弃</option>
                  </select>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[#9ca3af]">更新内容</label>
                  <button onClick={addChange} className="text-xs text-[#a78bfa] hover:text-[#c4b5fd]">
                    + 添加条目
                  </button>
                </div>
                <div className="space-y-2">
                  {formChanges.map((change, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[#4b5563] text-xs">•</span>
                      <input
                        type="text"
                        value={change}
                        onChange={(e) => updateChange(idx, e.target.value)}
                        className="input-field flex-1"
                        placeholder="输入更新内容"
                      />
                      <button
                        onClick={() => removeChange(idx)}
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
              <button className="btn-primary" onClick={handleSave} disabled={!formVersion.trim()}>
                <CheckCircle className="h-4 w-4 mr-1" />
                {editingId ? '保存修改' : '创建版本'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
