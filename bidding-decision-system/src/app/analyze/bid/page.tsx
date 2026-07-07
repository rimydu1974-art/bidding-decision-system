import { Suspense } from 'react';
import BidAnalyzeContent from './client';

export default function BidAnalyzePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A12] flex items-center justify-center">
        <div className="text-[#6b7280] text-sm">加载中...</div>
      </div>
    }>
      <BidAnalyzeContent />
    </Suspense>
  );
}
