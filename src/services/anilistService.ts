import { AnimeItem, JikanPagination } from '../types';
import { isNsfwOrAdultClient } from './directJikanFallback';

const ANILIST_GRAPHQL_URL = 'https://graphql.anilist.co';

function calculateAccurateScore(media: any): number {
  if (media?.stats?.scoreDistribution && Array.isArray(media.stats.scoreDistribution) && media.stats.scoreDistribution.length > 0) {
    let totalScore = 0;
    let totalAmount = 0;
    for (const d of media.stats.scoreDistribution) {
      if (d && typeof d.score === 'number' && typeof d.amount === 'number') {
        totalScore += d.score * d.amount;
        totalAmount += d.amount;
      }
    }
    if (totalAmount > 0) {
      return Number((totalScore / totalAmount / 10).toFixed(2));
    }
  }
  if (typeof media?.averageScore === 'number' && media.averageScore > 0) {
    return Number((media.averageScore / 10).toFixed(2));
  }
  if (typeof media?.meanScore === 'number' && media.meanScore > 0) {
    return Number((media.meanScore / 10).toFixed(2));
  }
  return 0;
}

function mapAniListMediaToAnimeItem(media: any): AnimeItem {
  const images = {
    jpg: {
      image_url: media.coverImage?.large || media.coverImage?.medium || '',
      large_image_url: media.coverImage?.extraLarge || media.coverImage?.large || '',
      small_image_url: media.coverImage?.medium || '',
    },
    webp: {
      image_url: media.coverImage?.large || media.coverImage?.medium || '',
      large_image_url: media.coverImage?.extraLarge || media.coverImage?.large || '',
      small_image_url: media.coverImage?.medium || '',
    },
  };

  const genres = (media.genres || []).map((name: string, idx: number) => ({
    mal_id: idx + 1,
    name,
    type: 'anime',
    url: '',
  }));

  const studios = (media.studios?.nodes || []).map((st: any) => ({
    mal_id: st.id || 0,
    name: st.name || '',
    type: 'studio',
    url: '',
  }));

  const streaming = (media.externalLinks || [])
    .filter((link: any) => link?.site && link?.url)
    .map((link: any) => ({
      name: link.site,
      url: link.url,
    }));

  return {
    mal_id: media.idMal || media.id,
    url: `https://anilist.co/anime/${media.id}`,
    images,
    trailer: media.trailer?.id ? {
      youtube_id: media.trailer.id,
      url: `https://www.youtube.com/watch?v=${media.trailer.id}`,
      embed_url: `https://www.youtube.com/embed/${media.trailer.id}`,
    } : undefined,
    title: media.title?.english || media.title?.romaji || media.title?.native || 'Untitled',
    title_english: media.title?.english,
    title_japanese: media.title?.native,
    type: media.format || 'TV',
    source: 'Original',
    episodes: media.episodes || null,
    status: media.status === 'RELEASING' ? 'Currently Airing' : media.status === 'FINISHED' ? 'Finished Airing' : 'Not yet aired',
    airing: media.status === 'RELEASING',
    duration: media.duration ? `${media.duration} min` : undefined,
    rating: media.isAdult ? 'R - 17+ (violence & profanity)' : 'PG-13 - Teens 13 or older',
    score: calculateAccurateScore(media),
    scored_by: media.popularity || 0,
    rank: undefined,
    popularity: media.popularity || 0,
    members: media.popularity || 0,
    favorites: media.favourites || 0,
    synopsis: media.description?.replace(/<[^>]*>?/gm, '') || 'No synopsis available.',
    season: media.season?.toLowerCase() || null,
    year: media.seasonYear || media.startDate?.year || null,
    genres,
    studios,
    streaming,
    broadcast: {
      string: media.status === 'RELEASING' ? 'Currently Airing' : undefined,
    },
  };
}

function matchesEntityClient(search: string, entityName?: string): boolean {
  if (!search || !entityName) return false;
  const s = search.toLowerCase().trim();
  const e = entityName.toLowerCase().trim();
  if (e === s) return true;
  const words = e.split(/[\s\-_\/]+/);
  if (words.some(w => w === s || (s.length >= 3 && w.startsWith(s)))) return true;
  if (e.startsWith(s) || (s.length >= 4 && s.startsWith(e))) return true;
  return false;
}

export async function fetchAniListAnimeList(options: {
  sort?: string;
  season?: string;
  seasonYear?: number;
  status?: string;
  search?: string;
  genre?: string;
  tag?: string;
  page?: number;
  perPage?: number;
}): Promise<{ data: AnimeItem[]; pagination: JikanPagination }> {
  const page = options.page || 1;
  const perPage = options.perPage || 24;
  const cleanSearch = options.search?.trim();

  const mediaFields = `
    id
    idMal
    title {
      romaji
      english
      native
    }
    coverImage {
      extraLarge
      large
      medium
    }
    bannerImage
    format
    episodes
    duration
    status
    averageScore
    meanScore
    stats {
      scoreDistribution {
        score
        amount
      }
    }
    popularity
    favourites
    description
    season
    seasonYear
    genres
    isAdult
    startDate {
      year
    }
    trailer {
      id
      site
    }
    studios(isMain: true) {
      nodes {
        id
        name
      }
    }
    externalLinks {
      site
      url
    }
  `;

  const query = `
    query ($page: Int, $perPage: Int, $sort: [MediaSort], $season: MediaSeason, $seasonYear: Int, $status: MediaStatus, $search: String, $genre: String, $tag: String) {
      Page (page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media (type: ANIME, sort: $sort, season: $season, seasonYear: $seasonYear, status: $status, search: $search, genre: $genre, tag: $tag, isAdult: false) {
          ${mediaFields}
        }
      }
    }
  `;

  const variables: Record<string, any> = {
    page,
    perPage,
    sort: options.sort ? [options.sort] : ['POPULARITY_DESC'],
  };

  if (options.season) variables.season = options.season.toUpperCase();
  if (options.seasonYear) variables.seasonYear = options.seasonYear;
  if (options.status) variables.status = options.status.toUpperCase();
  if (cleanSearch) variables.search = cleanSearch;
  if (options.genre) variables.genre = options.genre;
  if (options.tag) variables.tag = options.tag;

  const fetchMain = fetch(ANILIST_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  }).then(async (r) => (r.ok ? r.json() : null)).catch(() => null);

  let fetchChar: Promise<any> = Promise.resolve(null);
  let fetchStudio: Promise<any> = Promise.resolve(null);

  if (cleanSearch && cleanSearch.length >= 2) {
    const charGql = `
      query ($search: String) {
        Character(search: $search) {
          name { full alternative }
          media(sort: [POPULARITY_DESC], perPage: 10) {
            nodes {
              ${mediaFields}
            }
          }
        }
      }
    `;
    const studioGql = `
      query ($search: String) {
        Studio(search: $search) {
          name
          media(sort: [POPULARITY_DESC], perPage: 12) {
            nodes {
              ${mediaFields}
            }
          }
        }
      }
    `;

    fetchChar = fetch(ANILIST_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: charGql, variables: { search: cleanSearch } }),
    }).then(async (r) => (r.ok ? r.json() : null)).catch(() => null);

    fetchStudio = fetch(ANILIST_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: studioGql, variables: { search: cleanSearch } }),
    }).then(async (r) => (r.ok ? r.json() : null)).catch(() => null);
  }

  const [mainJson, charJson, studioJson] = await Promise.all([fetchMain, fetchChar, fetchStudio]);

  const pageData = mainJson?.data?.Page;
  const directMediaList = pageData?.media || [];
  const extraMediaList: any[] = [];
  let isStudioHit = false;
  let isCharHit = false;

  if (studioJson?.data?.Studio) {
    const studio = studioJson.data.Studio;
    if (matchesEntityClient(cleanSearch!, studio.name) && Array.isArray(studio.media?.nodes)) {
      isStudioHit = true;
      extraMediaList.push(...studio.media.nodes);
    }
  }

  if (charJson?.data?.Character) {
    const char = charJson.data.Character;
    const charMatches = matchesEntityClient(cleanSearch!, char.name?.full) || (char.name?.alternative || []).some((alt: string) => matchesEntityClient(cleanSearch!, alt));
    if (charMatches && Array.isArray(char.media?.nodes)) {
      isCharHit = true;
      extraMediaList.push(...char.media.nodes);
    }
  }

  const combinedMedia = (isStudioHit || isCharHit)
    ? [...extraMediaList, ...directMediaList]
    : directMediaList;

  const seenIds = new Set<number>();
  const animeList = combinedMedia
    .filter((item: any) => {
      const id = item.idMal || item.id;
      if (!id || seenIds.has(id)) return false;
      seenIds.add(id);
      return true;
    })
    .map(mapAniListMediaToAnimeItem)
    .filter((item: AnimeItem) => !isNsfwOrAdultClient(item));

  return {
    data: animeList,
    pagination: {
      last_visible_page: pageData?.pageInfo?.lastPage || 1,
      has_next_page: Boolean(pageData?.pageInfo?.hasNextPage) || animeList.length >= perPage,
      current_page: pageData?.pageInfo?.currentPage || 1,
      items: {
        count: animeList.length,
        total: pageData?.pageInfo?.total || animeList.length,
        per_page: perPage,
      },
    },
  };
}

export async function fetchAniListTop100(
  filter: string = 'bypopularity',
  genre?: string,
  year?: string,
  limit: number = 100
): Promise<AnimeItem[]> {
  try {
    let sort = '[SCORE_DESC, POPULARITY_DESC]';
    if (filter === 'bypopularity') sort = '[POPULARITY_DESC]';
    else if (filter === 'favorite') sort = '[FAVOURITES_DESC]';
    else if (filter === 'upcoming') sort = '[POPULARITY_DESC]';
    else if (filter === 'airing') sort = '[POPULARITY_DESC, SCORE_DESC]';

    let statusApi: string | undefined = undefined;
    if (filter === 'airing') statusApi = 'RELEASING';
    if (filter === 'upcoming') statusApi = 'NOT_YET_RELEASED';

    const isIsekai = genre?.toLowerCase() === 'isekai';
    const anilistGenre = isIsekai ? undefined : (genre && genre !== 'all' ? genre : undefined);
    const anilistTag = isIsekai ? 'Isekai' : undefined;
    const seasonYear = year && year !== 'all' ? parseInt(year, 10) : undefined;

    const query = `
      query ($genre: String, $tag: String, $seasonYear: Int, $status: MediaStatus, $page: Int) {
        Page(page: $page, perPage: 50) {
          media(genre: $genre, tag: $tag, seasonYear: $seasonYear, status: $status, sort: ${sort}, isAdult: false, genre_not_in: ["Hentai"], type: ANIME) {
            idMal id title { romaji english native } coverImage { large extraLarge } bannerImage status episodes duration averageScore meanScore stats { scoreDistribution { score amount } } popularity favourites description(asHtml: false) genres studios(isMain: true) { nodes { id name } }
          }
        }
      }
    `;

    const pages = limit > 50 ? [1, 2, 3] : [1];
    const responses = await Promise.all(
      pages.map(p =>
        fetch(ANILIST_GRAPHQL_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            query,
            variables: { genre: anilistGenre, tag: anilistTag, seasonYear, status: statusApi, page: p }
          })
        }).then(r => r.ok ? r.json() : null).catch(() => null)
      )
    );

    const allMedia: any[] = [];
    for (const res of responses) {
      const items = res?.data?.Page?.media;
      if (Array.isArray(items)) {
        allMedia.push(...items);
      }
    }

    const seenIds = new Set<number>();
    const animeList = allMedia
      .filter((m: any) => {
        const id = m.idMal || m.id;
        if (!id || seenIds.has(id)) return false;
        seenIds.add(id);
        return true;
      })
      .map(mapAniListMediaToAnimeItem)
      .filter((item: AnimeItem) => !isNsfwOrAdultClient(item));

    return animeList.slice(0, limit);
  } catch (err) {
    console.warn('[AniListTop100 Client] Fetch note:', err);
    return [];
  }
}
