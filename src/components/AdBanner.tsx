import { memo } from 'react';

interface AdBannerProps {
  slot?: string;
  format?: 'horizontal' | 'card' | 'inline' | 'skyscraper';
  className?: string;
}

export const AdBanner = memo(function AdBanner({
  slot = 'default',
  format = 'horizontal',
  className = '',
}: AdBannerProps) {
  // Can be configured with actual Google AdSense publisher ID when ready
  const isEnabled = true;

  if (!isEnabled) return null;

  if (format === 'skyscraper') {
    return (
      <aside 
        aria-label="Advertisement"
        className={`w-[140px] xl:w-[160px] h-[600px] shrink-0 rounded-2xl bg-slate-50/80 dark:bg-[#10131b] border border-dashed border-slate-200 dark:border-[#242b3d] p-3 flex flex-col items-center justify-between text-center overflow-hidden transition-all shadow-xs ${className}`}
        data-ad-slot={slot}
      >
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Advertisement
        </span>

        <div className="flex-1 flex flex-col items-center justify-center p-2 text-slate-400 dark:text-slate-500 text-xs gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200/50 dark:bg-[#191f2e] flex items-center justify-center text-slate-400">
            <span className="text-lg">📢</span>
          </div>
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-200 text-xs">Partner Spot</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
              160×600 Skyscraper
            </p>
          </div>
          <div className="w-full h-px bg-slate-200 dark:bg-[#202738] my-1" />
          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug">
            Stream official anime & support creators
          </p>
        </div>

        <span className="text-[8px] font-mono text-slate-400/80 dark:text-slate-600">
          Kuro Shelf Ads
        </span>
      </aside>
    );
  }

  if (format === 'card') {
    return (
      <div 
        className={`flex flex-col items-center justify-center rounded-xl p-4 bg-slate-50/60 dark:bg-[#13161f]/60 border border-dashed border-slate-200 dark:border-[#252b3b] text-center min-h-[300px] overflow-hidden ${className}`}
        data-ad-slot={slot}
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          Sponsored
        </span>
        <div className="w-full flex-1 flex flex-col items-center justify-center p-3 text-slate-400 dark:text-slate-500 text-xs">
          <p className="font-semibold text-slate-600 dark:text-slate-300">Partner Spot</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">
            Support Kuro Shelf by visiting our official anime & manga partners.
          </p>
        </div>
      </div>
    );
  }

  if (format === 'inline') {
    return (
      <div 
        className={`w-full py-2 my-4 rounded-xl bg-slate-50/70 dark:bg-[#11141c] border border-dashed border-slate-200 dark:border-[#232838] flex flex-col items-center justify-center text-center ${className}`}
        data-ad-slot={slot}
      >
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Advertisement
        </span>
        <div className="py-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          Official Streaming & Manga Merchandise
        </div>
      </div>
    );
  }

  // Horizontal Leaderboard Banner (e.g. above footer or beneath hero)
  return (
    <div 
      className={`w-full max-w-5xl mx-auto my-6 px-4 ${className}`}
      data-ad-slot={slot}
    >
      <div className="w-full h-16 sm:h-20 rounded-xl bg-slate-50/70 dark:bg-[#10131a] border border-dashed border-slate-200 dark:border-[#222838] flex flex-col items-center justify-center text-center p-2">
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Advertisement
        </span>
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
          Stream legal anime with Crunchyroll & Netflix • Read official manga
        </span>
      </div>
    </div>
  );
});
