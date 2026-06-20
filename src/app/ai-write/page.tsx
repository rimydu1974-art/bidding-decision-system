'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Copy, RefreshCw, ArrowLeft } from 'lucide-react';

interface WriteType {
  id: string;
  name: string;
  description: string;
}

export default function AIWritePage() {
  const router = useRouter();
  const [writeTypes, setWriteTypes] = useState<WriteType[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [projectInfo, setProjectInfo] = useState('');
  const [requirements, setRequirements] = useState('');
  const [companyInfo, setCompanyInfo] = useState('');
  const [priceInfo, setPriceInfo] = useState('');
  const [qualificationReqs, setQualificationReqs] = useState('');
  const [risks, setRisks] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/ai-write')
      .then((res) => res.json())
      .then((data) => setWriteTypes(data.types || []));
  }, []);

  const handleGenerate = async () => {
    if (!selectedType) {
      alert('请选择文档类型');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai-write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          projectInfo,
          requirements,
          companyInfo,
          priceInfo,
          qualificationReqs,
          risks,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedContent(data.content);
      } else {
        alert(data.error || '生成失败');
      }
    } catch (error) {
      console.error('Generate error:', error);
      alert('生成失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    alert('已复制到剪贴板');
  };

  const handleDownload = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedType}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getInputFields = () => {
    switch (selectedType) {
      case '技术方案':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">项目信息</label>
              <textarea
                value={projectInfo}
                onChange={(e) => setProjectInfo(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入项目背景、目标、范围等..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">技术要求</label>
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入技术规格、功能需求等..."
              />
            </div>
          </>
        );
      case '商务文件':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">项目信息</label>
              <textarea
                value={projectInfo}
                onChange={(e) => setProjectInfo(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入项目基本信息..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">企业信息</label>
              <textarea
                value={companyInfo}
                onChange={(e) => setCompanyInfo(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入公司名称、资质、优势等..."
              />
            </div>
          </>
        );
      case '投标函':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">项目信息</label>
              <textarea
                value={projectInfo}
                onChange={(e) => setProjectInfo(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入项目名称、招标编号等..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">报价信息</label>
              <textarea
                value={priceInfo}
                onChange={(e) => setPriceInfo(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入报价金额、币种、有效期等..."
              />
            </div>
          </>
        );
      case '资质证明':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">资质要求</label>
            <textarea
              value={qualificationReqs}
              onChange={(e) => setQualificationReqs(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入招标文件中的资质要求..."
            />
          </div>
        );
      case '风险应对':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">已识别风险</label>
            <textarea
              value={risks}
              onChange={(e) => setRisks(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入已识别的风险点..."
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <h1 className="text-xl font-bold text-gray-900">AI标书编写</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧输入 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>选择文档类型</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {writeTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`p-4 rounded-lg border text-left transition-all ${
                        selectedType === type.id
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <FileText className="h-6 w-6 mb-2 text-blue-600" />
                      <div className="font-medium">{type.name}</div>
                      <div className="text-sm text-gray-500">{type.description}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selectedType && (
              <Card>
                <CardHeader>
                  <CardTitle>填写信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {getInputFields()}
                  <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      '生成文档'
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧输出 */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>生成结果</CardTitle>
                  {generatedContent && (
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        <Copy className="h-4 w-4 mr-1" />
                        复制
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-1" />
                        下载
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {generatedContent ? (
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-lg max-h-[600px] overflow-y-auto">
                      {generatedContent}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>选择文档类型并填写信息后，点击"生成文档"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
