'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Folder,
  Clock,
  Calendar,
  Search,
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

interface StatusStats {
  name: string;
  count: number;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
  analyzing: { label: '分析中', color: 'bg-blue-100 text-blue-800' },
  preparing: { label: '准备中', color: 'bg-yellow-100 text-yellow-800' },
  reviewing: { label: '审核中', color: 'bg-purple-100 text-purple-800' },
  submitted: { label: '已提交', color: 'bg-green-100 text-green-800' },
  won: { label: '已中标', color: 'bg-green-100 text-green-800' },
  lost: { label: '未中标', color: 'bg-red-100 text-red-800' },
  abandoned: { label: '已放弃', color: 'bg-gray-100 text-gray-800' },
};

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [statusStats, setStatusStats] = useState<StatusStats[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // 表单状态
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState('draft');

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: selectedStatus,
        search: searchQuery,
      });

      const response = await fetch(`/api/projects?${params}`);
      const data = await response.json();

      if (response.ok) {
        setProjects(data.projects || []);
        setStatusStats(data.statusStats || []);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, searchQuery]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleAdd = async () => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
        }),
      });

      if (response.ok) {
        setShowAddModal(false);
        resetForm();
        loadProjects();
      }
    } catch (error) {
      console.error('Failed to add project:', error);
    }
  };

  const handleEdit = async () => {
    if (!editingProject) return;

    try {
      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProject.id,
          name: formName,
          description: formDescription,
          status: formStatus,
        }),
      });

      if (response.ok) {
        setEditingProject(null);
        resetForm();
        loadProjects();
      }
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个项目吗？')) return;

    try {
      const response = await fetch(`/api/projects?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadProjects();
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormName(project.name);
    setFormDescription(project.description || '');
    setFormStatus(project.status);
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormStatus('draft');
  };

  const getStatusCount = (status: string) => {
    if (status === 'all') return projects.length;
    return statusStats.find((s) => s.name === status)?.count || 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" onClick={() => router.push('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
              <h1 className="text-xl font-bold text-gray-900">项目管理</h1>
            </div>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              新建项目
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 左侧状态筛选 */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">项目状态</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedStatus('all')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left ${
                      selectedStatus === 'all'
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <span className="flex items-center">
                      <Folder className="h-4 w-4 mr-2" />
                      全部项目
                    </span>
                    <Badge variant="secondary">{getStatusCount('all')}</Badge>
                  </button>
                  {Object.entries(STATUS_MAP).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedStatus(key)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left ${
                        selectedStatus === key
                          ? 'bg-blue-100 text-blue-700'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <span className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${value.color.split(' ')[0]}`}></div>
                        {value.label}
                      </span>
                      <Badge variant="secondary">{getStatusCount(key)}</Badge>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧内容 */}
          <div className="lg:col-span-3">
            {/* 搜索栏 */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索项目名称、客户..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 项目列表 */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">加载中...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <Folder className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">暂无项目</p>
                <Button className="mt-4" onClick={() => setShowAddModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  创建第一个项目
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <Card key={project.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {project.name}
                            </h3>
                            <Badge className={STATUS_MAP[project.status]?.color || 'bg-gray-100 text-gray-800'}>
                              {STATUS_MAP[project.status]?.label || project.status}
                            </Badge>
                          </div>
                          <p className="text-gray-500 text-sm line-clamp-2">
                            {project.description || '暂无描述'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => openEditModal(project)}
                            className="p-2 hover:bg-gray-100 rounded"
                          >
                            <Edit className="h-4 w-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(project.id)}
                            className="p-2 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          创建于: {new Date(project.createdAt).toLocaleDateString('zh-CN')}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          更新于: {new Date(project.updatedAt).toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 添加/编辑模态框 */}
      {(showAddModal || editingProject) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 my-8">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingProject ? '编辑项目' : '新建项目'}
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">项目名称 *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入项目名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">项目描述</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入项目描述"
                />
              </div>

              {editingProject && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">项目状态</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(STATUS_MAP).map(([key, value]) => (
                      <option key={key} value={key}>{value.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProject(null);
                  resetForm();
                }}
              >
                取消
              </Button>
              <Button onClick={editingProject ? handleEdit : handleAdd}>
                {editingProject ? '保存' : '创建'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
