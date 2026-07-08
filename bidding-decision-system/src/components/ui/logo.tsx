'use client';

import React from 'react';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export function Logo({ width = 160, height = 44, className }: LogoProps) {
  const id = React.useId();
  const fid = `logo-frame-${id}`;
  const cid = `logo-check-${id}`;
  const wid = `logo-word-${id}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 440 120"
      className={className}
      aria-label="OpenCheck"
    >
      <defs>
        <linearGradient id={fid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id={cid} x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="50%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id={wid} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="100" height="100" rx="26" fill="none" stroke={`url(#${fid})`} strokeWidth="2.5" />
      <rect x="20" y="20" width="80" height="80" rx="19" fill="none" stroke={`url(#${fid})`} strokeWidth="0.6" opacity="0.25" />
      <polyline points="38,62 56,82 84,48" fill="none" stroke={`url(#${cid})`} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="84" cy="48" r="3" fill="#22D3EE" />
      <text x="140" y="68" fontFamily="'Inter','Helvetica Neue','Arial Black','PingFang SC','Microsoft YaHei',sans-serif" fontSize="38" fontWeight="900" letterSpacing="-0.8" fill={`url(#${wid})`}>
        OpenCheck
      </text>
      <text x="142" y="88" fontFamily="'Inter','Helvetica Neue','PingFang SC','Microsoft YaHei',sans-serif" fontSize="11" fontWeight="500" letterSpacing="1.2" fill="#8B9BB4">
        BID DECISION OS
      </text>
    </svg>
  );
}
