'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, CheckCircle, Upload, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PlanInfo {
  name: string;
  displayName: string;
  price: number;
  period: string;
  description: string;
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan') || 'pro';

  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    payerName: '',
    transactionId: '',
    screenshot: '',
    note: '',
  });

  // 收款信息 - 请替换为你自己的
  const paymentInfo = {
    wechat: '你的微信号',
    alipay: '你的支付宝账号',
    bankCard: '你的银行卡号',
    bankName: '开户银行',
    holderName: '你的姓名',
  };

  useEffect(() => {
    // 获取定价方案
    fetch('/api/pricing')
      .then(res => res.json())
      .then(data => {
        const plans = data.plans || [];
        const found = plans.find((p: PlanInfo) => p.name === planId);
        if (found) setPlan(found);
      })
      .catch(console.error);
  }, [planId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/payment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          ...formData,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
      } else {
        alert(data.error || '提交失败');
      }
    } catch (error) {
      alert('网络错误');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-600">支付凭证已提交</CardTitle>
            <CardDescription>
              我们将在1-2个工作日内审核<br />
              审核通过后会自动激活您的会员
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                <strong>订单信息：</strong><br />
                方案：{plan?.displayName}<br />
                金额：¥{plan?.price}<br />
                付款人：{formData.payerName}<br />
                交易号：{formData.transactionId || '无'}
              </AlertDescription>
            </Alert>

            <div className="text-center text-sm text-gray-500">
              <p>请保留好转账记录，审核不通过可重新提交</p>
            </div>

            <div className="flex gap-2">
              <Link href="/pricing" className="flex-1">
                <Button variant="outline" className="w-full">
                  返回定价页
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button className="w-full">
                  返回首页
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <Link href="/pricing" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" />
        返回定价页
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>扫码支付</CardTitle>
          <CardDescription>
            购买 {plan?.displayName || planId} - ¥{plan?.price || '...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 收款码展示 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 微信收款码 */}
            <div className="border rounded-lg p-4 text-center">
              <div className="w-32 h-32 bg-gray-100 mx-auto mb-2 flex items-center justify-center">
                {/* 替换为你的微信收款码图片 */}
                <div className="text-gray-400 text-sm">
                  <Upload className="w-8 h-8 mx-auto mb-1" />
                  微信收款码
                </div>
              </div>
              <p className="text-sm font-medium">微信支付</p>
              <p className="text-xs text-gray-500">扫码向我付款</p>
            </div>

            {/* 支付宝收款码 */}
            <div className="border rounded-lg p-4 text-center">
              <div className="w-32 h-32 bg-gray-100 mx-auto mb-2 flex items-center justify-center">
                {/* 替换为你的支付宝收款码图片 */}
                <div className="text-gray-400 text-sm">
                  <Upload className="w-8 h-8 mx-auto mb-1" />
                  支付宝收款码
                </div>
              </div>
              <p className="text-sm font-medium">支付宝</p>
              <p className="text-xs text-gray-500">扫码向我付款</p>
            </div>
          </div>

          {/* 手动转账信息 */}
          <div className="border rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium mb-2">或手动转账：</p>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">微信/支付宝：</span>
              <div className="flex items-center">
                <code className="bg-gray-100 px-2 py-1 rounded mr-2">{paymentInfo.alipay}</code>
                <button
                  onClick={() => copyToClipboard(paymentInfo.alipay)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">银行卡：</span>
              <code className="bg-gray-100 px-2 py-1 rounded">{paymentInfo.bankCard}</code>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">开户行：</span>
              <span>{paymentInfo.bankName}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">户名：</span>
              <span>{paymentInfo.holderName}</span>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              <strong>转账金额：¥{plan?.price}</strong><br />
              转账时请备注：<code className="bg-gray-100 px-1 rounded">投标AI</code>
            </AlertDescription>
          </Alert>

          {/* 支付凭证表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="payerName">付款人姓名 *</Label>
              <Input
                id="payerName"
                value={formData.payerName}
                onChange={e => setFormData(prev => ({ ...prev, payerName: e.target.value }))}
                placeholder="请输入转账时使用的姓名"
                required
              />
            </div>

            <div>
              <Label htmlFor="transactionId">交易单号（选填）</Label>
              <Input
                id="transactionId"
                value={formData.transactionId}
                onChange={e => setFormData(prev => ({ ...prev, transactionId: e.target.value }))}
                placeholder="支付宝/微信交易号，方便核对"
              />
            </div>

            <div>
              <Label htmlFor="screenshot">付款截图链接（选填）</Label>
              <Input
                id="screenshot"
                value={formData.screenshot}
                onChange={e => setFormData(prev => ({ ...prev, screenshot: e.target.value }))}
                placeholder="可上传到图床后粘贴链接"
              />
            </div>

            <div>
              <Label htmlFor="note">备注（选填）</Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={e => setFormData(prev => ({ ...prev, note: e.target.value }))}
                placeholder="其他需要说明的信息"
                rows={2}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '提交中...' : '提交支付凭证'}
            </Button>
          </form>

          <p className="text-xs text-gray-500 text-center">
            提交后管理员将在1-2个工作日内审核<br />
            审核通过后会员权限将自动激活
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">加载中...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
