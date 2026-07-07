'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RuleViolation } from '@/lib/rules/types';

interface RiskBannerProps {
  violations: RuleViolation[];
  onConfirm: () => void;
  onDismiss: () => void;
}

export function RiskBanner({ violations, onConfirm, onDismiss }: RiskBannerProps) {
  const [checked, setChecked] = useState(false);

  const handleConfirm = () => {
    if (checked) {
      onConfirm();
    }
  };

  const mediumViolations = violations.filter((v) => v.riskLevel === 'medium');
  const lowViolations = violations.filter((v) => v.riskLevel === 'low');

  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <svg
          className="h-5 w-5 text-yellow-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
        <h3 className="text-sm font-medium text-yellow-800">风险提示</h3>
      </div>

      <div className="mb-3 max-h-40 overflow-y-auto">
        {mediumViolations.map((violation) => (
          <div key={violation.ruleId} className="mb-2 text-sm text-yellow-700">
            <span className="font-medium">{violation.ruleName}:</span> {violation.message}
          </div>
        ))}
        {lowViolations.map((violation) => (
          <div key={violation.ruleId} className="mb-2 text-sm text-gray-600">
            <span className="font-medium">{violation.ruleName}:</span> {violation.message}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <span className="text-sm text-gray-700">已阅读并理解上述风险提示</span>
        </label>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onDismiss}>
            取消
          </Button>
          <Button size="sm" onClick={handleConfirm} disabled={!checked}>
            确认
          </Button>
        </div>
      </div>
    </div>
  );
}
