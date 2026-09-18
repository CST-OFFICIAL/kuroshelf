import { supabase, isSupabaseConfigured } from './supabase';
import { serverGetAnimeDetails } from './jikanService';
import { updateAnimeSynopsis } from './catalogService';

/**
 * Sanitizes and cleans official text by:
 * - Stripping HTML formatting tags
 * - Unescaping standard HTML entities
 * - Removing automated metadata credit tags
 */
export function cleanOfficialText(text: string | null | undefined): string | null {
  if (!text || typeof text !== 'string') return null;

  let cleaned = text
    // Normalize newlines from <br> tags
    .replace(/<br\s*\/?>/gi, '\n')
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Unescape common HTML entities
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    // Remove automated source or rewrite tags
    .replace(/\s*\[Written by MAL Rewrite\]\s*/gi, '')
    .replace(/\s*\(Source:.*?\)\s*/gi, '')
    .trim();

  // Normalize excessive newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Fetches the official synopsis from AniList GraphQL.
 * AniList stores clean, publisher-authorized plot overviews.
 */
export async function fetchFromAniList(
  malId?: number | null,
  title?: string | null
): Promise<{ synopsis: string; source: 'anilist' } | null> {
  const anilistEndpoint = 'https://graphql.anilist.co';

  // Strategy A: Try by MyAnimeList ID first (most accurate)
  if (malId && malId > 0) {
    try {
      const queryById = `
        query ($idMal: Int) {
          Media(idMal: $idMal, type: ANIME) {
            idMal
            description(asHtml: false)
          }
        }
      `;

      const res = await fetch(anilistEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'KuroShelf/1.0',
        },
        body: JSON.stringify({
          query: queryById,
          variables: { idMal: malId },
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const rawDesc = json?.data?.Media?.description;
        const cleaned = cleanOfficialText(rawDesc);
        if (cleaned && cleaned.length >= 30) {
          return { synopsis: cleaned, source: 'anilist' };
        }
      }
    } catch (err) {
      // Continue to title search fallback
    }
  }

  // Strategy B: Try searching by Title
  if (title && title.trim().length > 0) {
    try {
      const queryByTitle = `
        query ($search: String) {
          Media(search: $search, type: ANIME) {
            idMal
            title {
              romaji
              english
            }
            description(asHtml: false)
          }
        }
      `;

      const res = await fetch(anilistEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'KuroShelf/1.0',
        },
        body: JSON.stringify({
          query: queryByTitle,
          variables: { search: title.trim() },
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const rawDesc = json?.data?.Media?.description;
        const cleaned = cleanOfficialText(rawDesc);
        if (cleaned && cleaned.length >= 30) {
          return { synopsis: cleaned, source: 'anilist' };
        }
      }
    } catch (err) {
      // Failed to reach AniList
    }
  }

  return null;
}

/**
 * Fetches the official synopsis from Jikan (MyAnimeList).
 */
export async function fetchFromJikan(
  malId: number
): Promise<{ synopsis: string; source: 'jikan' } | null> {
  try {
    const details = await serverGetAnimeDetails(malId);
    if (details?.synopsis) {
      const cleaned = cleanOfficialText(details.synopsis);
      // Ensure it's not a tiny stub like "Second season of X"
      if (cleaned && cleaned.length >= 40 && !cleaned.toLowerCase().startsWith('second season of')) {
        return { synopsis: cleaned, source: 'jikan' };
      }
    }
  } catch (err) {
    // Jikan may be rate-limited
  }

  return null;
}

/**
 * Resolves the genuine official publisher/studio synopsis for an anime:
 * 1. Checks AniList (official studio/licensor description)
 * 2. Checks Jikan / MyAnimeList official entry
 * 3. Persists the official synopsis to the catalog database
 */
export async function resolveOfficialSynopsis(
  malId: number,
  title?: string | null
): Promise<{ success: boolean; synopsis?: string; source?: string; error?: string }> {
  if (!malId && !title) {
    return { success: false, error: 'Valid MAL ID or title is required' };
  }

  // 1. Try AniList first (often has high-quality official publisher descriptions without MAL headers)
  const anilistResult = await fetchFromAniList(malId, title);
  if (anilistResult?.synopsis) {
    if (malId > 0) {
      await updateAnimeSynopsis(malId, anilistResult.synopsis);
    }
    return {
      success: true,
      synopsis: anilistResult.synopsis,
      source: anilistResult.source,
    };
  }

  // 2. Fallback to Jikan official entry
  if (malId > 0) {
    const jikanResult = await fetchFromJikan(malId);
    if (jikanResult?.synopsis) {
      await updateAnimeSynopsis(malId, jikanResult.synopsis);
      return {
        success: true,
        synopsis: jikanResult.synopsis,
        source: jikanResult.source,
      };
    }
  }

  return {
    success: false,
    error: 'Official synopsis is not yet available from official licensors or publishers.',
  };
}
