import { AnimeItem } from '../types';
import { searchAnime, getAnimeById } from './jikan';

export interface FranchiseSeasonItem {
  mal_id: number;
  title: string;
  title_english?: string;
  images: {
    jpg: {
      image_url: string;
      small_image_url?: string;
      large_image_url?: string;
    };
  };
  type?: string;
  year?: number;
  season?: string;
  score?: number;
  episodes?: number;
  status?: string;
  relationType?: string;
}

/**
 * Strips season, part, arc, movie suffixes to find the root franchise name
 */
export function extractFranchiseRoot(title: string): string {
  if (!title) return '';
  return title
    .replace(/\s*[:\-–]\s*(?:(?:\d+(?:st|nd|rd|th)?\s*Season)|Season\s*\d+|The\s*Final\s*Season|Part\s*\d+|Cour\s*\d+|Arc|The\s*Movie|Movie|OVA|ONA|Special|Kanketsu-hen|Hen|S\d+).*$/i, '')
    .replace(/\s+(?:(?:\d+(?:st|nd|rd|th)?\s*Season)|Season\s*\d+|The\s*Final\s*Season|Part\s*\d+|Cour\s*\d+|Kanketsu-hen).*$/i, '')
    .trim();
}

/**
 * Efficiently discovers all seasons, prequels, sequels, and franchise entries
 * for a given anime using cached franchise search + relations.
 */
export async function getFranchiseSeasons(anime: AnimeItem): Promise<FranchiseSeasonItem[]> {
  if (!anime || !anime.mal_id) return [];

  const seasonsMap = new Map<number, FranchiseSeasonItem>();

  // 1. Add current anime as the baseline
  seasonsMap.set(anime.mal_id, {
    mal_id: anime.mal_id,
    title: anime.title,
    title_english: anime.title_english,
    images: anime.images,
    type: anime.type,
    year: anime.year || (anime.aired?.from ? new Date(anime.aired.from).getFullYear() : undefined),
    season: anime.season,
    score: anime.score,
    episodes: anime.episodes,
    status: anime.status,
    relationType: 'Current Title',
  });

  // 2. Collect any relation entries (Sequel, Prequel, Parent story, Alternative version)
  const pendingRelationIds: { id: number; relationType: string }[] = [];
  if (anime.relations && Array.isArray(anime.relations)) {
    for (const rel of anime.relations) {
      if (['Sequel', 'Prequel', 'Parent story', 'Side story', 'Alternative version', 'Alternative setting', 'Summary', 'Full story'].includes(rel.relation)) {
        for (const entry of rel.entry || []) {
          if (entry.type === 'anime' && entry.mal_id && !seasonsMap.has(entry.mal_id)) {
            pendingRelationIds.push({ id: entry.mal_id, relationType: rel.relation });
          }
        }
      }
    }
  }

  // 3. Search franchise catalog by root title (e.g. "Re:Zero", "Shingeki no Kyojin", "Kimetsu no Yaiba")
  const rootTitle = extractFranchiseRoot(anime.title) || anime.title;
  const rootTokens = rootTitle.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  try {
    const searchRes = await searchAnime(rootTitle, 24);
    if (Array.isArray(searchRes)) {
      for (const item of searchRes) {
        // Ensure it belongs to the same franchise by matching primary token
        const itemTitle = (item.title + ' ' + (item.title_english || '')).toLowerCase();
        const matchesFranchise = rootTokens.some(token => itemTitle.includes(token));
        
        if (matchesFranchise && !seasonsMap.has(item.mal_id)) {
          seasonsMap.set(item.mal_id, {
            mal_id: item.mal_id,
            title: item.title,
            title_english: item.title_english,
            images: item.images,
            type: item.type,
            year: item.year || (item.aired?.from ? new Date(item.aired.from).getFullYear() : undefined),
            season: item.season,
            score: item.score,
            episodes: item.episodes,
            status: item.status,
            relationType: 'Franchise Season',
          });
        }
      }
    }
  } catch (err) {
    console.warn('[Franchise] Search lookup skipped:', err);
  }

  // 4. Backfill any critical direct Prequel/Sequel relations if not already captured
  const toFetch = pendingRelationIds.filter(p => !seasonsMap.has(p.id)).slice(0, 4);
  await Promise.allSettled(
    toFetch.map(async ({ id, relationType }) => {
      try {
        const full = await getAnimeById(id);
        if (full && !seasonsMap.has(full.mal_id)) {
          seasonsMap.set(full.mal_id, {
            mal_id: full.mal_id,
            title: full.title,
            title_english: full.title_english,
            images: full.images,
            type: full.type,
            year: full.year || (full.aired?.from ? new Date(full.aired.from).getFullYear() : undefined),
            season: full.season,
            score: full.score,
            episodes: full.episodes,
            status: full.status,
            relationType,
          });
        }
      } catch (e) {
        // Silent fallback
      }
    })
  );

  // 5. Sort chronologically: release year ascending, then score descending
  return Array.from(seasonsMap.values()).sort((a, b) => {
    const yearA = a.year ?? 9999;
    const yearB = b.year ?? 9999;
    if (yearA !== yearB) return yearA - yearB;
    return (b.score || 0) - (a.score || 0);
  });
}
