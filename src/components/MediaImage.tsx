import React, { useState, useMemo } from 'react';
import { Tv, BookOpen, User, Film, Sparkles } from 'lucide-react';
import { JikanImages } from '../types';
import { getImageCandidates } from '../utils/imageUtils';

export interface MediaImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  images?: Partial<JikanImages> | null;
  src?: string;
  malId?: number;
  alt: string;
  title?: string;
  mediaType?: 'anime' | 'manga' | 'character' | 'default';
  aspectRatio?: string;
  containerClassName?: string;
  showFallbackTitle?: boolean;
}

export const MediaImage = React.memo(function MediaImage({
  images,
  src,
  malId,
  alt,
  title,
  mediaType = 'anime',
  aspectRatio = 'aspect-[3/4]',
  containerClassName = '',
  className = '',
  loading = 'lazy',
  showFallbackTitle = true,
  ...rest
}: MediaImageProps) {
  // Extract candidates synchronously in priority order without expensive loops
  const candidates = useMemo(() => {
    return getImageCandidates(images, src);
  }, [
    images?.webp?.large_image_url,
    images?.jpg?.large_image_url,
    images?.webp?.image_url,
    images?.jpg?.image_url,
    src,
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const activeUrl = candidates[currentIndex] || null;
  const isFailed = !activeUrl || currentIndex >= candidates.length;

  const handleError = () => {
    if (currentIndex < candidates.length) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const FallbackIcon = useMemo(() => {
    switch (mediaType) {
      case 'manga':
        return BookOpen;
      case 'character':
        return User;
      case 'anime':
        return Tv;
      default:
        return Film;
    }
  }, [mediaType]);

  const displayTitle = title || alt;

  if (isFailed) {
    return (
      <div
        className={`relative w-full ${aspectRatio} flex flex-col items-center justify-between p-3.5 bg-neutral-900 border border-neutral-800 rounded-inherit select-none overflow-hidden ${containerClassName}`}
      >
        <div className="w-full flex items-center justify-between z-10">
          <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-rose-500/70" />
            Kuro Shelf
          </span>
          <span className="text-[9px] font-medium uppercase px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700/50">
            {mediaType}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center my-auto z-10 text-neutral-500">
          <div className="p-3 rounded-xl bg-neutral-800 border border-neutral-700/40 mb-2">
            <FallbackIcon className="w-6 h-6 text-neutral-400" />
          </div>
          <span className="text-[10px] text-neutral-400 font-medium">Cover Unavailable</span>
        </div>

        {showFallbackTitle && displayTitle && (
          <div className="w-full z-10 text-center">
            <p
              className="text-xs font-semibold text-neutral-300 line-clamp-2 leading-tight"
              title={displayTitle}
            >
              {displayTitle}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden bg-neutral-950 ${containerClassName}`}>
      <img
        src={activeUrl}
        alt={alt}
        loading={loading}
        decoding="async"
        referrerPolicy="no-referrer"
        onError={handleError}
        className={`${className} absolute inset-0 w-full h-full object-cover`}
        {...rest}
      />
    </div>
  );
});
