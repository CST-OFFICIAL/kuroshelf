import { AnimeItem, JikanPagination } from '../types';
import { isNsfwOrAdultClient } from './directJikanFallback';

const ANILIST_GRAPHQL_URL = 'https://graphql.anilist.co';

export const STUDIO_ALIASES: Record<string, string> = {
  'mappa': 'MAPPA',
  'bones': 'bones',
  'studio bones': 'bones',
  'kyoani': 'Kyoto Animation',
  'kyoto animation': 'Kyoto Animation',
  'kyoto': 'Kyoto Animation',
  'ufotable': 'ufotable',
  'wit': 'WIT STUDIO',
  'wit studio': 'WIT STUDIO',
  'cloverworks': 'CloverWorks',
  'clover works': 'CloverWorks',
  'trigger': 'Studio Trigger',
  'studio trigger': 'Studio Trigger',
  'ghibli': 'Studio Ghibli',
  'studio ghibli': 'Studio Ghibli',
  'madhouse': 'Madhouse',
  'a-1': 'A-1 Pictures',
  'a1': 'A-1 Pictures',
  'a-1 pictures': 'A-1 Pictures',
  'a1 pictures': 'A-1 Pictures',
  'toei': 'Toei Animation',
  'toei animation': 'Toei Animation',
  'pierrot': 'Studio Pierrot',
  'studio pierrot': 'Studio Pierrot',
  'shaft': 'Shaft',
  'david production': 'David Production',
  'david': 'David Production',
  'jc staff': 'J.C.Staff',
  'jcstaff': 'J.C.Staff',
  'j.c.staff': 'J.C.Staff',
  'production ig': 'Production I.G',
  'production i.g': 'Production I.G',
  'white fox': 'White Fox',
  'sunrise': 'Sunrise',
  'bandai namco': 'Sunrise',
  'kinema citrus': 'Kinema Citrus',
  'doga kobo': 'Doga Kobo',
  'lerche': 'Lerche',
  'pa works': 'P.A. Works',
  'p.a. works': 'P.A. Works',
  'tms': 'TMS Entertainment',
  'tms entertainment': 'TMS Entertainment',
  'bind': 'Studio Bind',
  'studio bind': 'Studio Bind',
  'comix wave': 'CoMix Wave Films',
  'comix wave films': 'CoMix Wave Films',
  'silver link': 'SILVER LINK.',
  'feel': 'feel.',
  'deen': 'Studio Deen',
  'studio deen': 'Studio Deen',
  'gainax': 'Gainax'
};

export const COMMON_ABBREVIATIONS: Record<string, string> = {
  'aot': 'Attack on Titan',
  'snk': 'Shingeki no Kyojin',
  'mha': 'My Hero Academia',
  'bnha': 'Boku no Hero Academia',
  'jjk': 'Jujutsu Kaisen',
  'fma': 'Fullmetal Alchemist',
  'fmab': 'Fullmetal Alchemist: Brotherhood',
  'kny': 'Demon Slayer: Kimetsu no Yaiba',
  'ds': 'Demon Slayer',
  'sao': 'Sword Art Online',
  'hxh': 'Hunter x Hunter',
  'csm': 'Chainsaw Man',
  'sxf': 'Spy x Family',
  'dbz': 'Dragon Ball Z',
  'db': 'Dragon Ball',
  'dbs': 'Dragon Ball Super',
  'eva': 'Neon Genesis Evangelion',
  'nge': 'Neon Genesis Evangelion',
  'opm': 'One Punch Man',
  'op': 'One Piece',
  'bocchi': 'Bocchi the Rock!',
  'rezero': 'Re:Zero',
  'slime': 'That Time I Got Reincarnated as a Slime',
  'danmachi': 'Is It Wrong to Try to Pick Up Girls in a Dungeon?',
  'oregairu': 'My Teen Romantic Comedy SNAFU',
  'snafu': 'My Teen Romantic Comedy SNAFU',
  'mushoku': 'Mushoku Tensei'
};

export const ICONIC_CHARACTERS: Record<string, { character: string; titles: string[]; mal_ids: number[] }> = {
  'levi': { character: 'Levi Ackerman', titles: ['Attack on Titan', 'Shingeki no Kyojin'], mal_ids: [16498, 25777, 35760, 38524, 40028] },
  'gojo': { character: 'Satoru Gojo', titles: ['Jujutsu Kaisen'], mal_ids: [40748, 51009, 48561] },
  'goku': { character: 'Son Goku', titles: ['Dragon Ball Z', 'Dragon Ball', 'Dragon Ball Super'], mal_ids: [813, 223, 30694, 6033] },
  'luffy': { character: 'Monkey D. Luffy', titles: ['One Piece'], mal_ids: [21] },
  'zoro': { character: 'Roronoa Zoro', titles: ['One Piece'], mal_ids: [21] },
  'lelouch': { character: 'Lelouch Lamperouge', titles: ['Code Geass'], mal_ids: [1575, 2904] },
  'kakashi': { character: 'Kakashi Hatake', titles: ['Naruto', 'Naruto: Shippuuden'], mal_ids: [20, 1735] },
  'mikasa': { character: 'Mikasa Ackerman', titles: ['Attack on Titan', 'Shingeki no Kyojin'], mal_ids: [16498, 25777, 35760, 38524] },
  'eren': { character: 'Eren Yeager', titles: ['Attack on Titan', 'Shingeki no Kyojin'], mal_ids: [16498, 25777, 35760, 38524] },
  'tanjiro': { character: 'Tanjiro Kamado', titles: ['Demon Slayer', 'Kimetsu no Yaiba'], mal_ids: [38000, 47778, 49926] },
  'deku': { character: 'Izuku Midoriya', titles: ['My Hero Academia', 'Boku no Hero Academia'], mal_ids: [31964, 33486, 36456] },
  'all might': { character: 'All Might', titles: ['My Hero Academia'], mal_ids: [31964, 33486] },
  'killua': { character: 'Killua Zoldyck', titles: ['Hunter x Hunter'], mal_ids: [11061] },
  'kurapika': { character: 'Kurapika', titles: ['Hunter x Hunter'], mal_ids: [11061] },
  'light': { character: 'Light Yagami', titles: ['Death Note'], mal_ids: [1535] },
  'l': { character: 'L Lawliet', titles: ['Death Note'], mal_ids: [1535] },
  'sukuna': { character: 'Ryomen Sukuna', titles: ['Jujutsu Kaisen'], mal_ids: [40748, 51009] },
  'rem': { character: 'Rem', titles: ['Re:Zero'], mal_ids: [31240, 39587] },
  'megumin': { character: 'Megumin', titles: ['KonoSuba'], mal_ids: [30831, 32937] },
  'edward': { character: 'Edward Elric', titles: ['Fullmetal Alchemist: Brotherhood'], mal_ids: [5114] },
  'edward elric': { character: 'Edward Elric', titles: ['Fullmetal Alchemist: Brotherhood'], mal_ids: [5114] },
  'saitama': { character: 'Saitama', titles: ['One Punch Man'], mal_ids: [30276] },
  'itachi': { character: 'Itachi Uchiha', titles: ['Naruto: Shippuuden'], mal_ids: [1735] },
  'sasuke': { character: 'Sasuke Uchiha', titles: ['Naruto', 'Naruto: Shippuuden'], mal_ids: [20, 1735] },
  'kaneki': { character: 'Ken Kaneki', titles: ['Tokyo Ghoul'], mal_ids: [22319] },
  'spike': { character: 'Spike Spiegel', titles: ['Cowboy Bebop'], mal_ids: [1] },
  'shinji': { character: 'Shinji Ikari', titles: ['Neon Genesis Evangelion'], mal_ids: [30] },
  'asuka': { character: 'Asuka Langley', titles: ['Neon Genesis Evangelion'], mal_ids: [30] },
  'sailor moon': { character: 'Sailor Moon', titles: ['Sailor Moon'], mal_ids: [530] },
  'alucard': { character: 'Alucard', titles: ['Hellsing Ultimate'], mal_ids: [777] },
  'guts': { character: 'Guts', titles: ['Berserk'], mal_ids: [33] },
  'denji': { character: 'Denji', titles: ['Chainsaw Man'], mal_ids: [44511] },
  'makima': { character: 'Makima', titles: ['Chainsaw Man'], mal_ids: [44511] },
  'power': { character: 'Power', titles: ['Chainsaw Man'], mal_ids: [44511] },
  'anya': { character: 'Anya Forger', titles: ['SPY x FAMILY'], mal_ids: [50265] },
  'frieren': { character: 'Frieren', titles: ["Frieren: Beyond Journey's End"], mal_ids: [52991] }
};

export const ICONIC_STUDIOS: Record<string, { studio: string; mal_ids: number[] }> = {
  'mappa': { studio: 'MAPPA', mal_ids: [40748, 44511, 40028, 48583, 51009, 51535, 46569, 37520, 32995] },
  'bones': { studio: 'Bones', mal_ids: [31964, 5114, 32182, 31478, 3588, 20507] },
  'ufotable': { studio: 'ufotable', mal_ids: [38000, 47778, 10087, 22297] },
  'kyoani': { studio: 'Kyoto Animation', mal_ids: [28851, 33352, 12189, 5680, 2167] },
  'kyoto animation': { studio: 'Kyoto Animation', mal_ids: [28851, 33352, 12189, 5680, 2167] },
  'wit': { studio: 'WIT STUDIO', mal_ids: [16498, 25777, 35760, 37521, 50265, 40834] },
  'wit studio': { studio: 'WIT STUDIO', mal_ids: [16498, 25777, 35760, 37521, 50265, 40834] },
  'cloverworks': { studio: 'CloverWorks', mal_ids: [47917, 37779, 42897, 48736, 50265] },
  'madhouse': { studio: 'Madhouse', mal_ids: [1535, 11061, 30276, 52991] },
  'trigger': { studio: 'Studio Trigger', mal_ids: [18679, 42310, 33489, 52701] },
  'ghibli': { studio: 'Studio Ghibli', mal_ids: [199, 164, 431, 523] },
  'shaft': { studio: 'Shaft', mal_ids: [5081, 9756, 31646] },
  'a-1 pictures': { studio: 'A-1 Pictures', mal_ids: [11757, 37999, 52299, 23273, 41457] },
  'a1 pictures': { studio: 'A-1 Pictures', mal_ids: [11757, 37999, 52299, 23273, 41457] },
  'toei animation': { studio: 'Toei Animation', mal_ids: [21, 813, 170, 530] }
};

export const ICONIC_LETTER_ANIME: Record<string, number[]> = {
  'a': [16498, 22199, 11111, 6547, 24833, 47, 28851, 9989, 11759, 31580],
  'b': [269, 34572, 33, 47917, 31478, 9919, 49596, 39195],
  'c': [44511, 1575, 1, 2167, 42310, 35507, 28999],
  'd': [1535, 38000, 813, 38691, 37520, 38668, 6880],
  'e': [31043, 30, 226, 237, 48316],
  'f': [5114, 52991, 10087, 6702, 38671, 38680],
  'g': [918, 2001, 245, 10793, 36028],
  'h': [11061, 20583, 777, 11617, 12189, 46569, 42897],
  'i': [249, 185, 38472, 40046, 34542],
  'j': [40748, 14719, 46569, 36124],
  'k': [37999, 18679, 5680, 30831, 11771, 34933, 52588],
  'l': [1535, 1887, 17265, 35557, 33489],
  'm': [31964, 32182, 39535, 34599, 19, 10620, 14513],
  'n': [20, 1735, 19815, 20507, 18897, 877],
  'o': [21, 30276, 52034, 29803, 32729, 853],
  'p': [13601, 22535, 37779, 9756, 30240],
  'q': [38101],
  'r': [31240, 45, 30015, 40834, 37450],
  's': [9253, 11757, 50265, 52299, 16498, 3588, 205],
  't': [22319, 4224, 35790, 6, 40221],
  'u': [38000, 50782, 35249, 29854],
  'v': [37521, 33352, 46095],
  'w': [38826, 54900, 35968, 202, 24405],
  'x': [861],
  'y': [32281, 23273, 392, 32995, 25013],
  'z': [23283, 54112, 37976, 14075]
};

function matchesEntity(search: string, entityName?: string, alternatives: string[] = []): boolean {
  if (!search || (!entityName && alternatives.length === 0)) return false;
  const s = search.toLowerCase().trim();
  const sAlpha = s.replace(/[^a-z0-9]/g, '');
  if (!sAlpha) return false;

  const names = [entityName, ...alternatives].filter(Boolean) as string[];
  for (const name of names) {
    const e = name.toLowerCase().trim();
    const eAlpha = e.replace(/[^a-z0-9]/g, '');
    if (e === s || eAlpha === sAlpha) return true;
    if (eAlpha.startsWith(sAlpha) || (sAlpha.length >= 3 && sAlpha.startsWith(eAlpha))) return true;
    const words = e.split(/[\s\-_\/]+/);
    if (words.some(w => {
      const cw = w.replace(/[^a-z0-9]/g, '');
      return cw === sAlpha || (sAlpha.length >= 2 && cw.startsWith(sAlpha)) || (cw.length >= 3 && sAlpha.startsWith(cw));
    })) {
      return true;
    }
  }
  return false;
}

function scoreAnimeRelevance(anime: any, query: string, isCharacterMatch = false, isStudioMatch = false): number {
  if (!query) return 0;
  const q = query.toLowerCase().trim();
  const title = (anime.title || '').toLowerCase().trim();
  const titleEng = (anime.title_english || '').toLowerCase().trim();
  const titleJap = (anime.title_japanese || '').toLowerCase().trim();
  
  let score = 0;

  const isTargetStudio = isStudioMatch || Boolean(STUDIO_ALIASES[q] && Array.isArray(anime.studios) && anime.studios.some((s: any) => {
    const sName = typeof s === 'string' ? s : s?.name || '';
    return matchesEntity(STUDIO_ALIASES[q] || q, sName);
  }));
  
  // Exact match
  if (title === q || titleEng === q || titleJap === q) {
    score += 3000;
  }
  
  // Character match
  if (isCharacterMatch) {
    score += 4000;
  }
  
  // Studio match
  if (isTargetStudio) {
    score += 3800;
  }

  if (!isTargetStudio && !isCharacterMatch) {
    if (title.startsWith(q) || titleEng.startsWith(q) || titleJap.startsWith(q)) {
      score += 1500;
    }
    const wordRegex = new RegExp('(?:^|[\\s\\-_:/(])' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:$|[\\s\\-_:!?,/)])', 'i');
    if (wordRegex.test(title) || wordRegex.test(titleEng) || wordRegex.test(titleJap)) {
      score += 1000;
    }
  } else {
    if (title.startsWith(q) || titleEng.startsWith(q)) {
      score += 400;
    }
  }

  if (title.includes(q) || titleEng.includes(q)) {
    score += 250;
  }
  
  const pop = typeof anime.popularity === 'number' && anime.popularity > 0 ? anime.popularity : 0;
  if (pop > 0 && pop <= 30000) {
    score += Math.max(0, 500 - Math.floor(pop / 60));
  }

  const scoreVal = typeof anime.score === 'number' ? anime.score : 0;
  if (scoreVal > 0) {
    score += scoreVal * 20;
  }
  
  return score;
}

const anilistCache = new Map<string, { data: AnimeItem[]; pagination: JikanPagination; timestamp: number }>();
const ANILIST_CACHE_TTL = 1000 * 60 * 15; // 15 mins

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
  const lowerSearch = (cleanSearch || '').toLowerCase();
  
  // Resolve abbreviations (e.g. AOT -> Attack on Titan) and studio aliases (e.g. Mappa -> MAPPA)
  const resolvedSearch = cleanSearch ? (COMMON_ABBREVIATIONS[lowerSearch] || STUDIO_ALIASES[lowerSearch] || cleanSearch) : undefined;
  const isStudioKeyword = Boolean(cleanSearch && STUDIO_ALIASES[lowerSearch]);

  const cacheKey = JSON.stringify({ ...options, search: resolvedSearch });
  const cached = anilistCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < ANILIST_CACHE_TTL) {
    return { data: cached.data, pagination: cached.pagination };
  }

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
    perPage: Math.max(perPage, 24),
    sort: options.sort ? [options.sort] : ['POPULARITY_DESC'],
  };

  if (options.season) variables.season = options.season.toUpperCase();
  if (options.seasonYear) variables.seasonYear = options.seasonYear;
  if (options.status) variables.status = options.status.toUpperCase();
  if (resolvedSearch) variables.search = resolvedSearch;
  if (options.genre) variables.genre = options.genre;
  if (options.tag) variables.tag = options.tag;

  let mainJson: any = null;
  const mainPromise = fetch(ANILIST_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(6000),
  }).then(r => r.ok ? r.json() : null).catch(() => null);

  let charPromise: Promise<any> = Promise.resolve(null);
  let studioPromise: Promise<any> = Promise.resolve(null);
  let targetIdsPromise: Promise<any> = Promise.resolve(null);

  const targetMalIds = [
    ...(ICONIC_CHARACTERS[lowerSearch]?.mal_ids || []),
    ...(ICONIC_STUDIOS[lowerSearch]?.mal_ids || []),
    ...(ICONIC_LETTER_ANIME[lowerSearch] || [])
  ];

  if (targetMalIds.length > 0) {
    const idsGql = `
      query ($ids: [Int]) {
        Page(page: 1, perPage: 12) {
          media(idMal_in: $ids, type: ANIME) {
            ${mediaFields}
          }
        }
      }
    `;
    targetIdsPromise = fetch(ANILIST_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: idsGql, variables: { ids: targetMalIds } }),
      signal: AbortSignal.timeout(5000),
    }).then(r => r.ok ? r.json() : null).catch(() => null);
  }

  if (cleanSearch) {
    const charSearchTerm = cleanSearch;
    const studioSearchTerm = STUDIO_ALIASES[lowerSearch] || cleanSearch;

    const charGql = `
      query ($search: String) {
        Page(page: 1, perPage: 4) {
          characters(search: $search) {
            name { full alternative native }
            media(sort: [POPULARITY_DESC], perPage: 12) {
              nodes {
                ${mediaFields}
              }
            }
          }
        }
      }
    `;

    const studioGql = `
      query ($search: String) {
        Page(page: 1, perPage: 3) {
          studios(search: $search) {
            name
            media(sort: [POPULARITY_DESC], perPage: 18) {
              nodes {
                ${mediaFields}
              }
            }
          }
        }
      }
    `;

    charPromise = fetch(ANILIST_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: charGql, variables: { search: charSearchTerm } }),
      signal: AbortSignal.timeout(5000),
    }).then(r => r.ok ? r.json() : null).catch(() => null);

    studioPromise = fetch(ANILIST_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: studioGql, variables: { search: studioSearchTerm } }),
      signal: AbortSignal.timeout(5000),
    }).then(r => r.ok ? r.json() : null).catch(() => null);
  }

  const [mainRes, charRes, studioRes, targetRes] = await Promise.all([
    mainPromise,
    charPromise,
    studioPromise,
    targetIdsPromise
  ]);

  mainJson = mainRes;
  const pageData = mainJson?.data?.Page;
  const directMediaList = pageData?.media || [];
  const targetMedia = Array.isArray(targetRes?.data?.Page?.media) ? targetRes.data.Page.media : [];
  const characterHits: any[] = [];
  const studioHits: any[] = [];

  const isIconicChar = Boolean(ICONIC_CHARACTERS[lowerSearch]);
  const isIconicStudio = Boolean(ICONIC_STUDIOS[lowerSearch]);
  if (isIconicChar) {
    characterHits.push(...targetMedia);
  } else if (isIconicStudio) {
    studioHits.push(...targetMedia);
  } else if (targetMedia.length > 0) {
    directMediaList.unshift(...targetMedia);
  }

  // Studio hits extraction
  const foundStudios = studioRes?.data?.Page?.studios || [];
  for (const st of foundStudios) {
    if (st && Array.isArray(st.media?.nodes)) {
      if (isStudioKeyword || (cleanSearch && matchesEntity(cleanSearch, st.name))) {
        studioHits.push(...st.media.nodes);
      }
    }
  }

  // Character hits extraction
  const foundChars = charRes?.data?.Page?.characters || [];
  for (const ch of foundChars) {
    if (ch && Array.isArray(ch.media?.nodes)) {
      const alts = Array.isArray(ch.name?.alternative) ? ch.name.alternative : [];
      if (cleanSearch && (matchesEntity(cleanSearch, ch.name?.full, alts) || (cleanSearch.length >= 2 && (ch.name?.full?.toLowerCase().includes(lowerSearch) || alts.some((a: string) => a.toLowerCase().includes(lowerSearch)))))) {
        characterHits.push(...ch.media.nodes);
      }
    }
  }

  const charIdSet = new Set(characterHits.map((m: any) => m?.idMal || m?.id).filter(Boolean));
  const studioIdSet = new Set(studioHits.map((m: any) => m?.idMal || m?.id).filter(Boolean));

  let pool: any[] = [];
  if (isStudioKeyword) {
    pool = [...studioHits, ...characterHits, ...directMediaList];
  } else if (characterHits.length > 0) {
    pool = [...characterHits, ...directMediaList, ...studioHits];
  } else {
    pool = [...directMediaList, ...studioHits, ...characterHits];
  }

  const seenIds = new Set<number>();
  let animeList = pool
    .filter((item: any) => {
      const id = item.idMal || item.id;
      if (!id || seenIds.has(id)) return false;
      seenIds.add(id);
      return true;
    })
    .map(mapAniListMediaToAnimeItem)
    .filter((item: AnimeItem) => !isNsfwOrAdultClient(item));

  if (cleanSearch) {
    animeList.sort((a, b) => {
      const isCharA = charIdSet.has(a.mal_id);
      const isStudioA = studioIdSet.has(a.mal_id);
      const isCharB = charIdSet.has(b.mal_id);
      const isStudioB = studioIdSet.has(b.mal_id);
      const scoreA = scoreAnimeRelevance(a, cleanSearch, isCharA, isStudioA);
      const scoreB = scoreAnimeRelevance(b, cleanSearch, isCharB, isStudioB);
      return scoreB - scoreA;
    });
  }

  const result = {
    data: animeList.slice(0, perPage),
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

  anilistCache.set(cacheKey, { data: result.data, pagination: result.pagination, timestamp: Date.now() });
  return result;
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
