'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';

interface RetrospectiveBannerProps {
  assessmentId: string;
  projectName: string;
}

interface RetrospectiveMatch {
  hasMatch: boolean;
  message?: string;
  previousProject?: string;
  previousDate?: string;
  previousDecision?: string;
  previousRisk?: string;
}

export function RetrospectiveBanner({ 
  assessmentId, 
  projectName 
}: RetrospectiveBannerProps) {
  const [match, setMatch] = useState<RetrospectiveMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 检查是否有历史回溯匹配
    const checkRetrospective = async () => {
      try {
        // 这里可以调用API检查是否有类似的历史项目
        // 暂时使用模拟数据
        setMatch({ hasMatch: false });
      } catch (error) {
        console.error('Failed to check retrospective:', error);
      } finally {
        setLoading(false);
      }
    };

    checkRetrospective();
  }, [assessmentId]);

  if (loading || !match?.hasMatch || dismissed) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                📌 回溯提示
              </h4>
              <p className="text-sm text-gray-600">
                {match.message || `您上次投类似项目（${match.previousDate}）被废标，原因是资质不符合。本次已重点检查 ✅`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
