'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { Copy, CheckCircle, CreditCard, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PlanInfo {
  name: string;
  displayName: string;
  price: number;
  period: string;
  description: string;
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan') || 'pro';

  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    payerName: '',
    transactionId: '',
    screenshot: '',
    note: '',
  });

  const paymentInfo = {
    wechat: { name: '杜珊', account: 'D18978181131' },
    alipay: { name: '杜珊', account: '412721359@qq.com' },
    bankCard: '62145603011163273',
    bankName: '广西南宁桃源支行',
    holderName: '杜珊',
  };

  useEffect(() => {
    fetch('/api/pricing')
      .then(res => res.json())
      .then(data => {
        const plans = data.plans || [];
        const found = plans.find((p: PlanInfo) => p.name === planId);
        if (found) setPlan(found);
      })
      .catch(console.error);
  }, [planId]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/payment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, ...formData }),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
      } else {
        alert(data.error || '提交失败');
      }
    } catch {
      alert('网络错误');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">支付凭证已提交</h2>
              <p className="text-sm text-gray-500 mb-6">
                我们将在1-2个工作日内审核<br />
                审核通过后会自动激活您的会员
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-left text-sm mb-6">
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">方案</span>
                  <span className="font-medium">{plan?.displayName}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">金额</span>
                  <span className="font-medium">¥{plan?.price}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">付款人</span>
                  <span className="font-medium">{formData.payerName}</span>
                </div>
                {formData.transactionId && (
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">交易号</span>
                    <span className="font-medium">{formData.transactionId}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Link href="/pricing" className="flex-1">
                  <button className="w-full py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                    返回定价
                  </button>
                </Link>
                <Link href="/" className="flex-1">
                  <button className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                    返回首页
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <Link href="/pricing" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回定价页
          </Link>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 px-6 py-4 text-white">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <h1 className="text-lg font-bold">扫码支付</h1>
              </div>
              <p className="text-blue-100 text-sm mt-1">
                购买 {plan?.displayName || planId} - ¥{plan?.price || '...'}
              </p>
            </div>

            <div className="p-6 space-y-5">
              {/* Payment methods */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-green-200 rounded-xl p-4 text-center bg-green-50">
                  <div className="w-28 h-28 bg-white border-2 border-dashed border-green-300 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <span className="text-green-600 text-xs">微信收款码</span>
                  </div>
                  <p className="text-sm font-bold text-green-700">微信支付</p>
                </div>
                <div className="border-2 border-blue-200 rounded-xl p-4 text-center bg-blue-50">
                  <div className="w-28 h-28 bg-white border-2 border-dashed border-blue-300 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <span className="text-blue-600 text-xs">支付宝收款码</span>
                  </div>
                  <p className="text-sm font-bold text-blue-700">支付宝</p>
                </div>
              </div>

              {/* Transfer info */}
              <div className="border rounded-xl p-4 space-y-3">
                <p className="text-sm font-bold text-gray-900">或手动转账</p>

                {/* WeChat */}
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-xs font-bold text-green-700">微信转账</p>
                    <p className="text-xs text-gray-500">收款人：{paymentInfo.wechat.name}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(paymentInfo.wechat.account, 'wechat')}
                    className="flex items-center space-x-1 px-2 py-1 bg-white border rounded text-xs"
                  >
                    <code>{paymentInfo.wechat.account}</code>
                    {copiedField === 'wechat' ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Alipay */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-xs font-bold text-blue-700">支付宝转账</p>
                    <p className="text-xs text-gray-500">收款人：{paymentInfo.alipay.name}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(paymentInfo.alipay.account, 'alipay')}
                    className="flex items-center space-x-1 px-2 py-1 bg-white border rounded text-xs"
                  >
                    <code>{paymentInfo.alipay.account}</code>
                    {copiedField === 'alipay' ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Bank */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-bold text-gray-700 mb-1">银行卡转账</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><span className="text-gray-500">卡号</span></div>
                    <div className="col-span-2"><code className="bg-white px-1 rounded">{paymentInfo.bankCard}</code></div>
                    <div><span className="text-gray-500">开户行</span></div>
                    <div className="col-span-2">{paymentInfo.bankName}</div>
                    <div><span className="text-gray-500">户名</span></div>
                    <div className="col-span-2">{paymentInfo.holderName}</div>
                  </div>
                </div>
              </div>

              {/* Amount reminder */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                <p className="text-sm font-bold text-yellow-800">
                  转账金额：¥{plan?.price}
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  转账时请备注：<code className="bg-white px-1 rounded font-bold">投标AI</code>
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">付款人姓名 *</label>
                  <input
                    value={formData.payerName}
                    onChange={e => setFormData(prev => ({ ...prev, payerName: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="转账时使用的姓名"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">交易单号（选填）</label>
                  <input
                    value={formData.transactionId}
                    onChange={e => setFormData(prev => ({ ...prev, transactionId: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="支付宝/微信交易号"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">付款截图链接（选填）</label>
                  <input
                    value={formData.screenshot}
                    onChange={e => setFormData(prev => ({ ...prev, screenshot: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="上传到图床后粘贴链接"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">备注（选填）</label>
                  <textarea
                    value={formData.note}
                    onChange={e => setFormData(prev => ({ ...prev, note: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="其他需要说明的信息"
                    rows={2}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                >
                  {loading ? '提交中...' : '提交支付凭证'}
                </button>
              </form>

              <p className="text-xs text-gray-400 text-center">
                提交后管理员将在1-2个工作日内审核，审核通过后会员权限将自动激活
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 text-sm">加载中...</div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
