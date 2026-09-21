import React, { useState } from 'react';
import { ExternalLink, ShoppingBag, Sparkles, X } from 'lucide-react';
import { siteConfig } from '../config/site';

interface MangaAdBannerProps {
  variant?: 'banner' | 'card' | 'compact';
  titleContext?: string;
}

export const MangaAdBanner: React.FC<MangaAdBannerProps> = ({
  variant = 'banner',
  titleContext
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const tag = siteConfig.affiliate.amazonTag || 'kuroshelf-20';
  const queryParam = titleContext
    ? encodeURIComponent(`${titleContext} manga box set volume`)
    : encodeURIComponent('best selling manga box sets tankobon');
  const targetUrl = `https://www.amazon.com/s?k=${queryParam}&tag=${tag}`;

  if (variant === 'card') {
    return (
      <div className="relative flex flex-col justify-between rounded-xl overflow-hidden bg-gradient-to-b from-amber-950/40 via-neutral-900 to-neutral-900 border border-amber-500/30 p-4 shadow-sm hover:border-amber-400/50 transition-all duration-150">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold uppercase tracking-wider border border-amber-500/30 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            Sponsored
          </span>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-neutral-500 hover:text-neutral-300 p-0.5"
            title="Dismiss ad"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-1.5 my-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-white line-clamp-2">
            {titleContext
              ? `Amazon Deals: ${titleContext} & Box Sets`
              : 'Official Manga Releases & Collector Box Sets'}
          </h4>
          <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed">
            Get authentic English volumes with Prime 1-day delivery and support mangaka creators.
          </p>
        </div>

        <div className="pt-2 border-t border-neutral-800">
          <a
            href={targetUrl}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-[11px] transition-colors shadow-sm"
          >
            <span>Shop on Amazon</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <p className="text-[9px] text-neutral-500 text-center mt-1">Amazon Affiliate Partner</p>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/30 via-neutral-900 to-amber-950/20 border border-amber-500/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/15 px-1 rounded">
                Ad
              </span>
              <p className="text-xs font-bold text-white truncate">
                {titleContext ? `Buy ${titleContext} on Amazon` : 'Explore Manga Box Sets'}
              </p>
            </div>
            <p className="text-[10px] text-neutral-400 truncate">Official paperback & Kindle editions</p>
          </div>
        </div>

        <a
          href={targetUrl}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="shrink-0 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1 transition-colors"
        >
          <span>Amazon</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  // Full banner
  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-amber-950/50 via-neutral-900 to-neutral-950 border border-amber-500/30 p-4 sm:p-5 shadow-lg">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider border border-amber-500/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Sponsored Partner
          </span>
          <span className="text-[11px] text-neutral-400 hidden sm:inline">
            Official Manga Editions & Box Sets
          </span>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-neutral-500 hover:text-neutral-300 p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          title="Dismiss ad"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm sm:text-base font-bold text-white">
            Support Mangaka & Publishers — Buy Official Releases on Amazon
          </h3>
          <p className="text-xs text-neutral-300 max-w-2xl leading-relaxed">
            Discover discounted manga tankobons, special collector box sets, and digital Kindle editions.
            Every qualifying purchase made through our links directly supports Kuro Shelf and manga publishers.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={targetUrl}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-xs transition-colors shadow-md"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Shop on Amazon</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] text-neutral-500">
        <span>{siteConfig.affiliate.disclosureText}</span>
        <span className="hidden sm:inline font-mono">Tag: {tag}</span>
      </div>
    </div>
  );
};
