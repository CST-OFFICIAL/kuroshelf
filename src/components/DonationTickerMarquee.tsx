import React, { useEffect, useState } from 'react';
import { Heart, Sparkles, ChevronRight, EyeOff, Eye } from 'lucide-react';
import { getActiveTickerDonations, DonationEntry } from '../services/membershipService';

interface DonationTickerMarqueeProps {
  onOpenDonate: () => void;
  className?: string;
}

const STORAGE_HIDE_KEY = 'kuroshelf_hide_donors_banner';

export const DonationTickerMarquee: React.FC<DonationTickerMarqueeProps> = ({
  onOpenDonate,
  className = '',
}) => {
  // Only active donations within the 1-minute window
  const [donations, setDonations] = useState<DonationEntry[]>(() => getActiveTickerDonations());
  const [isHidden, setIsHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_HIDE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleDonationEvent = () => {
      setDonations(getActiveTickerDonations());
    };

    window.addEventListener('kuroshelf_donation_made', handleDonationEvent);
    window.addEventListener('storage', handleDonationEvent);

    // Check periodically every 2 seconds to gracefully expire items after 1 minute (60s)
    const expiryInterval = setInterval(() => {
      setDonations(getActiveTickerDonations());
    }, 2000);

    return () => {
      window.removeEventListener('kuroshelf_donation_made', handleDonationEvent);
      window.removeEventListener('storage', handleDonationEvent);
      clearInterval(expiryInterval);
    };
  }, []);

  const handleToggleHide = (hidden: boolean) => {
    setIsHidden(hidden);
    try {
      localStorage.setItem(STORAGE_HIDE_KEY, hidden ? 'true' : 'false');
    } catch {}
  };

  // If user minimized/hid the banner, render a small discrete pill to show it again
  if (isHidden) {
    return (
      <div className={`flex items-center justify-end ${className}`}>
        <button
          type="button"
          onClick={() => handleToggleHide(false)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 transition-all cursor-pointer shadow-xs"
          title="Show KuroShelf Supporters Wall Banner"
        >
          <Heart className="w-3 h-3 fill-rose-500" />
          <span>Show Supporters Wall</span>
          <Eye className="w-3 h-3 ml-0.5 opacity-70" />
        </button>
      </div>
    );
  }

  // Marquee items:
  // Strictly 1 time per donation. Never duplicate or repeat the same donor name.
  const marqueeItems = React.useMemo(() => {
    return donations.map((d, i) => ({ ...d, uniqueKey: `${d.id}-${i}` }));
  }, [donations]);

  // Give generous duration so the text moves smoothly and comfortably (not too fast)
  // 35s per donor item or at least 45s so users can comfortably read
  const animationDuration = `${Math.max(45, marqueeItems.length * 30)}s`;

  return (
    <div
      id="donation-notice-board"
      className={`w-full overflow-hidden rounded-xl border border-rose-500/25 bg-rose-500/10 dark:from-rose-950/30 dark:via-[#111422] dark:to-rose-950/30 dark:bg-gradient-to-r backdrop-blur-md shadow-xs flex items-center h-9 sm:h-10 text-xs select-none ${className}`}
      role="region"
      aria-label="Community Donations Notice Board"
    >
      {/* Left Notice Board Label */}
      <div className="shrink-0 flex items-center gap-1.5 px-3 py-1 bg-rose-600/15 dark:bg-rose-500/10 border-r border-rose-500/25 text-rose-700 dark:text-rose-400 font-bold uppercase tracking-wider text-[10px] sm:text-[11px] z-10">
        <Heart className="w-3.5 h-3.5 text-rose-600 dark:text-rose-500 fill-rose-600 dark:fill-rose-500 animate-pulse" />
        <span className="hidden xs:inline">Supporters Wall</span>
        <span className="xs:hidden">Donors</span>
      </div>

      {donations.length === 0 ? (
        <div
          onClick={onOpenDonate}
          className="flex-1 px-4 flex items-center text-slate-500 dark:text-neutral-400 text-[11px] sm:text-xs cursor-pointer hover:text-rose-600 dark:hover:text-rose-400 transition-colors truncate"
        >
          <span>KuroShelf Community Support Fund • Supporting open anime discovery</span>
        </div>
      ) : (
        /* Marquee Scrolling Viewport */
        <div className="relative flex-1 overflow-hidden h-full flex items-center mask-marquee">
          {/* Subtle fade masks on edges */}
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-rose-50/90 dark:from-[#111422] to-transparent z-1 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-rose-50/90 dark:from-[#111422] to-transparent z-1 pointer-events-none" />

          {/* The Track that moves smoothly across the screen */}
          <div
            className="single-pass-marquee-track items-center gap-6 sm:gap-8 px-4 cursor-pointer"
            style={{ animationDuration }}
            onClick={onOpenDonate}
          >
            {marqueeItems.map((d) => {
              const formattedAmount = d.amount % 1 === 0 ? d.amount : d.amount.toFixed(2);
              return (
                <div
                  key={d.uniqueKey}
                  className="inline-flex items-center gap-2 text-slate-700 dark:text-neutral-200 group"
                >
                  <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    {d.supporterName}
                  </span>
                  <span className="text-slate-600 dark:text-neutral-300">
                    donated <strong className="text-emerald-600 dark:text-emerald-400 font-mono">${formattedAmount}</strong> to KuroShelf. Thank you so much for the donation! ❤️
                  </span>
                  {d.message && (
                    <span className="text-[11px] text-slate-500 dark:text-neutral-400 italic max-w-xs truncate hidden md:inline">
                      "{d.message}"
                    </span>
                  )}
                  <span className="text-rose-400/40 text-[10px] ml-1">•</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Right Quick Support Action & Hide Button */}
      <div className="shrink-0 pr-2 pl-1 z-10 flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenDonate}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] sm:text-[11px] shadow-xs hover:shadow-rose-600/30 transition-all cursor-pointer whitespace-nowrap"
          title="Donate to support KuroShelf development and servers"
        >
          <span>Support Us</span>
          <ChevronRight className="w-3 h-3" />
        </button>

        <button
          type="button"
          onClick={() => handleToggleHide(true)}
          className="p-1 rounded-md text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white hover:bg-rose-500/15 transition-colors cursor-pointer"
          title="Hide Supporters Wall banner"
          aria-label="Hide Supporters Wall banner"
        >
          <EyeOff className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
