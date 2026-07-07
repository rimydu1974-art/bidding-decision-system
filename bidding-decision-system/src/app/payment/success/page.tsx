'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const returnUrl = searchParams.get('returnUrl') || '/';
  const plan = searchParams.get('plan') || 'single';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A12] p-8">
      <div className="glass-card p-12 text-center max-w-md w-full animate-in">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-white mb-2">
          {projectId ? '项目已成功解锁' : '支付成功'}
        </h1>
        <p className="text-[#9ca3af] text-sm mb-8">
          ✅ 您现在可以查看完整的分析数据
        </p>
        <div className="space-y-3">
          <button
            onClick={() => router.push(projectId ? `/project/${projectId}` : returnUrl)}
            className="btn-primary w-full justify-center py-3 text-base"
          >
            🚀 返回项目继续分析
          </button>
          <button
            onClick={() => router.push('/')}
            className="btn-ghost w-full justify-center py-3 text-base"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A12] flex items-center justify-center">
        <div className="text-[#6b7280] text-sm">加载中...</div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
