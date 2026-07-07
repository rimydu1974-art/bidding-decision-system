'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RuleViolation } from '@/lib/rules/types';

interface RiskPopupProps {
  violations: RuleViolation[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function RiskPopup({ violations, onConfirm, onCancel }: RiskPopupProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (confirmed) {
      onConfirm();
    }
  };

  const criticalViolations = violations.filter((v) => v.riskLevel === 'critical');
  const highViolations = violations.filter((v) => v.riskLevel === 'high');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
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
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">风险确认</h2>
            <p className="text-sm text-gray-500">检测到高风险项，需确认后才能继续</p>
          </div>
        </div>

        <div className="mb-4 max-h-64 overflow-y-auto">
          {criticalViolations.length > 0 && (
            <div className="mb-3">
              <h3 className="mb-2 text-sm font-medium text-red-600">🔴 废标风险（Critical）</h3>
              {criticalViolations.map((violation) => (
                <div
                  key={violation.ruleId}
                  className="mb-2 rounded-md border border-red-200 bg-red-50 p-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-red-800">{violation.ruleName}</span>
                  </div>
                  <p className="mt-1 text-sm text-red-700">{violation.message}</p>
                  {violation.legalBasis && (
                    <p className="mt-1 text-xs text-red-600">法律依据: {violation.legalBasis}</p>
                  )}
                  {violation.suggestion && (
                    <p className="mt-1 text-xs text-red-600">建议: {violation.suggestion}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {highViolations.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-orange-600">🟠 高风险（High）</h3>
              {highViolations.map((violation) => (
                <div
                  key={violation.ruleId}
                  className="mb-2 rounded-md border border-orange-200 bg-orange-50 p-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-medium text-orange-800">{violation.ruleName}</span>
                  </div>
                  <p className="mt-1 text-sm text-orange-700">{violation.message}</p>
                  {violation.legalBasis && (
                    <p className="mt-1 text-xs text-orange-600">法律依据: {violation.legalBasis}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span className="text-sm text-gray-700">
              我已阅读并理解上述风险，确认继续提交投标文件。我了解可能导致废标或其他法律后果。
            </span>
          </label>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">确认原因（可选）</label>
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={2}
            placeholder="请输入确认原因..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!confirmed}>
            确认提交
          </Button>
        </div>
      </div>
    </div>
  );
}
