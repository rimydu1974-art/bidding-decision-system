'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, Copy } from 'lucide-react';
import Link from 'next/link';

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan') || 'single';
  const projectId = searchParams.get('projectId');
  const returnUrl = searchParams.get('returnUrl') || '/';

  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);

  useEffect(() => {
    fetch('/api/pricing')
      .then((res) => res.json())
      .then((data) => {
        const found = (data.plans || []).find((p: any) => p.name === planId);
        if (found) setPlan(found);
      })
      .catch(console.error);
  }, [planId]);

  const handleSimulatePayment = async () => {
    setLoading(true);
    try {
      if (projectId) {
        await fetch('/api/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, planId: 'single', amount: 19 }),
        });
      }
      router.push(`/payment/success?projectId=${projectId || ''}&returnUrl=${encodeURIComponent(returnUrl)}&plan=${planId}`);
    } catch (err) {
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen flex bg-[#0A0A12]">
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-[900px]">
          {/* Back */}
          <div className="mb-6">
            <Link href={projectId ? `/project/${projectId}` : '/pricing'} className="text-sm text-[#6b7280] hover:text-white transition-all flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              返回
            </Link>
          </div>

          {/* Two-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Order Info */}
            <div className="glass-card p-7">
              <h2 className="text-lg font-bold text-white mb-4">订单信息</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">套餐名称</span>
                  <span className="text-[#e2e8f0] font-medium">{plan?.displayName || planId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">价格</span>
                  <span className="text-[#a78bfa] font-bold text-lg">¥{plan?.price || '...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b7280]">有效期</span>
                  <span className="text-[#e2e8f0]">购买后7天内有效</span>
                </div>
                <div className="border-t border-[#2e2e42] pt-3 mt-3">
                  <span className="text-[#6b7280] text-xs">权益说明</span>
                  <p className="text-[#9ca3af] text-xs mt-1">{plan?.description || '-'}</p>
                </div>
              </div>
              <div className="mt-4 text-center text-xs text-[#6b7280]">
                <span className="cursor-pointer hover:text-[#a78bfa] underline">上传付款凭证 (对公转账专用)</span>
              </div>
            </div>

            {/* Right: Payment Method + QR */}
            <div className="glass-card p-7 flex flex-col items-center">
              {/* Payment method toggle */}
              <div className="flex mb-6 bg-[#0f0f1a] rounded-xl p-1 w-full">
                <button
                  onClick={() => setPaymentMethod('wechat')}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    paymentMethod === 'wechat' ? 'bg-[#1e1e2e] text-white' : 'text-[#6b7280]'
                  }`}
                >
                  微信支付
                </button>
                <button
                  onClick={() => setPaymentMethod('alipay')}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    paymentMethod === 'alipay' ? 'bg-[#1e1e2e] text-white' : 'text-[#6b7280]'
                  }`}
                >
                  支付宝
                </button>
              </div>

              {/* QR Code placeholder */}
              <div className="bg-white rounded-2xl p-4 mb-4" style={{ width: 200, height: 200 }}>
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  {paymentMethod === 'wechat' ? '微信收款码' : '支付宝收款码'}
                </div>
              </div>

              <p className="text-xs text-[#6b7280] mb-4">
                请使用{paymentMethod === 'wechat' ? '微信' : '支付宝'}扫描二维码支付
              </p>

              {/* Simulate payment button */}
              <button
                onClick={handleSimulatePayment}
                disabled={loading}
                className="btn-primary w-full justify-center py-3 text-base disabled:opacity-50"
              >
                {loading ? '处理中...' : '模拟支付成功 →'}
              </button>

              <p className="text-xs text-[#6b7280] mt-3 text-center">
                仅限开发测试使用
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
      <div className="min-h-screen bg-[#0A0A12] flex items-center justify-center">
        <div className="text-[#6b7280] text-sm">加载中...</div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
