import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  Pin,
  Sparkles,
  Calendar,
  Wrench,
  Radio,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Megaphone,
} from 'lucide-react';
import {
  PlatformNotice,
  NoticeCategory,
  getAnnouncements,
  markAnnouncementsAsRead,
} from '../services/announcementsService';
import { AuthUser } from '../types';

interface AnnouncementsModalProps {
  currentUser?: AuthUser | null;
  onClose: () => void;
  selectedNoticeId?: string | null;
}

const CATEGORY_CONFIG: Record<
  NoticeCategory,
  { label: string; color: string; border: string; bg: string; icon: React.FC<{ className?: string }> }
> = {
  announcement: {
    label: 'Official Notice',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    icon: Megaphone,
  },
  update: {
    label: 'Platform Update',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    icon: Sparkles,
  },
  maintenance: {
    label: 'Maintenance',
    color: 'text-rose-400',
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/10',
    icon: Wrench,
  },
  community: {
    label: 'Community News',
    color: 'text-sky-400',
    border: 'border-sky-500/30',
    bg: 'bg-sky-500/10',
    icon: Radio,
  },
  event: {
    label: 'Special Event',
    color: 'text-purple-400',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10',
    icon: Calendar,
  },
};

export const AnnouncementsModal: React.FC<AnnouncementsModalProps> = ({
  onClose,
  selectedNoticeId,
}) => {
  const [notices, setNotices] = useState<PlatformNotice[]>(() => getAnnouncements());
  const [activeCategory, setActiveCategory] = useState<'all' | NoticeCategory>('all');
  const [expandedNoticeId, setExpandedNoticeId] = useState<string | null>(selectedNoticeId || null);

  useEffect(() => {
    markAnnouncementsAsRead();

    const handleUpdate = () => {
      setNotices(getAnnouncements());
    };

    window.addEventListener('kuroshelf_announcements_updated', handleUpdate);
    return () => {
      window.removeEventListener('kuroshelf_announcements_updated', handleUpdate);
    };
  }, []);

  const filteredNotices = notices.filter((n) => {
    if (activeCategory === 'all') return true;
    return n.category === activeCategory;
  });

  return (
    <div
      id="announcements-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl p-5 sm:p-7 space-y-6 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-display text-white flex items-center gap-2">
                <span>Announcements & Notices</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono font-medium">
                  {notices.length}
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Official KuroShelf updates, system notifications, and community news.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none border-b border-neutral-800/80">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeCategory === 'all'
                ? 'bg-white text-neutral-950 shadow-xs'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            All Notices ({notices.length})
          </button>
          {(['announcement', 'update', 'maintenance', 'community'] as NoticeCategory[]).map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            const count = notices.filter((n) => n.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeCategory === cat
                    ? `${cfg.bg} ${cfg.color} ${cfg.border} border shadow-xs`
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <span>{cfg.label}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Notices List */}
        <div className="space-y-3 overflow-y-auto pr-1 flex-1">
          {filteredNotices.length === 0 ? (
            <div className="text-center py-12 text-neutral-400 space-y-2">
              <Bell className="w-8 h-8 mx-auto text-neutral-600" />
              <p className="text-sm font-medium">No notices found in this category.</p>
            </div>
          ) : (
            filteredNotices.map((notice) => {
              const cfg = CATEGORY_CONFIG[notice.category] || CATEGORY_CONFIG.announcement;
              const Icon = cfg.icon;
              const isExpanded = expandedNoticeId === notice.id;
              const dateStr = new Date(notice.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={notice.id}
                  className={`rounded-2xl border transition-all ${
                    notice.isPinned
                      ? 'bg-neutral-950/80 border-amber-500/30'
                      : 'bg-neutral-950/50 border-neutral-800/80 hover:border-neutral-700'
                  }`}
                >
                  <div
                    onClick={() => setExpandedNoticeId(isExpanded ? null : notice.id)}
                    className="p-4 cursor-pointer flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`p-2 rounded-xl shrink-0 ${cfg.bg} ${cfg.color} ${cfg.border} border mt-0.5`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                            {cfg.label}
                          </span>
                          {notice.isPinned && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                              <Pin className="w-3 h-3 fill-amber-400" />
                              Pinned
                            </span>
                          )}
                          <span className="text-[11px] text-neutral-400 font-mono">
                            {dateStr}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white leading-snug">
                          {notice.title}
                        </h3>
                        {notice.summary && !isExpanded && (
                          <p className="text-xs text-neutral-400 mt-1 line-clamp-1">
                            {notice.summary}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-1 rounded-lg text-neutral-400 shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-neutral-800/60 text-xs text-neutral-300 space-y-3 animate-fadeIn">
                      <p className="leading-relaxed whitespace-pre-wrap">
                        {notice.content}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-900">
                        <span>Posted by <strong className="text-neutral-300">{notice.authorName}</strong></span>
                        {notice.externalLink && (
                          <a
                            href={notice.externalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-amber-400 hover:underline"
                          >
                            <span>Learn more</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400 shrink-0">
          <span>KuroShelf Official Notices</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
