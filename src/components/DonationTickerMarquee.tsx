import React, { useEffect, useState } from 'react';
import { Heart, Sparkles, ChevronRight } from 'lucide-react';
import { getDonations, DonationEntry } from '../services/membershipService';

interface DonationTickerMarqueeProps {
  onOpenDonate: () => void;
  className?: string;
}

export const DonationTickerMarquee: React.FC<DonationTickerMarqueeProps> = ({
  onOpenDonate,
  className = '',
}) => {
  const [donations, setDonations] = useState<DonationEntry[]>(() => getDonations());

  useEffect(() => {
    const handleDonationEvent = () => {
      setDonations(getDonations());
    };

    window.addEventListener('kuroshelf_donation_made', handleDonationEvent);
    window.addEventListener('storage', handleDonationEvent);

    return () => {
      window.removeEventListener('kuroshelf_donation_made', handleDonationEvent);
      window.removeEventListener('storage', handleDonationEvent);
    };
  }, []);

  if (!donations || donations.length === 0) {
    return null;
  }

  // Duplicate items to ensure seamless infinite looping track
  const marqueeItems = [...donations, ...donations];

  return (
    <div
      id="donation-notice-board"
      className={`w-full overflow-hidden rounded-xl border border-rose-500/20 bg-gradient-to-r from-rose-950/25 via-slate-900/60 to-rose-950/25 dark:from-rose-950/30 dark:via-[#111422] dark:to-rose-950/30 backdrop-blur-md shadow-xs flex items-center h-9 sm:h-10 text-xs select-none ${className}`}
      role="region"
      aria-label="Community Donations Notice Board"
    >
      {/* Left Notice Board Label */}
      <div className="shrink-0 flex items-center gap-1.5 px-3 py-1 bg-rose-600/15 dark:bg-rose-500/10 border-r border-rose-500/20 text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider text-[10px] sm:text-[11px] z-10">
        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
        <span className="hidden xs:inline">Supporters Wall</span>
        <span className="xs:hidden">Donors</span>
      </div>

      {/* Marquee Scrolling Viewport */}
      <div className="relative flex-1 overflow-hidden h-full flex items-center mask-marquee">
        {/* Subtle fade masks on edges */}
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-slate-900/80 dark:from-[#111422] to-transparent z-1 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-slate-900/80 dark:from-[#111422] to-transparent z-1 pointer-events-none" />

        {/* The Track that moves to the left */}
        <div className="notice-marquee-track items-center gap-6 sm:gap-8 px-4 cursor-pointer" onClick={onOpenDonate}>
          {marqueeItems.map((d, index) => {
            const formattedAmount = d.amount % 1 === 0 ? d.amount : d.amount.toFixed(2);
            return (
              <div
                key={`${d.id}-${index}`}
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

      {/* Right Quick Support Action */}
      <div className="shrink-0 pr-2 pl-1 z-10">
        <button
          type="button"
          onClick={onOpenDonate}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] sm:text-[11px] shadow-xs hover:shadow-rose-600/30 transition-all cursor-pointer whitespace-nowrap"
          title="Donate to support KuroShelf development and servers"
        >
          <span>Support Us</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
