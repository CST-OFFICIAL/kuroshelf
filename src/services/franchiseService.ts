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
  const lower = title.toLowerCase();

  // Known major franchise root aliases for 100% precision
  if (lower.includes('kimetsu no yaiba') || lower.includes('demon slayer')) return 'Kimetsu no Yaiba';
  if (lower.includes('jujutsu kaisen')) return 'Jujutsu Kaisen';
  if (lower.includes('shingeki no kyojin') || lower.includes('attack on titan')) return 'Shingeki no Kyojin';
  if (lower.includes('boku no hero') || lower.includes('my hero academia')) return 'Boku no Hero Academia';
  if (lower.includes('sword art online')) return 'Sword Art Online';
  if (lower.includes('re:zero') || lower.includes('starting life in another world')) return 'Re:Zero';
  if (lower.includes('mushoku tensei') || lower.includes('jobless reincarnation')) return 'Mushoku Tensei';
  if (lower.includes('bleach')) return 'Bleach';
  if (lower.includes('naruto') || lower.includes('boruto')) return 'Naruto';
  if (lower.includes('chainsaw man')) return 'Chainsaw Man';
  if (lower.includes('haikyuu')) return 'Haikyuu';
  if (lower.includes('vinland saga')) return 'Vinland Saga';
  if (lower.includes('kaguya-sama') || lower.includes('love is war')) return 'Kaguya-sama';
  if (lower.includes('mob psycho')) return 'Mob Psycho 100';
  if (lower.includes('spy x family')) return 'Spy x Family';
  if (lower.includes('fullmetal alchemist')) return 'Fullmetal Alchemist';
  if (lower.includes('hunter x hunter')) return 'Hunter x Hunter';
  if (lower.includes('one punch man')) return 'One Punch Man';
  if (lower.includes('tokyo ghoul')) return 'Tokyo Ghoul';
  if (lower.includes('fate/')) return 'Fate';

  // Generic heuristic stripping
  return title
    .replace(/\s*[:\-–—]\s*(?:(?:\d+(?:st|nd|rd|th)?\s*Season)|Season\s*\d+|The\s*Final\s*Season|Part\s*\d+|Cour\s*\d+|Arc|The\s*Movie|Movie|OVA|ONA|Special|Kanketsu-hen|Hen|S\d+).*$/i, '')
    .replace(/\s+(?:(?:\d+(?:st|nd|rd|th)?\s*Season)|Season\s*\d+|The\s*Final\s*Season|Part\s*\d+|Cour\s*\d+|Kanketsu-hen).*$/i, '')
    .replace(/\s*-\s*[A-Z0-9\s]+-\s*/g, ' ')
    .replace(/[:\-–—]\s*(?:The\s*)?Movie.*$/i, '')
    .replace(/[-–—:_()[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || title;
}

/**
 * Queries AniList GraphQL to discover all connected franchise relations
 * (prequels, sequels, parent story, alternative versions, movies)
 */
async function fetchAniListRelations(malId: number): Promise<FranchiseSeasonItem[]> {
  const query = `
    query ($idMal: Int) {
      Media(idMal: $idMal, type: ANIME) {
        id
        idMal
        relations {
          edges {
            relationType
            node {
              id
              idMal
              title { romaji english native }
              coverImage { large }
              format
              status
              episodes
              seasonYear
              averageScore
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables: { idMal: malId } }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const edges = json.data?.Media?.relations?.edges || [];

    const allowed = ['PREQUEL', 'SEQUEL', 'PARENT', 'SIDE_STORY', 'ALTERNATIVE', 'SPIN_OFF', 'SUMMARY'];
    return edges
      .filter((e: any) => e.node && allowed.includes(e.relationType))
      .map((e: any) => {
        const n = e.node;
        const relMalId = n.idMal || n.id;
        const relTypeMap: Record<string, string> = {
          PREQUEL: 'Prequel',
          SEQUEL: 'Sequel',
          PARENT: 'Parent Story',
          SIDE_STORY: 'Side Story',
          ALTERNATIVE: 'Alternative Version',
          SPIN_OFF: 'Spin-Off',
          SUMMARY: 'Summary',
        };

        return {
          mal_id: relMalId,
          title: n.title?.english || n.title?.romaji || 'Unknown Title',
          title_english: n.title?.english || undefined,
          images: {
            jpg: {
              image_url: n.coverImage?.large || '',
              large_image_url: n.coverImage?.large || '',
            },
          },
          type: n.format === 'MOVIE' ? 'Movie' : n.format === 'OVA' ? 'OVA' : 'TV',
          year: n.seasonYear,
          score: n.averageScore ? Number((n.averageScore / 10).toFixed(2)) : undefined,
          episodes: n.episodes,
          status: n.status === 'RELEASING' ? 'Currently Airing' : n.status === 'FINISHED' ? 'Finished Airing' : 'Not yet aired',
          relationType: relTypeMap[e.relationType] || 'Related Work',
        };
      })
      .filter((item: FranchiseSeasonItem) => item.mal_id && item.images.jpg.image_url);
  } catch (err) {
    console.warn(`[AniList relations] Notice for ${malId}:`, err);
    return [];
  }
}

/**
 * Efficiently discovers all seasons, prequels, sequels, movies, and franchise entries
 * for a given anime using hybrid cached relations + AniList web + franchise catalog search.
 */
export async function getFranchiseSeasons(anime: AnimeItem): Promise<FranchiseSeasonItem[]> {
  if (!anime || !anime.mal_id) return [];

  const seasonsMap = new Map<number, FranchiseSeasonItem>();

  // 1. Add current anime as baseline
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

  // 2. If anime.relations is missing, load full details to ensure we have relations
  let fullRelations = anime.relations;
  if (!fullRelations || !Array.isArray(fullRelations) || fullRelations.length === 0) {
    try {
      const full = await getAnimeById(anime.mal_id);
      if (full?.relations && Array.isArray(full.relations)) {
        fullRelations = full.relations;
      }
    } catch {
      // ignore
    }
  }

  // 3. Process Jikan relations entries
  const pendingParentOrPrequelIds: number[] = [];
  const pendingDirectIds: { id: number; relType: string }[] = [];

  if (fullRelations && Array.isArray(fullRelations)) {
    for (const rel of fullRelations) {
      const relName = rel.relation;
      for (const entry of rel.entry || []) {
        if (entry.type === 'anime' && entry.mal_id && !seasonsMap.has(entry.mal_id)) {
          pendingDirectIds.push({ id: entry.mal_id, relType: relName });
          if (['Parent story', 'Prequel', 'Full story'].includes(relName)) {
            pendingParentOrPrequelIds.push(entry.mal_id);
          }
        }
      }
    }
  }

  // 4. Query AniList GraphQL for immediate multi-way relations
  try {
    const anilistRelations = await fetchAniListRelations(anime.mal_id);
    for (const item of anilistRelations) {
      if (!seasonsMap.has(item.mal_id)) {
        seasonsMap.set(item.mal_id, item);
      }
      if (item.relationType === 'Parent Story' || item.relationType === 'Prequel') {
        pendingParentOrPrequelIds.push(item.mal_id);
      }
    }
  } catch (e) {
    console.warn('[Franchise AniList] Note:', e);
  }

  // 5. If this is a movie or sub-season, also fetch parent/prequel relations (e.g. Mugen Train -> Season 1 -> Entertainment District)
  if (pendingParentOrPrequelIds.length > 0) {
    const parentId = pendingParentOrPrequelIds[0];
    try {
      const parentAniList = await fetchAniListRelations(parentId);
      for (const item of parentAniList) {
        if (!seasonsMap.has(item.mal_id)) {
          seasonsMap.set(item.mal_id, item);
        }
      }
    } catch {
      // ignore
    }
  }

  // 6. Direct Jikan backfill for remaining high-priority relations
  const directToFetch = pendingDirectIds.filter((p) => !seasonsMap.has(p.id)).slice(0, 6);
  if (directToFetch.length > 0) {
    await Promise.allSettled(
      directToFetch.map(async ({ id, relType }) => {
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
              relationType: relType,
            });
          }
        } catch {
          // ignore
        }
      })
    );
  }

  // 7. Franchise Catalog Search by clean root title
  const rootTitle = extractFranchiseRoot(anime.title) || anime.title;
  const cleanTokens = rootTitle
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  try {
    const searchRes = await searchAnime(rootTitle, 24);
    if (Array.isArray(searchRes)) {
      for (const item of searchRes) {
        if (seasonsMap.has(item.mal_id)) continue;
        const itemCombined = `${item.title || ''} ${item.title_english || ''} ${item.title_japanese || ''}`.toLowerCase();
        const matches = cleanTokens.some((token) => itemCombined.includes(token));
        if (matches) {
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
            relationType: item.type === 'Movie' ? 'Movie' : 'Franchise Work',
          });
        }
      }
    }
  } catch (err) {
    console.warn('[Franchise] Search lookup note:', err);
  }

  // 8. Sort chronologically: release year ascending, then score descending
  return Array.from(seasonsMap.values()).sort((a, b) => {
    const yearA = a.year ?? 9999;
    const yearB = b.year ?? 9999;
    if (yearA !== yearB) return yearA - yearB;
    return (b.score || 0) - (a.score || 0);
  });
}
