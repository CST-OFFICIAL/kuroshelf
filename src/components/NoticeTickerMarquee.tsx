import React, { useEffect, useState } from 'react';
import { Megaphone, Bell, ChevronRight, Pin, EyeOff, Eye } from 'lucide-react';
import { getAnnouncements, PlatformNotice } from '../services/announcementsService';

interface NoticeTickerMarqueeProps {
  onOpenAnnouncements: (noticeId?: string) => void;
  className?: string;
}

const STORAGE_HIDE_NOTICES_KEY = 'kuroshelf_hide_notices_banner';

export const NoticeTickerMarquee: React.FC<NoticeTickerMarqueeProps> = ({
  onOpenAnnouncements,
  className = '',
}) => {
  const [notices, setNotices] = useState<PlatformNotice[]>(() => getAnnouncements());
  const [isHidden, setIsHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_HIDE_NOTICES_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleUpdate = (e?: StorageEvent | Event) => {
      // If triggered by a storage event, only respond if the announcements key changed or all keys cleared
      if (e && 'key' in e && e.key && e.key !== 'kuroshelf_announcements') {
        return;
      }
      try {
        setNotices(getAnnouncements());
      } catch (err) {
        console.warn('[NoticeTickerMarquee] Failed to update notices:', err);
      }
    };

    window.addEventListener('kuroshelf_announcements_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('kuroshelf_announcements_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleToggleHide = (hidden: boolean, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsHidden(hidden);
    try {
      localStorage.setItem(STORAGE_HIDE_NOTICES_KEY, hidden ? 'true' : 'false');
    } catch {}
  };

  if (!notices || notices.length === 0) {
    return null;
  }

  // If user minimized/hid the banner, render a small discrete pill to show it again
  if (isHidden) {
    return (
      <div className={`flex items-center justify-end ${className}`}>
        <button
          type="button"
          onClick={(e) => handleToggleHide(false, e)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-all cursor-pointer shadow-xs"
          title="Show KuroShelf Announcements Banner"
        >
          <Megaphone className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          <span>Show Announcements</span>
          <Eye className="w-3 h-3 ml-0.5 opacity-70" />
        </button>
      </div>
    );
  }

  // Create exactly two identical sets of items for a seamless 0% -> -50% infinite continuous loop
  // This guarantees zero gap, no sudden jumps, and no waiting for an empty cycle
  const baseItems = notices;
  const marqueeItems = [...baseItems, ...baseItems];

  // Comfortable reading speed: 18-20 seconds per item across the viewport
  const scrollDuration = `${Math.max(45, baseItems.length * 20)}s`;

  return (
    <div
      id="platform-notice-board"
      className={`w-full overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-gradient-to-r dark:from-amber-950/25 dark:via-neutral-900 dark:to-amber-950/20 backdrop-blur-md shadow-xs flex items-center h-9 sm:h-10 text-xs select-none ${className}`}
      role="region"
      aria-label="KuroShelf Official Announcements and Notices"
    >
      {/* Left Notice Board Label */}
      <button
        type="button"
        onClick={() => onOpenAnnouncements()}
        className="shrink-0 flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 dark:bg-amber-500/15 hover:bg-amber-500/30 dark:hover:bg-amber-500/25 border-r border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider text-[10px] sm:text-[11px] transition-colors cursor-pointer z-10"
        title="View All Official Notices & Announcements"
      >
        <Megaphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="hidden xs:inline">Notices</span>
        <span className="xs:hidden">News</span>
      </button>

      {/* Marquee Scrolling Viewport */}
      <div className="relative flex-1 overflow-hidden h-full flex items-center mask-marquee">
        {/* Edge fade masks */}
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-amber-50/90 dark:from-neutral-900 to-transparent z-1 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-amber-50/90 dark:from-neutral-900 to-transparent z-1 pointer-events-none" />

        {/* The Track moving left smoothly and seamlessly */}
        <div
          className="notice-marquee-track items-center gap-6 sm:gap-8 px-4 cursor-pointer"
          style={{ animationDuration: scrollDuration }}
        >
          {marqueeItems.map((notice, index) => {
            const isUpdate = notice.category === 'update';
            const isMaintenance = notice.category === 'maintenance';
            const isCommunity = notice.category === 'community';

            return (
              <div
                key={`${notice.id}-${index}`}
                onClick={() => onOpenAnnouncements(notice.id)}
                className="inline-flex items-center gap-2 text-slate-700 dark:text-neutral-200 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer group shrink-0"
              >
                {notice.isPinned && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                    <Pin className="w-2.5 h-2.5 fill-amber-500 dark:fill-amber-400" />
                    Pinned
                  </span>
                )}

                {isUpdate ? (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    Update
                  </span>
                ) : isMaintenance ? (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                    Maintenance
                  </span>
                ) : isCommunity ? (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30">
                    Community
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    Notice
                  </span>
                )}

                <span className="font-semibold text-slate-900 dark:text-white group-hover:underline">
                  {notice.title}
                </span>

                {notice.summary && (
                  <span className="text-slate-500 dark:text-neutral-400 text-[11px] hidden sm:inline">
                    — {notice.summary}
                  </span>
                )}

                <span className="text-amber-500/40 text-[10px] ml-1">•</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Quick Action: View All Notices & Hide Button */}
      <div className="shrink-0 pr-2 pl-1 z-10 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onOpenAnnouncements()}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-bold text-[10px] sm:text-[11px] transition-all cursor-pointer whitespace-nowrap"
          title="Open KuroShelf Bulletins & Notices"
        >
          <Bell className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          <span>All Notices</span>
          <ChevronRight className="w-3 h-3 hidden sm:inline" />
        </button>

        <button
          type="button"
          onClick={(e) => handleToggleHide(true, e)}
          className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white hover:bg-amber-500/15 transition-colors cursor-pointer"
          title="Hide Notices banner"
          aria-label="Hide Notices banner"
        >
          <EyeOff className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
