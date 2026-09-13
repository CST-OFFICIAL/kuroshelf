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
  const candidatesKey = JSON.stringify(images) + '|' + (src || '');
  
  const [extraCandidates, setExtraCandidates] = useState<string[]>([]);
  const [fetchedPictures, setFetchedPictures] = useState(false);

  const candidates = useMemo(() => {
    return [...getImageCandidates(images, src), ...extraCandidates];
  }, [candidatesKey, extraCandidates]);

  const [currentKey, setCurrentKey] = useState(candidatesKey);
  const [candidateIndex, setCandidateIndex] = useState(0);

  if (candidatesKey !== currentKey) {
    setCurrentKey(candidatesKey);
    setCandidateIndex(0);
    setExtraCandidates([]);
    setFetchedPictures(false);
  }

  const activeUrl = candidates[candidateIndex] || null;
  const isFailed = candidateIndex >= candidates.length || !activeUrl;

  React.useEffect(() => {
    if (isFailed && malId && !fetchedPictures && mediaType === 'anime') {
      setFetchedPictures(true);
      fetch(`/api/anime/${malId}/pictures`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data && json.data.length > 0) {
            const newUrls = json.data
              .map((p: any) => p.jpg?.large_image_url || p.jpg?.image_url || p.webp?.large_image_url || p.webp?.image_url)
              .filter(Boolean);
            if (newUrls.length > 0) {
              setExtraCandidates(newUrls);
            }
          }
        })
        .catch(() => {});
    }
  }, [isFailed, malId, fetchedPictures, mediaType]);

  const handleError = () => {
    // Prevent infinite loops and ensure browser resets error state
    if (candidateIndex >= candidates.length) return;
    setCandidateIndex((prev) => prev + 1);
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
        className={`relative w-full ${aspectRatio} flex flex-col items-center justify-between p-3.5 bg-gradient-to-b from-neutral-900 via-neutral-900/90 to-neutral-950 border border-neutral-800/80 rounded-inherit select-none overflow-hidden ${containerClassName}`}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f43f5e_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

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
          <div className="p-3 rounded-2xl bg-neutral-800/60 border border-neutral-700/50 shadow-inner mb-2">
            <FallbackIcon className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-400" />
          </div>
          <span className="text-[10px] text-neutral-500 font-medium">Cover Unavailable</span>
        </div>

        {showFallbackTitle && displayTitle && (
          <div className="w-full z-10 text-center">
            <p
              className="text-xs font-bold text-neutral-200 line-clamp-2 leading-tight drop-shadow-sm"
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
        key={activeUrl}
        src={activeUrl}
        alt={alt}
        loading={loading}
        referrerPolicy="no-referrer"
        onError={handleError}
        className={`${className} absolute inset-0 object-cover`}
        {...rest}
      />
    </div>
  );
});
