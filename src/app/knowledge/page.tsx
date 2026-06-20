'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Search,
  Plus,
  Trash2,
  Edit,
  Folder,
  Tag,
  Clock,
  RefreshCw,
  Cloud,
  HardDrive,
  Upload,
} from 'lucide-react';

interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  content: string;
  tags: string;
  fileType: string;
  fileName: string | null;
  source: string;
  sourceId: string | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  name: string;
  count: number;
}

interface Source {
  name: string;
  count: number;
}

const CATEGORIES = [
  '全部',
  '资质证书',
  '业绩案例',
  '技术方案',
  '人员简历',
  '财务材料',
  '投标模板',
  '政策法规',
  '飞书文档',
  '其他',
];

const SOURCES = [
  { id: 'all', name: '全部来源', icon: Folder },
  { id: 'manual', name: '手动创建', icon: HardDrive },
  { id: 'feishu', name: '飞书同步', icon: Cloud },
  { id: 'upload', name: '文件上传', icon: Upload },
];

const SOURCE_LABELS: Record<string, { text: string; color: string }> = {
  manual: { text: '手动创建', color: 'bg-blue-100 text-blue-800' },
  feishu: { text: '飞书同步', color: 'bg-purple-100 text-purple-800' },
  upload: { text: '文件上传', color: 'bg-green-100 text-green-800' },
};

export default function KnowledgePage() {
  const router = useRouter();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedSource, setSelectedSource] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);
  const [syncingFeishu, setSyncingFeishu] = useState(false);
  const [feishuSpaces, setFeishuSpaces] = useState<{ id: string; name: string }[]>([]);
  const [selectedSpace, setSelectedSpace] = useState('');
  const [showFeishuSync, setShowFeishuSync] = useState(false);

  // 表单状态
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('其他');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('');

  const loadKnowledge = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        category: selectedCategory,
        source: selectedSource,
        search: searchQuery,
      });

      const response = await fetch(`/api/knowledge?${params}`);
      const data = await response.json();

      if (response.ok) {
        setItems(data.items || []);
        setCategories(data.categories || []);
        setSources(data.sources || []);
      }
    } catch (error) {
      console.error('Failed to load knowledge:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedSource, searchQuery]);

  useEffect(() => {
    loadKnowledge();
  }, [loadKnowledge]);

  const loadFeishuSpaces = async () => {
    try {
      const response = await fetch('/api/feishu/knowledge?action=list');
      const data = await response.json();
      if (response.ok && data.spaces) {
        setFeishuSpaces(data.spaces);
      }
    } catch (error) {
      console.error('Failed to load Feishu spaces:', error);
    }
  };

  const handleFeishuSync = async () => {
    if (!selectedSpace) {
      alert('请选择飞书知识库');
      return;
    }

    setSyncingFeishu(true);
    try {
      // 获取飞书知识库节点
      const nodesResponse = await fetch(`/api/feishu/knowledge?action=nodes&spaceId=${selectedSpace}`);
      const nodesData = await nodesResponse.json();

      if (!nodesResponse.ok || !nodesData.nodes) {
        throw new Error('获取飞书文档失败');
      }

      // 同步每个文档到本地
      let syncCount = 0;
      for (const node of nodesData.nodes) {
        if (node.obj_type === 'doc' || node.obj_type === 'sheet') {
          // 获取文档内容
          const contentResponse = await fetch(`/api/feishu/knowledge?action=content&documentId=${node.obj_token}`);
          const contentData = await contentResponse.json();

          if (contentResponse.ok && contentData.content) {
            // 同步到本地
            await fetch('/api/feishu/knowledge', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                documentId: node.obj_token,
                title: node.title || '未命名文档',
                content: contentData.content,
                category: '飞书文档',
              }),
            });
            syncCount++;
          }
        }
      }

      alert(`成功同步 ${syncCount} 个文档`);
      setShowFeishuSync(false);
      loadKnowledge();
    } catch (error) {
      console.error('Feishu sync error:', error);
      alert('同步失败，请检查飞书配置');
    } finally {
      setSyncingFeishu(false);
    }
  };

  useEffect(() => {
    if (showFeishuSync) {
      loadFeishuSpaces();
    }
  }, [showFeishuSync]);

  const handleAdd = async () => {
    try {
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          category: formCategory,
          content: formContent,
          tags: formTags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        setShowAddModal(false);
        resetForm();
        loadKnowledge();
      }
    } catch (error) {
      console.error('Failed to add knowledge:', error);
    }
  };

  const handleEdit = async () => {
    if (!editingItem) return;

    try {
      const response = await fetch('/api/knowledge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem.id,
          title: formTitle,
          category: formCategory,
          content: formContent,
          tags: formTags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      });

      if (response.ok) {
        setEditingItem(null);
        resetForm();
        loadKnowledge();
      }
    } catch (error) {
      console.error('Failed to update knowledge:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条知识吗？')) return;

    try {
      const response = await fetch(`/api/knowledge?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadKnowledge();
      }
    } catch (error) {
      console.error('Failed to delete knowledge:', error);
    }
  };

  const openEditModal = (item: KnowledgeItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormContent(item.content);
    setFormTags(parseTags(item.tags).join(', '));
  };

  const resetForm = () => {
    setFormTitle('');
    setFormCategory('其他');
    setFormContent('');
    setFormTags('');
  };

  const parseTags = (tagsStr: string) => {
    try {
      return JSON.parse(tagsStr || '[]');
    } catch {
      return [];
    }
  };

  const getSourceCount = (sourceId: string) => {
    if (sourceId === 'all') return items.length;
    return sources.find((s) => s.name === sourceId)?.count || 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" onClick={() => router.push('/')}>
                ← 返回
              </Button>
              <h1 className="text-xl font-bold text-gray-900">企业知识库</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => setShowFeishuSync(true)}>
                <Cloud className="h-4 w-4 mr-2" />
                飞书同步
              </Button>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                添加知识
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 左侧筛选 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 来源筛选 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">数据来源</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {SOURCES.map((src) => {
                    const Icon = src.icon;
                    const count = getSourceCount(src.id);
                    return (
                      <button
                        key={src.id}
                        onClick={() => setSelectedSource(src.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left ${
                          selectedSource === src.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <span className="flex items-center">
                          <Icon className="h-4 w-4 mr-2" />
                          {src.name}
                        </span>
                        <Badge variant="secondary">{count}</Badge>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 分类筛选 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">知识分类</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {CATEGORIES.map((cat) => {
                    const count = cat === '全部'
                      ? items.length
                      : categories.find((c) => c.name === cat)?.count || 0;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left ${
                          selectedCategory === cat
                            ? 'bg-blue-100 text-blue-700'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <span className="flex items-center">
                          <Folder className="h-4 w-4 mr-2" />
                          {cat}
                        </span>
                        <Badge variant="secondary">{count}</Badge>
                      </button>
                    );
                  })}
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
                  placeholder="搜索知识库..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 知识列表 */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">加载中...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">暂无知识库内容</p>
                <div className="mt-4 space-x-3">
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    添加知识
                  </Button>
                  <Button variant="outline" onClick={() => setShowFeishuSync(true)}>
                    <Cloud className="h-4 w-4 mr-2" />
                    从飞书同步
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">
                          {item.title}
                        </h3>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Edit className="h-4 w-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className="bg-gray-100 text-gray-800">{item.category}</Badge>
                        <Badge className={SOURCE_LABELS[item.source]?.color || 'bg-gray-100 text-gray-800'}>
                          {SOURCE_LABELS[item.source]?.text || item.source}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-500 line-clamp-3 mb-3">
                        {item.content || '暂无内容'}
                      </p>

                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(item.updatedAt).toLocaleDateString('zh-CN')}
                        </div>
                        <div className="flex items-center space-x-2">
                          {parseTags(item.tags).slice(0, 2).map((tag: string, i: number) => (
                            <span key={i} className="flex items-center">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </span>
                          ))}
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
      {(showAddModal || editingItem) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingItem ? '编辑知识' : '添加知识'}
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入知识标题"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.filter((c) => c !== '全部').map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入知识内容..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  标签（用逗号分隔）
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="如：ISO9001, 高新技术, 资质证书"
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingItem(null);
                  resetForm();
                }}
              >
                取消
              </Button>
              <Button onClick={editingItem ? handleEdit : handleAdd}>
                {editingItem ? '保存' : '添加'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 飞书同步模态框 */}
      {showFeishuSync && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">从飞书同步</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  选择飞书知识库
                </label>
                <select
                  value={selectedSpace}
                  onChange={(e) => setSelectedSpace(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择</option>
                  {feishuSpaces.map((space) => (
                    <option key={space.id} value={space.id}>{space.name}</option>
                  ))}
                </select>
              </div>
              <p className="text-sm text-gray-500">
                将同步所选知识库中的所有文档到本地知识库
              </p>
            </div>
            <div className="p-4 border-t flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowFeishuSync(false)}>
                取消
              </Button>
              <Button onClick={handleFeishuSync} disabled={syncingFeishu}>
                {syncingFeishu ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    同步中...
                  </>
                ) : (
                  '开始同步'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
