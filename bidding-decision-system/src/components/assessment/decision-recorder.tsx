'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, X } from 'lucide-react';

interface DecisionRecorderProps {
  assessmentId: string;
  projectName: string;
  onDecisionRecorded?: (decision: string) => void;
}

export function DecisionRecorder({ 
  assessmentId, 
  projectName,
  onDecisionRecorded 
}: DecisionRecorderProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [decision, setDecision] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const handleDecision = async (value: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: value }),
      });

      if (res.ok) {
        setRecorded(true);
        setDecision(value);
        onDecisionRecorded?.(value);
      }
    } catch (error) {
      console.error('Failed to record decision:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (dismissed || recorded) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              💭 您最终决定投这个标吗？
            </h4>
            <p className="text-xs text-gray-500 mb-3">
              记录后系统将学习您的决策模式，未来分析更精准
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDecision('bid')}
                disabled={isSubmitting}
                className="flex items-center gap-1"
              >
                <CheckCircle className="h-4 w-4 text-green-500" />
                决定投
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDecision('no-bid')}
                disabled={isSubmitting}
                className="flex items-center gap-1"
              >
                <XCircle className="h-4 w-4 text-red-500" />
                不投了
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDecision('abstain')}
                disabled={isSubmitting}
                className="flex items-center gap-1"
              >
                <Clock className="h-4 w-4 text-yellow-500" />
                暂不确定
              </Button>
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
