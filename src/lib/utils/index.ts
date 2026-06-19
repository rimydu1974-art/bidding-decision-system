import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeDate(date: Date | string | null | undefined): Date {
  if (!date) return new Date();
  if (date instanceof Date) return isNaN(date.getTime()) ? new Date() : date;
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function formatDate(date: Date | string | null | undefined): string {
  const d = safeDate(date);
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  const d = safeDate(date);
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatCurrency(amount: number | null | undefined): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function getDaysRemaining(deadline: Date | string | null | undefined): number {
  const d = safeDate(deadline);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getCountdownDisplay(deadline: Date | string | null | undefined): string {
  const d = safeDate(deadline);
  const now = new Date();
  const diff = d.getTime() - now.getTime();

  if (diff <= 0) {
    return '已截止';
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}天 ${hours}小时`;
  } else if (hours > 0) {
    return `${hours}小时 ${minutes}分钟`;
  } else {
    return `${minutes}分钟`;
  }
}

export function getCountdownColor(deadline: Date | string | null | undefined): 'green' | 'yellow' | 'red' {
  const days = getDaysRemaining(deadline);

  if (days > 3) return 'green';
  if (days > 1) return 'yellow';
  return 'red';
}

export function getRiskLevelColor(level: 'low' | 'medium' | 'high' | 'critical'): string {
  const colors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };
  return colors[level];
}

export function getRecommendationLabel(recommendation: 'bid' | 'caution' | 'no-bid'): string {
  const labels = {
    bid: '建议投',
    caution: '谨慎投',
    'no-bid': '不建议投',
  };
  return labels[recommendation];
}

export function getRecommendationColor(recommendation: 'bid' | 'caution' | 'no-bid'): string {
  const colors = {
    bid: 'bg-green-100 text-green-800 border-green-200',
    caution: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'no-bid': 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[recommendation];
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
