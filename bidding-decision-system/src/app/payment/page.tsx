'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { PLANS } from '@/lib/pricing';

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan') || 'single';
  const projectId = searchParams.get('projectId');
  const returnUrl = searchParams.get('returnUrl') || '/';
  const plan = PLANS[planId as keyof typeof PLANS] || PLANS.free;

  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [loading, setLoading] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [payerName, setPayerName] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [note, setNote] = useState('');

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('文件大小不能超过10MB');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        alert('请上传 JPG 或 PNG 格式的图片');
        return;
      }
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => setScreenshotPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitPayment = async () => {
    if (!payerName.trim()) {
      alert('请填写付款人姓名');
      return;
    }

    setLoading(true);
    try {
      // Upload screenshot if provided
      let screenshotUrl = '';
      if (screenshot) {
        const formData = new FormData();
        formData.append('file', screenshot);
        formData.append('orderNo', `TEMP${Date.now()}`);
        
        const uploadRes = await fetch('/api/payment/screenshot', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) {
          screenshotUrl = uploadData.url || '';
        }
      }

      // Submit payment
      const res = await fetch('/api/payment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          projectId: projectId || null,
          payerName: payerName.trim(),
          transactionId: transactionId.trim(),
          screenshot: screenshotUrl,
          note: note.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/payment/success?projectId=${projectId || ''}&returnUrl=${encodeURIComponent(returnUrl)}&plan=${planId}`);
      } else {
        alert(data.error || '提交失败，请重试');
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert('支付失败，请重试');
    } finally {
      setLoading(false);
    }
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
                  <span className="text-[#e2e8f0]">资料保存到期截止后30天</span>
                </div>
                <div className="border-t border-[#2e2e42] pt-3 mt-3">
                  <span className="text-[#6b7280] text-xs">权益说明</span>
                  <p className="text-[#9ca3af] text-xs mt-1">{plan?.description || '-'}</p>
                </div>
              </div>
            </div>

            {/* Right: Payment Method + Form */}
            <div className="glass-card p-7">
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

              {/* 收款二维码 */}
              <div className="flex flex-col items-center mb-4">
                {/* 金额醒目提示 */}
                <div className="bg-[#7c3aed]/20 border border-[#7c3aed]/40 rounded-xl px-4 py-2 mb-3 text-center">
                  <p className="text-xs text-[#9ca3af]">请扫码后输入金额</p>
                  <p className="text-2xl font-extrabold text-[#a78bfa]">¥{plan?.price || '...'}</p>
                </div>

                <div className="bg-white rounded-2xl p-3 mx-auto" style={{ width: 220, height: 220 }}>
                  <img
                    src={paymentMethod === 'wechat' ? '/qr-wechat.png' : '/qr-alipay.png'}
                    alt={`${paymentMethod === 'wechat' ? '微信' : '支付宝'}收款码`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      const container = (e.target as HTMLImageElement).parentElement;
                      if (container) {
                        container.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center">收款码图片未放置<br/>请将 qr-${paymentMethod === 'wechat' ? 'wechat' : 'alipay' }.png<br/>放到 public/ 目录</div>`;
                      }
                    }}
                  />
                </div>

                <p className="text-xs text-[#ef4444] mt-3 text-center font-medium">
                  ⚠️ 扫码后请务必输入金额 ¥{plan?.price || '...'}，不要随意填写
                </p>
              </div>

              <div className="mb-4">
                <p className="text-xs text-[#6b7280] text-center">
                  扫码付款后，请填写以下信息并上传支付截图完成确认
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">付款人姓名 *</label>
                  <input
                    type="text"
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="请输入付款人姓名"
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">交易单号（可选）</label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="请输入交易单号"
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">上传支付截图（可选）</label>
                  <div className="border-2 border-dashed border-[#2e2e42] rounded-lg p-3 text-center hover:border-[#7c3aed]/50 transition-colors">
                    {screenshotPreview ? (
                      <div className="relative">
                        <img src={screenshotPreview} alt="支付截图" className="max-h-20 mx-auto rounded" />
                        <button
                          type="button"
                          onClick={() => {
                            setScreenshot(null);
                            setScreenshotPreview(null);
                          }}
                          className="absolute top-0 right-0 bg-red-500/80 text-white rounded-full p-0.5"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <Upload className="w-6 h-6 text-[#6b7280] mx-auto mb-1" />
                        <p className="text-xs text-[#6b7280]">点击上传截图</p>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg"
                          onChange={handleScreenshotChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#6b7280] mb-1 block">备注（可选）</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="请输入备注信息"
                    className="input-field w-full h-16 resize-none"
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmitPayment}
                disabled={loading || !payerName.trim()}
                className="btn-primary w-full justify-center py-3 text-base mt-4 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    提交中...
                  </span>
                ) : (
                  '我已完成支付 →'
                )}
              </button>

              <p className="text-xs text-[#6b7280] mt-3 text-center">
                提交后管理员将在24小时内审核
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
