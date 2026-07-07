'use client';

import React from 'react';
import { X, Megaphone } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  link?: string;
  linkText?: string;
}

const STORAGE_KEY = 'oc_announcement_last_seen';

/**
 * 管理员可在 SystemSettings 表中配置公告：
 * key: "announcement_active"
 * value: JSON string: { id: "v1.2", title: "新功能上线", content: "...", link: "/pricing", linkText: "查看详情" }
 */
export function AnnouncementDialog({
  open,
  onClose,
  announcement,
}: {
  open: boolean;
  onClose: () => void;
  announcement: Announcement | null;
}) {
  if (!open || !announcement) return null;

  const handleClose = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        id: announcement.id,
        seenAt: new Date().toISOString(),
      }));
    } catch {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-[#0F0F1A] border border-[#2A2A40] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#06b6d4]/15 flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-[#06b6d4]" />
            </div>
            <h3 className="text-lg font-bold text-white">{announcement.title}</h3>
          </div>
          <button onClick={handleClose} className="text-[#6b7280] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-[#9ca3af] mb-4 whitespace-pre-wrap">{announcement.content}</p>

        <div className="flex gap-3">
          {announcement.link && (
            <a
              href={announcement.link}
              onClick={handleClose}
              className="flex-1 btn-primary text-center flex items-center justify-center"
            >
              {announcement.linkText || '查看详情'}
            </a>
          )}
          <button
            onClick={handleClose}
            className="flex-1 bg-[#1e1e2e] hover:bg-[#2e2e42] text-[#9ca3af] hover:text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
}

export function shouldShowAnnouncement(announcementId: string): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return true;
    const data = JSON.parse(stored);
    if (data.id === announcementId) return false;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return new Date(data.seenAt).getTime() < oneDayAgo;
  } catch {
    return true;
  }
}
