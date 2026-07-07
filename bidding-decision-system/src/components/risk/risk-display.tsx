'use client';

import React from 'react';
import { RuleViolation } from '@/lib/rules/types';

interface RiskDisplayProps {
  violations: RuleViolation[];
}

export function RiskDisplay({ violations }: RiskDisplayProps) {
  if (violations.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <svg
          className="h-5 w-5 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
          />
        </svg>
        <h3 className="text-sm font-medium text-gray-700">信息提示</h3>
      </div>

      <div className="space-y-2">
        {violations.map((violation) => (
          <div key={violation.ruleId} className="flex items-start gap-2 text-sm text-gray-600">
            <span className="mt-0.5 text-gray-400">•</span>
            <div>
              <span className="font-medium">{violation.ruleName}:</span> {violation.message}
              {violation.suggestion && (
                <span className="ml-2 text-gray-500">({violation.suggestion})</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
