'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Copy, RefreshCw, ArrowLeft, AlertTriangle } from 'lucide-react';

interface WriteType {
  id: string;
  name: string;
  description: string;
}

interface QuotaInfo {
  quota: {
    used: number;
    limit: number;
    remaining: number;
  };
  user: {
    plan: string;
  };
}

export default function AIWritePage() {
  const router = useRouter();
  const [writeTypes, setWriteTypes] = useState<WriteType[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [tenderSummary, setTenderSummary] = useState('');
  const [projectInfo, setProjectInfo] = useState('');
  const [requirements, setRequirements] = useState('');
  const [companyInfo, setCompanyInfo] = useState('');
  const [companyQual, setCompanyQual] = useState('');
  const [priceInfo, setPriceInfo] = useState('');
  const [qualificationReqs, setQualificationReqs] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);

  useEffect(() => {
    fetch('/api/ai-write')
      .then((res) => res.json())
      .then((data) => setWriteTypes(data.types || []));
    
    fetch('/api/user/quota')
      .then((res) => res.json())
      .then((data) => setQuotaInfo(data));
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
          tenderSummary,
          projectInfo,
          requirements,
          companyInfo,
          companyQual,
          priceInfo,
          qualificationReqs,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedContent(data.content);
        fetch('/api/user/quota')
          .then((res) => res.json())
          .then((data) => setQuotaInfo(data));
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

  const isUnlimited = quotaInfo?.quota.limit === -1;
  const isQuotaExhausted = !isUnlimited && quotaInfo && quotaInfo.quota.remaining <= 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" onClick={() => router.push('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
              <h1 className="text-xl font-bold text-gray-900">AI写标书</h1>
            </div>
            {quotaInfo && (
              <div className="flex items-center space-x-2">
                <Badge variant={isUnlimited ? 'default' : isQuotaExhausted ? 'destructive' : 'secondary'}>
                  {isUnlimited ? '无限额度' : `剩余 ${quotaInfo.quota.remaining} 次`}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isQuotaExhausted && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <div>
                  <p className="font-medium text-yellow-800">本月免费额度已用完</p>
                  <p className="text-sm text-yellow-700">
                    请升级订阅或配置自己的API Key继续使用
                  </p>
                </div>
                <Button size="sm" className="ml-auto" onClick={() => router.push('/pricing')}>
                  升级订阅
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧输入 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>选择文档类型</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
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
                      <div className="flex items-center space-x-3">
                        <FileText className="h-6 w-6 text-blue-600" />
                        <div>
                          <div className="font-medium">{type.name}</div>
                          <div className="text-sm text-gray-500">{type.description}</div>
                        </div>
                      </div>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      招标文件摘要 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={tenderSummary}
                      onChange={(e) => setTenderSummary(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="粘贴招标文件的关键内容摘要..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      项目信息
                    </label>
                    <textarea
                      value={projectInfo}
                      onChange={(e) => setProjectInfo(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="项目名称、规模、背景等..."
                    />
                  </div>

                  {selectedType === '商务技术文件' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">技术要求</label>
                        <textarea
                          value={requirements}
                          onChange={(e) => setRequirements(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="技术规格、功能需求等..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">公司信息</label>
                        <textarea
                          value={companyInfo}
                          onChange={(e) => setCompanyInfo(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="公司名称、规模、优势等..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">公司资质</label>
                        <textarea
                          value={companyQual}
                          onChange={(e) => setCompanyQual(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="ISO认证、资质证书、业绩案例等..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">报价信息</label>
                        <textarea
                          value={priceInfo}
                          onChange={(e) => setPriceInfo(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="报价金额、报价策略等..."
                        />
                      </div>
                    </>
                  )}

                  {selectedType === '资质证明文件' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">资质要求</label>
                        <textarea
                          value={qualificationReqs}
                          onChange={(e) => setQualificationReqs(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="招标文件中的资质要求..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">公司现有资质</label>
                        <textarea
                          value={companyQual}
                          onChange={(e) => setCompanyQual(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="公司已有的资质证书..."
                        />
                      </div>
                    </>
                  )}

                  {selectedType === '报价文件' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">公司信息</label>
                        <textarea
                          value={companyInfo}
                          onChange={(e) => setCompanyInfo(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="公司名称、规模、优势等..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">报价信息</label>
                        <textarea
                          value={priceInfo}
                          onChange={(e) => setPriceInfo(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="报价金额、报价策略等..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">价格分计算方式</label>
                        <textarea
                          value={requirements}
                          onChange={(e) => setRequirements(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="评分规则中的价格分计算方式..."
                        />
                      </div>
                    </>
                  )}

                  <Button
                    onClick={handleGenerate}
                    disabled={loading || isQuotaExhausted === true}
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
