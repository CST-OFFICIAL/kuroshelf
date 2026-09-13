/**
 * Utility functions for robust Jikan and Anime/Manga image handling.
 * Normalizes protocols, filters out known MyAnimeList placeholder icons,
 * and extracts prioritized lists of valid artwork candidates.
 */

import { JikanImages } from '../types';

/**
 * Checks if a given image URL is a MyAnimeList default/placeholder icon
 * rather than legitimate artwork.
 */
export function isMalPlaceholderUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim().toLowerCase();
  if (!trimmed) return true;

  return (
    trimmed.includes('qm_50') ||
    trimmed.includes('nopic') ||
    trimmed.includes('na_series') ||
    trimmed.includes('apple-touch-icon') ||
    trimmed.includes('images/empty') ||
    trimmed.includes('/missing_') ||
    trimmed.includes('questionmark') ||
    trimmed === 'about:blank'
  );
}

/**
 * Normalizes an image URL:
 * - Enforces HTTPS (preventing browser Mixed Content blocks)
 * - Resolves protocol-relative '//' URLs
 * - Filters out invalid / placeholder URLs
 */
export function normalizeImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  let clean = url.trim();
  if (!clean || isMalPlaceholderUrl(clean)) return null;

  if (clean.startsWith('//')) {
    clean = `https:${clean}`;
  } else if (clean.startsWith('http://')) {
    clean = `https://${clean.slice(7)}`;
  }

  // Must be a valid HTTP(S) URL or root-relative path
  if (!clean.startsWith('https://') && !clean.startsWith('/')) {
    return null;
  }

  return clean;
}

/**
 * Extracts a prioritized, deduplicated list of valid candidate URLs from Jikan image formats.
 * Priority order:
 * 1. WebP Large (modern high-res)
 * 2. JPG Large (reliable high-res fallback)
 * 3. WebP Standard (modern regular)
 * 4. JPG Standard (reliable regular fallback)
 * 5. WebP Small / Thumbnail
 * 6. JPG Small / Thumbnail
 * 7. Optional direct fallback URL
 */
export function getImageCandidates(
  images?: Partial<JikanImages> | null,
  directFallbackUrl?: string | null
): string[] {
  const rawList: (string | null | undefined)[] = [
    images?.webp?.large_image_url,
    images?.jpg?.large_image_url,
    images?.webp?.image_url,
    images?.jpg?.image_url,
    images?.webp?.small_image_url,
    images?.jpg?.small_image_url,
    directFallbackUrl,
  ];

  const seen = new Set<string>();
  const candidates: string[] = [];

  for (const raw of rawList) {
    const normalized = normalizeImageUrl(raw);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      candidates.push(normalized);
    }
  }

  return candidates;
}

/**
 * Convenience helper to get the single best candidate URL immediately.
 */
export function getBestImageUrl(
  images?: Partial<JikanImages> | null,
  directFallbackUrl?: string | null
): string | null {
  const candidates = getImageCandidates(images, directFallbackUrl);
  return candidates.length > 0 ? candidates[0] : null;
}
