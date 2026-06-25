'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { ScoreGauge } from '@/components/ui/score-gauge';
import { RiskBadge } from '@/components/ui/risk-badge';
import {
  Plus,
  Search,
  Folder,
  Calendar,
  Clock,
  Trash2,
  Edit,
  X,
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  metadata: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_MAP: Record<string, { label: string; bg: string; txt: string }> = {
  draft:      { label: '草稿', bg: 'bg-[#6b7280]/10', txt: 'text-[#6b7280]' },
  analyzing:  { label: '分析中', bg: 'bg-[#f59e0b]/10', txt: 'text-[#f59e0b]' },
  preparing:  { label: '准备中', bg: 'bg-[#06b6d4]/10', txt: 'text-[#06b6d4]' },
  reviewing:  { label: '审核中', bg: 'bg-[#7c3aed]/10', txt: 'text-[#a78bfa]' },
  submitted:  { label: '已提交', bg: 'bg-[#10b981]/10', txt: 'text-[#10b981]' },
  won:        { label: '已中标', bg: 'bg-[#10b981]/10', txt: 'text-[#10b981]' },
  lost:       { label: '未中标', bg: 'bg-[#ef4444]/10', txt: 'text-[#ef4444]' },
  abandoned:  { label: '已放弃', bg: 'bg-[#6b7280]/10', txt: 'text-[#6b7280]' },
};

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: selectedStatus, search: searchQuery });
      const res = await fetch(`/api/projects?${params}`);
      const data = await res.json();
      if (res.ok) setProjects(data.projects || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, searchQuery]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const handleAdd = async () => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, description: formDescription }),
      });
      if (res.ok) {
        setShowModal(false);
        setFormName('');
        setFormDescription('');
        loadProjects();
      }
    } catch (err) {
      console.error('Failed to add project:', err);
    }
  };

  const handleEdit = async () => {
    if (!editingProject) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingProject.id, name: formName, description: formDescription }),
      });
      if (res.ok) {
        setEditingProject(null);
        setShowModal(false);
        setFormName('');
        setFormDescription('');
        loadProjects();
      }
    } catch (err) {
      console.error('Failed to update project:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个项目吗？')) return;
    try {
      const res = await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
      if (res.ok) loadProjects();
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormName(project.name);
    setFormDescription(project.description || '');
    setShowModal(true);
  };

  const filteredProjects = projects.filter((p) => {
    if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A12]">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">项目中心</h1>
              <p className="text-[#6b7280] text-sm mt-1">管理您的投标项目</p>
            </div>
            <button onClick={() => { setEditingProject(null); setFormName(''); setFormDescription(''); setShowModal(true); }} className="btn-primary">
              <Plus className="w-4 h-4" />
              新建项目
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
              <input
                type="text"
                placeholder="搜索项目名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field w-auto py-2 px-3 text-sm"
            >
              <option value="all">全部状态</option>
              {Object.entries(STATUS_MAP).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>

          {/* Project List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-[#7c3aed]/20 border-t-[#7c3aed] rounded-full mx-auto" />
              <p className="mt-4 text-[#6b7280]">加载中...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Folder className="h-12 w-12 text-[#6b7280] mx-auto mb-3" />
              <p className="text-[#6b7280] mb-4">暂无项目</p>
              <button onClick={() => { setEditingProject(null); setFormName(''); setFormDescription(''); setShowModal(true); }} className="btn-primary">
                <Plus className="w-4 h-4" />
                创建第一个项目
              </button>
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2e2e42] text-left">
                    <th className="py-3 px-4 font-medium text-[#6b7280]">项目名称</th>
                    <th className="py-3 px-4 font-medium text-[#6b7280]">状态</th>
                    <th className="py-3 px-4 font-medium text-[#6b7280]">创建时间</th>
                    <th className="py-3 px-4 font-medium text-[#6b7280]">更新时间</th>
                    <th className="py-3 px-4 font-medium text-[#6b7280] text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => {
                    const status = STATUS_MAP[project.status] || STATUS_MAP.draft;
                    return (
                      <tr
                        key={project.id}
                        className="border-b border-[#2e2e42]/50 hover:bg-[#1e1e2e]/30 cursor-pointer transition-colors"
                        onClick={() => router.push(`/project/${project.id}`)}
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-[#e2e8f0] hover:text-[#a78bfa]">
                            {project.name}
                          </div>
                          {project.description && (
                            <div className="text-xs text-[#6b7280] mt-0.5 truncate max-w-[300px]">
                              {project.description}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.txt}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#9ca3af]">
                          {new Date(project.createdAt).toLocaleDateString('zh-CN')}
                        </td>
                        <td className="py-3 px-4 text-[#9ca3af]">
                          {new Date(project.updatedAt).toLocaleDateString('zh-CN')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => openEditModal(project)} className="p-1.5 rounded-lg hover:bg-[#1e1e2e] text-[#6b7280] hover:text-[#e2e8f0]">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(project.id)} className="p-1.5 rounded-lg hover:bg-[#ef4444]/10 text-[#6b7280] hover:text-[#ef4444]">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="glass-card p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">
                {editingProject ? '编辑项目' : '新建项目'}
              </h2>
              <button onClick={() => { setShowModal(false); setEditingProject(null); }} className="text-[#6b7280] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">项目名称 *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="input-field"
                  placeholder="输入项目名称"
                />
              </div>
              <div>
                <label className="block text-sm text-[#9ca3af] mb-2">项目描述</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="input-field"
                  placeholder="输入项目描述"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setEditingProject(null); }} className="btn-ghost">
                取消
              </button>
              <button onClick={editingProject ? handleEdit : handleAdd} className="btn-primary">
                {editingProject ? '保存' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
