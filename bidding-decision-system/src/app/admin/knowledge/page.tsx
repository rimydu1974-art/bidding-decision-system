'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw,
  Search,
  Trash2,
  Eye,
  Database,
  FileText,
  Tag,
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
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

interface CategoryStat {
  name: string;
  count: number;
}

interface SourceStat {
  name: string;
  count: number;
}

export default function KnowledgeAdminPage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [sources, setSources] = useState<SourceStat[]>([]);
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (searchTerm) params.set('search', searchTerm);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);

      const res = await fetch(`/api/admin/knowledge?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setTotal(data.total);
        setCategories(data.categories);
        setSources(data.sources);
      }
    } catch (error) {
      console.error('Failed to fetch knowledge items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, categoryFilter, sourceFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此知识条目吗？')) return;
    try {
      const res = await fetch(`/api/admin/knowledge?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchItems();
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const getSourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      chinabidding_import: 'bg-blue-100 text-blue-700',
      manual: 'bg-gray-100 text-gray-700',
      upload: 'bg-green-100 text-green-700',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[source] || 'bg-gray-100 text-gray-700'}`}>
        {source === 'chinabidding_import' ? '元博网导入' : source}
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      办公用品: 'bg-purple-100 text-purple-700',
      三维模型: 'bg-indigo-100 text-indigo-700',
      医疗耗材: 'bg-red-100 text-red-700',
      教育培训: 'bg-yellow-100 text-yellow-700',
      环保监测: 'bg-green-100 text-green-700',
      物业服务: 'bg-blue-100 text-blue-700',
      养老服务: 'bg-pink-100 text-pink-700',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[category] || 'bg-gray-100 text-gray-700'}`}>
        {category}
      </span>
    );
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">知识库管理</h1>
          <p className="text-gray-500">管理所有用户的知识库条目（共 {total.toLocaleString()} 条）</p>
        </div>
        <Button variant="outline" onClick={fetchItems} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">总条目数</p>
                <p className="text-2xl font-bold">{total.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Tag className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">分类数</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">来源数</p>
                <p className="text-2xl font-bold">{sources.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索标题或内容..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">所有分类</option>
            {categories.map(cat => (
              <option key={cat.name} value={cat.name}>{cat.name} ({cat.count})</option>
            ))}
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">所有来源</option>
            {sources.map(src => (
              <option key={src.name} value={src.name}>{src.name} ({src.count})</option>
            ))}
          </select>
          <Button onClick={handleSearch}>搜索</Button>
        </div>
      </div>

      {/* 知识条目列表 */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              加载中...
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              暂无知识条目
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">{item.title}</span>
                      {getCategoryBadge(item.category)}
                      {getSourceBadge(item.source)}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {item.content.substring(0, 200)}...
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>用户: {item.user.email}</span>
                      <span>使用次数: {item.usageCount}</span>
                      <span>更新时间: {new Date(item.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedItem(item)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">
            共 {total.toLocaleString()} 条，第 {page}/{totalPages} 页
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              下一页
            </Button>
          </div>
        </div>
      )}

      {/* 详情弹窗 */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{selectedItem.title}</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedItem(null)}>
                ×
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">分类</p>
                <p>{getCategoryBadge(selectedItem.category)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">内容</p>
                <p className="text-sm whitespace-pre-wrap">{selectedItem.content}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">标签</p>
                <p className="text-sm">{selectedItem.tags}</p>
              </div>
              <div className="flex gap-4 text-xs text-gray-400">
                <span>用户: {selectedItem.user.email}</span>
                <span>来源: {selectedItem.source}</span>
                <span>使用次数: {selectedItem.usageCount}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
