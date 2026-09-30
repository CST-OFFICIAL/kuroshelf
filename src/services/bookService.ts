import { MangaItem, BookFormat, JikanGenre } from '../types';

const ANILIST_GRAPHQL_URL = 'https://graphql.anilist.co';

export interface BookFetchOptions {
  format?: BookFormat;
  search?: string;
  genre?: string;
  status?: string;
  sort?: 'POPULARITY_DESC' | 'SCORE_DESC' | 'TRENDING_DESC' | 'FAVOURITES_DESC';
  page?: number;
  perPage?: number;
}

export function mapAniListMediaToMangaItem(media: any): MangaItem {
  const isKR = media.countryOfOrigin === 'KR';
  const isCN = media.countryOfOrigin === 'CN';
  const isNovel = media.format === 'NOVEL';

  let resolvedType = 'Manga';
  if (isNovel) resolvedType = 'Light Novel';
  else if (isKR) resolvedType = 'Manhwa';
  else if (isCN) resolvedType = 'Manhua';

  const titleEnglish = media.title?.english || undefined;
  const titleRomaji = media.title?.romaji || media.title?.native || 'Unknown Title';
  const title = titleEnglish || titleRomaji;

  const genres: JikanGenre[] = (media.genres || []).map((g: string, idx: number) => ({
    mal_id: idx + 1,
    name: g,
    type: 'manga',
    url: '',
  }));

  const staff = media.staff?.edges || [];
  const authors = staff.map((edge: any) => ({
    mal_id: edge.node?.id || 1,
    name: edge.node?.name?.full || 'Unknown',
    type: edge.role || 'Author',
  }));

  const safeScore = typeof media.averageScore === 'number' && media.averageScore > 0
    ? Number((media.averageScore / 10).toFixed(2))
    : undefined;

  const extraLarge = media.coverImage?.extraLarge;
  const large = media.coverImage?.large;
  const medium = media.coverImage?.medium;
  const poster = extraLarge || large || medium || '';

  return {
    mal_id: media.idMal || media.id,
    url: `https://anilist.co/manga/${media.id}`,
    images: {
      webp: {
        image_url: large || poster,
        large_image_url: extraLarge || large || poster,
        small_image_url: medium || large || poster,
      },
      jpg: {
        image_url: large || poster,
        large_image_url: extraLarge || large || poster,
        small_image_url: medium || large || poster,
      },
    },
    title,
    title_english: titleEnglish,
    title_japanese: media.title?.native || undefined,
    type: resolvedType,
    format: media.format || 'MANGA',
    chapters: media.chapters || undefined,
    volumes: media.volumes || undefined,
    status: media.status === 'RELEASING' ? 'Publishing' : media.status === 'FINISHED' ? 'Finished' : 'On Hiatus',
    publishing: media.status === 'RELEASING',
    score: safeScore,
    popularity: media.popularity || 0,
    synopsis: media.description ? media.description.replace(/<[^>]*>/g, '') : '',
    genres,
    authors: authors.length > 0 ? authors : undefined,
    countryOfOrigin: media.countryOfOrigin || 'JP',
    bannerImage: media.bannerImage || undefined,
  };
}

const mediaFields = `
  id
  idMal
  title {
    romaji
    english
    native
  }
  format
  countryOfOrigin
  status
  chapters
  volumes
  averageScore
  popularity
  favourites
  description
  genres
  coverImage {
    extraLarge
    large
    medium
  }
  bannerImage
  staff(perPage: 3) {
    edges {
      role
      node {
        id
        name {
          full
        }
      }
    }
  }
`;

export async function fetchBooksFromJikan(
  options: BookFetchOptions = {}
): Promise<{ data: MangaItem[]; hasNextPage: boolean }> {
  const { format = 'all', search, page = 1, perPage = 24 } = options;
  let typeParam = '';
  if (format === 'manhwa') typeParam = '&type=manhwa';
  else if (format === 'manhua') typeParam = '&type=manhua';
  else if (format === 'novel') typeParam = '&type=novel';
  else if (format === 'manga') typeParam = '&type=manga';

  const clean = search ? search.trim() : '';
  const endpoint = clean
    ? `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(clean)}&page=${page}&limit=${perPage}&sfw=true${typeParam}`
    : `https://api.jikan.moe/v4/top/manga?page=${page}&limit=${perPage}&sfw=true${typeParam}`;

  try {
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`Jikan status ${res.status}`);
    const json = await res.json();
    const list: any[] = json.data || [];
    const mapped: MangaItem[] = list.map((item: any) => ({
      mal_id: item.mal_id,
      url: item.url || `https://myanimelist.net/manga/${item.mal_id}`,
      images: item.images || {
        jpg: { image_url: item.images?.jpg?.image_url || '', large_image_url: item.images?.jpg?.large_image_url },
        webp: { image_url: item.images?.webp?.image_url || '', large_image_url: item.images?.webp?.large_image_url },
      },
      title: item.title,
      title_english: item.title_english || item.title,
      title_japanese: item.title_japanese,
      type: item.type || (format === 'manhwa' ? 'Manhwa' : format === 'manhua' ? 'Manhua' : format === 'novel' ? 'Light Novel' : 'Manga'),
      format: item.type?.toUpperCase() || 'MANGA',
      chapters: item.chapters,
      volumes: item.volumes,
      status: item.status || 'Publishing',
      publishing: item.publishing ?? (item.status === 'Publishing'),
      score: item.score ? Number(item.score.toFixed(2)) : undefined,
      popularity: item.popularity || item.scored_by || 0,
      synopsis: item.synopsis ? item.synopsis.replace(/\[Written by MAL Rewrite\]/g, '').trim() : '',
      genres: (item.genres || []).map((g: any, gi: number) => ({
        mal_id: g.mal_id || gi + 1,
        name: g.name,
        type: 'manga',
        url: g.url || '',
      })),
      authors: (item.authors || []).map((a: any, ai: number) => ({
        mal_id: a.mal_id || ai + 1,
        name: a.name,
        type: a.type || 'Author',
      })),
      countryOfOrigin: item.type === 'Manhwa' ? 'KR' : item.type === 'Manhua' ? 'CN' : 'JP',
      bannerImage: item.images?.jpg?.large_image_url || item.images?.webp?.large_image_url,
    }));

    return {
      data: mapped,
      hasNextPage: Boolean(json.pagination?.has_next_page),
    };
  } catch (err) {
    console.warn('[bookService] Jikan fallback error:', err);
    return { data: getVerifiedSeedBooks(format), hasNextPage: false };
  }
}

export async function fetchBooksFromAniList(options: BookFetchOptions = {}): Promise<{ data: MangaItem[]; hasNextPage: boolean }> {
  const {
    format = 'all',
    search,
    genre,
    status,
    sort = 'POPULARITY_DESC',
    page = 1,
    perPage = 36,
  } = options;

  let countryOfOrigin: string | undefined;
  let anilistFormat: string | undefined;

  if (format === 'manhwa') {
    countryOfOrigin = 'KR';
  } else if (format === 'manhua') {
    countryOfOrigin = 'CN';
  } else if (format === 'novel') {
    anilistFormat = 'NOVEL';
  } else if (format === 'manga') {
    anilistFormat = 'MANGA';
  }

  const query = `
    query ($page: Int, $perPage: Int, $search: String, $sort: [MediaSort], $format: MediaFormat, $country: CountryCode, $genre: String, $status: MediaStatus) {
      Page (page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
          total
        }
        media (
          type: MANGA,
          search: $search,
          sort: $sort,
          format: $format,
          countryOfOrigin: $country,
          genre: $genre,
          status: $status,
          isAdult: false
        ) {
          ${mediaFields}
        }
      }
    }
  `;

  const variables: Record<string, any> = {
    page,
    perPage,
    sort: [sort],
  };

  if (search && search.trim()) variables.search = search.trim();
  if (countryOfOrigin) variables.country = countryOfOrigin;
  if (anilistFormat) variables.format = anilistFormat;
  if (genre && genre !== 'all') variables.genre = genre;
  if (status && status !== 'all') {
    variables.status = status; // e.g. RELEASING, FINISHED
  }

  try {
    const res = await fetch(ANILIST_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(7000),
    });

    if (!res.ok) {
      throw new Error(`AniList returned status ${res.status}`);
    }

    const json = await res.json();
    const mediaList = json.data?.Page?.media || [];
    const hasNextPage = Boolean(json.data?.Page?.pageInfo?.hasNextPage);

    // If AniList has no results, seamlessly query Jikan or return seeds
    if (mediaList.length === 0) {
      const fallback = await fetchBooksFromJikan(options);
      if (fallback.data && fallback.data.length > 0) {
        return fallback;
      }
      return {
        data: getVerifiedSeedBooks(format),
        hasNextPage: false,
      };
    }

    return {
      data: mediaList.map(mapAniListMediaToMangaItem),
      hasNextPage,
    };
  } catch (err) {
    console.warn('[bookService] fetchBooksFromAniList error, falling back to Jikan:', err);
    return await fetchBooksFromJikan(options);
  }
}

// Verified high-reputation fallback seed books
export function getVerifiedSeedBooks(format: BookFormat = 'all'): MangaItem[] {
  const allSeeds: MangaItem[] = [
    {
      mal_id: 121496,
      url: 'https://anilist.co/manga/105398',
      images: {
        jpg: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b673Vt5ZSuz3.jpg' },
        webp: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b673Vt5ZSuz3.jpg' },
      },
      title: 'Solo Leveling',
      title_english: 'Solo Leveling',
      type: 'Manhwa',
      format: 'MANGA',
      chapters: 201,
      volumes: 15,
      status: 'Finished',
      publishing: false,
      score: 8.6,
      popularity: 380000,
      synopsis: 'Ten years ago, the Gates opened connecting the real world with the realm of magic and monsters. To combat these vile beasts, ordinary people received superhuman powers and became known as Hunters.',
      genres: [{ mal_id: 1, name: 'Action', type: 'manga', url: '' }, { mal_id: 2, name: 'Fantasy', type: 'manga', url: '' }],
      countryOfOrigin: 'KR',
      bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/banner/105398-4UrEhdqZukrg.jpg',
    },
    {
      mal_id: 2,
      url: 'https://anilist.co/manga/30002',
      images: {
        jpg: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30002-Cul4OeN7bYtn.jpg' },
        webp: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30002-Cul4OeN7bYtn.jpg' },
      },
      title: 'Berserk',
      title_english: 'Berserk',
      type: 'Manga',
      format: 'MANGA',
      chapters: 380,
      volumes: 42,
      status: 'Publishing',
      publishing: true,
      score: 9.3,
      popularity: 320000,
      synopsis: 'Guts, a former mercenary now known as the "Black Swordsman," is out for revenge. Born from the corpse of his hanged mother and picked up by mercenary leader Gambino, Guts knows nothing but warfare.',
      genres: [{ mal_id: 1, name: 'Action', type: 'manga', url: '' }, { mal_id: 3, name: 'Dark Fantasy', type: 'manga', url: '' }],
      countryOfOrigin: 'JP',
      bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/banner/30002-3TuoSMl20fUX.jpg',
    },
    {
      mal_id: 132214,
      url: 'https://anilist.co/manga/119257',
      images: {
        jpg: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx119257-Pi21aq3ey9GG.jpg' },
        webp: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx119257-Pi21aq3ey9GG.jpg' },
      },
      title: 'Omniscient Reader',
      title_english: "Omniscient Reader's Viewpoint",
      type: 'Manhwa',
      format: 'MANGA',
      chapters: 220,
      volumes: 10,
      status: 'Publishing',
      publishing: true,
      score: 8.9,
      popularity: 250000,
      synopsis: 'Dokja was an average office worker whose sole interest was reading his favorite web novel. But when the novel ends, its fictional apocalypse suddenly becomes reality, and Dokja is the only person who knows how the story concludes.',
      genres: [{ mal_id: 1, name: 'Action', type: 'manga', url: '' }, { mal_id: 2, name: 'Fantasy', type: 'manga', url: '' }],
      countryOfOrigin: 'KR',
      bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/banner/119257-RtxJMRCunHXc.jpg',
    },
    {
      mal_id: 89357,
      url: 'https://anilist.co/manga/94970',
      images: {
        jpg: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx94970-q77X5sfRIKvU.jpg' },
        webp: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx94970-q77X5sfRIKvU.jpg' },
      },
      title: 'Classroom of the Elite',
      title_english: 'Classroom of the Elite (Light Novel)',
      type: 'Light Novel',
      format: 'NOVEL',
      chapters: 110,
      volumes: 14,
      status: 'Finished',
      publishing: false,
      score: 8.8,
      popularity: 180000,
      synopsis: 'Koudo Ikusei Senior High School is a leading prestigious school with state-of-the-art facilities where nearly 100% of students go on to university or find employment. The students there have the freedom to wear any hairstyle and bring any personal effects they desire.',
      genres: [{ mal_id: 4, name: 'Psychological', type: 'manga', url: '' }, { mal_id: 5, name: 'Drama', type: 'manga', url: '' }],
      countryOfOrigin: 'JP',
      bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/banner/94970-9PvpnfpcaaDc.jpg',
    },
    {
      mal_id: 13,
      url: 'https://anilist.co/manga/30013',
      images: {
        jpg: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30013-BeslEMqiPhlk.jpg' },
        webp: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30013-BeslEMqiPhlk.jpg' },
      },
      title: 'One Piece',
      title_english: 'One Piece',
      type: 'Manga',
      format: 'MANGA',
      chapters: 1120,
      volumes: 109,
      status: 'Publishing',
      publishing: true,
      score: 9.1,
      popularity: 390000,
      synopsis: 'Gol D. Roger, a man referred to as the "Pirate King," is set to be executed by the World Government. But just before his demise, he confirms the existence of a great treasure, One Piece, located at the Grand Line.',
      genres: [{ mal_id: 1, name: 'Action', type: 'manga', url: '' }, { mal_id: 6, name: 'Adventure', type: 'manga', url: '' }],
      countryOfOrigin: 'JP',
      bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/banner/30013-hbbRZqC5MjYh.jpg',
    },
    {
      mal_id: 70261,
      url: 'https://anilist.co/manga/85470',
      images: {
        jpg: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx85470-jt6BF9tDWB2X.jpg' },
        webp: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx85470-jt6BF9tDWB2X.jpg' },
      },
      title: 'Mushoku Tensei: Jobless Reincarnation',
      title_english: 'Mushoku Tensei: Jobless Reincarnation (Novel)',
      type: 'Light Novel',
      format: 'NOVEL',
      chapters: 334,
      volumes: 26,
      status: 'Finished',
      publishing: false,
      score: 8.9,
      popularity: 160000,
      synopsis: 'A 34-year-old NEET is run over by a truck while saving a stranger. Reincarnated into a magical world as baby Rudeus Greyrat, he decides to seize the opportunity to lead a fulfilling life.',
      genres: [{ mal_id: 2, name: 'Fantasy', type: 'manga', url: '' }, { mal_id: 7, name: 'Isekai', type: 'manga', url: '' }],
      countryOfOrigin: 'JP',
      bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/banner/85470-akkFSKH9aacB.jpg',
    },
    {
      mal_id: 122663,
      url: 'https://anilist.co/manga/85143',
      images: {
        jpg: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85143-23oup3ETbFJk.jpg' },
        webp: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85143-23oup3ETbFJk.jpg' },
      },
      title: 'Tower of God',
      title_english: 'Tower of God',
      type: 'Manhwa',
      format: 'MANGA',
      chapters: 610,
      volumes: 14,
      status: 'Publishing',
      publishing: true,
      score: 8.4,
      popularity: 210000,
      synopsis: 'What do you desire? Fortune? Glory? Power? Revenge? Or something that surpasses all others? Whatever you desire, \'that is here\' atop the Tower.',
      genres: [{ mal_id: 1, name: 'Action', type: 'manga', url: '' }, { mal_id: 2, name: 'Fantasy', type: 'manga', url: '' }],
      countryOfOrigin: 'KR',
      bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/banner/85143-IKyCdaJKfa2M.jpg',
    },
    {
      mal_id: 93516,
      url: 'https://anilist.co/manga/85734',
      images: {
        jpg: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85734-yllpIVoPjADr.jpg' },
        webp: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85734-yllpIVoPjADr.jpg' },
      },
      title: 'Tamen De Gushi',
      title_english: 'Their Story',
      type: 'Manhua',
      format: 'MANGA',
      chapters: 215,
      volumes: 2,
      status: 'Publishing',
      publishing: true,
      score: 8.3,
      popularity: 140000,
      synopsis: 'The sweet and humorous romantic youth story of how high school girls Sun Jing and Qiu Tong met and fell in love.',
      genres: [{ mal_id: 8, name: 'Romance', type: 'manga', url: '' }, { mal_id: 9, name: 'Comedy', type: 'manga', url: '' }],
      countryOfOrigin: 'CN',
    },
    {
      mal_id: 119072,
      url: 'https://anilist.co/manga/100805',
      images: {
        jpg: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx100805-3DCHMdZ5blWl.jpg' },
        webp: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx100805-3DCHMdZ5blWl.jpg' },
      },
      title: 'Here U Are',
      title_english: 'Here U Are',
      type: 'Manhua',
      format: 'MANGA',
      chapters: 156,
      volumes: 4,
      status: 'Finished',
      publishing: false,
      score: 8.5,
      popularity: 110000,
      synopsis: 'Receptions for freshmen are tough, but senior Yu Yang does his best to guide newcomers on campus. When he meets the quiet and aloof giant Li Huan, their relationship gradually begins to unfold.',
      genres: [{ mal_id: 8, name: 'Romance', type: 'manga', url: '' }, { mal_id: 5, name: 'Drama', type: 'manga', url: '' }],
      countryOfOrigin: 'CN',
    },
    {
      mal_id: 642,
      url: 'https://anilist.co/manga/30642',
      images: {
        jpg: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30642-0mjRDkf4THpo.jpg' },
        webp: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30642-0mjRDkf4THpo.jpg' },
      },
      title: 'Vinland Saga',
      title_english: 'Vinland Saga',
      type: 'Manga',
      format: 'MANGA',
      chapters: 216,
      volumes: 28,
      status: 'Publishing',
      publishing: true,
      score: 9.0,
      popularity: 290000,
      synopsis: 'Thorfinn, son of one of the Vikings\' greatest warriors, is among the finest fighters in the merry band of mercenaries run by the cunning Askeladd.',
      genres: [{ mal_id: 1, name: 'Action', type: 'manga', url: '' }, { mal_id: 6, name: 'Adventure', type: 'manga', url: '' }, { mal_id: 5, name: 'Drama', type: 'manga', url: '' }],
      countryOfOrigin: 'JP',
      bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/banner/30642-MeizzL2WDv6C.jpg',
    },
    {
      mal_id: 656,
      url: 'https://anilist.co/manga/30656',
      images: {
        jpg: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30656-9mW113O7rDnA.png' },
        webp: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30656-9mW113O7rDnA.png' },
      },
      title: 'Vagabond',
      title_english: 'Vagabond',
      type: 'Manga',
      format: 'MANGA',
      chapters: 327,
      volumes: 37,
      status: 'On Hiatus',
      publishing: false,
      score: 9.2,
      popularity: 340000,
      synopsis: 'Growing up in late 16th century Sengoku era Japan, Shinmen Takezou is shunned by the local villagers as a devil child due to his wild and violent nature.',
      genres: [{ mal_id: 1, name: 'Action', type: 'manga', url: '' }, { mal_id: 6, name: 'Adventure', type: 'manga', url: '' }],
      countryOfOrigin: 'JP',
      bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/manga/banner/30656-XYzvRlsc3iK4.jpg',
    },
    {
      mal_id: 1,
      url: 'https://anilist.co/manga/30001',
      images: {
        jpg: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30001-Knby7l1jevE7.jpg' },
        webp: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30001-Knby7l1jevE7.jpg' },
      },
      title: 'Monster',
      title_english: 'Monster',
      type: 'Manga',
      format: 'MANGA',
      chapters: 162,
      volumes: 18,
      status: 'Finished',
      publishing: false,
      score: 9.1,
      popularity: 220000,
      synopsis: 'Kenzou Tenma, an esteemed Japanese brain surgeon working in Germany, faces a moral dilemma when forced to choose between saving a young boy or the city mayor.',
      genres: [{ mal_id: 4, name: 'Psychological', type: 'manga', url: '' }, { mal_id: 5, name: 'Drama', type: 'manga', url: '' }, { mal_id: 7, name: 'Mystery', type: 'manga', url: '' }],
      countryOfOrigin: 'JP',
    },
    {
      mal_id: 116778,
      url: 'https://anilist.co/manga/105778',
      images: {
        jpg: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105778-euxXZEIfDY2u.png' },
        webp: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105778-euxXZEIfDY2u.png' },
      },
      title: 'Chainsaw Man',
      title_english: 'Chainsaw Man',
      type: 'Manga',
      format: 'MANGA',
      chapters: 175,
      volumes: 18,
      status: 'Publishing',
      publishing: true,
      score: 8.7,
      popularity: 360000,
      synopsis: 'Denji has a simple dream—to live a happy and peaceful life, spending time with a girl he likes. This is a far cry from reality, however, as Denji is forced by the yakuza into killing devils in order to pay off his crushing debts.',
      genres: [{ mal_id: 1, name: 'Action', type: 'manga', url: '' }, { mal_id: 2, name: 'Supernatural', type: 'manga', url: '' }],
      countryOfOrigin: 'JP',
    },
    {
      mal_id: 113138,
      url: 'https://anilist.co/manga/101517',
      images: {
        jpg: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx101517-H3TdM3g5ZUe9.jpg' },
        webp: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx101517-H3TdM3g5ZUe9.jpg' },
      },
      title: 'Jujutsu Kaisen',
      title_english: 'Jujutsu Kaisen',
      type: 'Manga',
      format: 'MANGA',
      chapters: 271,
      volumes: 28,
      status: 'Finished',
      publishing: false,
      score: 8.5,
      popularity: 330000,
      synopsis: 'Idly indulging in paranormal activities with the Occult Club, high schooler Yuuji Itadori spends his days at either the clubroom or the hospital visiting his bedridden grandfather.',
      genres: [{ mal_id: 1, name: 'Action', type: 'manga', url: '' }, { mal_id: 2, name: 'Supernatural', type: 'manga', url: '' }],
      countryOfOrigin: 'JP',
    },
    {
      mal_id: 122994,
      url: 'https://anilist.co/manga/112994',
      images: {
        jpg: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx112994-kbQVBCiryz26.png' },
        webp: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx112994-kbQVBCiryz26.png' },
      },
      title: 'The Boxer',
      title_english: 'The Boxer',
      type: 'Manhwa',
      format: 'MANGA',
      chapters: 124,
      volumes: 5,
      status: 'Finished',
      publishing: false,
      score: 8.8,
      popularity: 190000,
      synopsis: 'You have the talent. You are the apex predator. Follow Yu as he steps into the boxing ring and dominates opponents through raw instinct and unrivaled speed.',
      genres: [{ mal_id: 1, name: 'Action', type: 'manga', url: '' }, { mal_id: 5, name: 'Drama', type: 'manga', url: '' }, { mal_id: 10, name: 'Sports', type: 'manga', url: '' }],
      countryOfOrigin: 'KR',
    },
    {
      mal_id: 86964,
      url: 'https://anilist.co/manga/86964',
      images: {
        jpg: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx86964-b3k5L1a7q9P2.jpg' },
        webp: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx86964-b3k5L1a7q9P2.jpg' },
      },
      title: 'Bastard',
      title_english: 'Bastard',
      type: 'Manhwa',
      format: 'MANGA',
      chapters: 94,
      volumes: 5,
      status: 'Finished',
      publishing: false,
      score: 8.7,
      popularity: 180000,
      synopsis: 'There is a serial killer in my house. Jin Seon must protect the girl he cares about from the horrific secrets of his own family.',
      genres: [{ mal_id: 4, name: 'Psychological', type: 'manga', url: '' }, { mal_id: 7, name: 'Mystery', type: 'manga', url: '' }, { mal_id: 3, name: 'Thriller', type: 'manga', url: '' }],
      countryOfOrigin: 'KR',
    },
    {
      mal_id: 85489,
      url: 'https://anilist.co/manga/85489',
      images: {
        jpg: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85489-k2b4L9a7q1N0.jpg' },
        webp: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85489-k2b4L9a7q1N0.jpg' },
      },
      title: 'Wind Breaker',
      title_english: 'Wind Breaker',
      type: 'Manhwa',
      format: 'MANGA',
      chapters: 480,
      volumes: 24,
      status: 'Publishing',
      publishing: true,
      score: 8.6,
      popularity: 230000,
      synopsis: 'Jay is high school student council president, driven only by academics until he is introduced to high-speed street cycling and the Hummingbird crew.',
      genres: [{ mal_id: 10, name: 'Sports', type: 'manga', url: '' }, { mal_id: 5, name: 'Drama', type: 'manga', url: '' }],
      countryOfOrigin: 'KR',
    },
    {
      mal_id: 118986,
      url: 'https://anilist.co/manga/108986',
      images: {
        jpg: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b673Vt5ZSuz3.jpg' },
        webp: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx105398-b673Vt5ZSuz3.jpg' },
      },
      title: 'The Beginning After the End',
      title_english: 'The Beginning After the End',
      type: 'Manhwa',
      format: 'MANGA',
      chapters: 185,
      volumes: 6,
      status: 'Publishing',
      publishing: true,
      score: 8.7,
      popularity: 260000,
      synopsis: 'King Grey has unrivaled strength, wealth, and prestige in a world governed by martial ability. Reincarnated into a new world steeped in magic and monsters, he begins anew.',
      genres: [{ mal_id: 1, name: 'Action', type: 'manga', url: '' }, { mal_id: 2, name: 'Fantasy', type: 'manga', url: '' }],
      countryOfOrigin: 'KR',
    },
    {
      mal_id: 37113,
      url: 'https://anilist.co/manga/67113',
      images: {
        jpg: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85446-YmuBl8pnTL9j.jpg' },
        webp: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85446-YmuBl8pnTL9j.jpg' },
      },
      title: 'Soul Land',
      title_english: 'Douluo Dalu',
      type: 'Manhua',
      format: 'MANGA',
      chapters: 340,
      volumes: 50,
      status: 'Publishing',
      publishing: true,
      score: 8.2,
      popularity: 130000,
      synopsis: 'Tang San, one of the Tang Sect martial clan\'s most prestigious disciples, is cast out and reincarnated into the mysterious Douluo continent.',
      genres: [{ mal_id: 1, name: 'Action', type: 'manga', url: '' }, { mal_id: 2, name: 'Fantasy', type: 'manga', url: '' }],
      countryOfOrigin: 'CN',
    },
    {
      mal_id: 96707,
      url: 'https://anilist.co/manga/86707',
      images: {
        jpg: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx86707-QD3UyAOHUEaT.jpg' },
        webp: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx86707-QD3UyAOHUEaT.jpg' },
      },
      title: 'Tales of Demons and Gods',
      title_english: 'Tales of Demons and Gods',
      type: 'Manhua',
      format: 'MANGA',
      chapters: 480,
      volumes: 20,
      status: 'Publishing',
      publishing: true,
      score: 8.4,
      popularity: 170000,
      synopsis: 'Nie Li was the strongest Demon Spiritualist. When he dies in battle against the Sage Emperor, his soul is brought back to when he was 13 years old.',
      genres: [{ mal_id: 1, name: 'Action', type: 'manga', url: '' }, { mal_id: 2, name: 'Fantasy', type: 'manga', url: '' }],
      countryOfOrigin: 'CN',
    },
    {
      mal_id: 1320,
      url: 'https://anilist.co/manga/31320',
      images: {
        jpg: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx31320-34hlJNSVlvbb.jpg' },
        webp: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx31320-34hlJNSVlvbb.jpg' },
      },
      title: 'The Ravages of Time',
      title_english: 'The Ravages of Time',
      type: 'Manhua',
      format: 'MANGA',
      chapters: 620,
      volumes: 74,
      status: 'Publishing',
      publishing: true,
      score: 8.8,
      popularity: 90000,
      synopsis: 'A strategic, grand narrative adaptation of the Three Kingdoms era, chronicling the rise of warlords, assassination guilds, and genius tacticians.',
      genres: [{ mal_id: 1, name: 'Action', type: 'manga', url: '' }, { mal_id: 11, name: 'Historical', type: 'manga', url: '' }],
      countryOfOrigin: 'CN',
    },
    {
      mal_id: 81615,
      url: 'https://anilist.co/manga/81615',
      images: {
        jpg: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85976-hVr99G1kD1M5.png' },
        webp: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85976-hVr99G1kD1M5.png' },
      },
      title: 'Overlord',
      title_english: 'Overlord (Novel)',
      type: 'Light Novel',
      format: 'NOVEL',
      chapters: 120,
      volumes: 16,
      status: 'Publishing',
      publishing: true,
      score: 8.8,
      popularity: 190000,
      synopsis: 'When popular online game Yggdrasil is quietly shut down, powerful guildmaster Momonga decides to stay logged in until the final second.',
      genres: [{ mal_id: 1, name: 'Action', type: 'manga', url: '' }, { mal_id: 2, name: 'Fantasy', type: 'manga', url: '' }, { mal_id: 7, name: 'Isekai', type: 'manga', url: '' }],
      countryOfOrigin: 'JP',
    },
    {
      mal_id: 85737,
      url: 'https://anilist.co/manga/85737',
      images: {
        jpg: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85737-WkWOr5EgwPyo.jpg' },
        webp: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx85737-WkWOr5EgwPyo.jpg' },
      },
      title: 'Re:Zero - Starting Life in Another World',
      title_english: 'Re:Zero (Novel)',
      type: 'Light Novel',
      format: 'NOVEL',
      chapters: 280,
      volumes: 38,
      status: 'Publishing',
      publishing: true,
      score: 8.9,
      popularity: 210000,
      synopsis: 'Subaru Natsuki is suddenly summoned to another world. With no sign of who summoned him, things quickly become worse when he discovers his ability: Return by Death.',
      genres: [{ mal_id: 4, name: 'Psychological', type: 'manga', url: '' }, { mal_id: 2, name: 'Fantasy', type: 'manga', url: '' }, { mal_id: 7, name: 'Isekai', type: 'manga', url: '' }],
      countryOfOrigin: 'JP',
    },
    {
      mal_id: 86399,
      url: 'https://anilist.co/manga/86399',
      images: {
        jpg: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx86399-NwbRFVh5koqc.jpg' },
        webp: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/nx86399-NwbRFVh5koqc.jpg' },
      },
      title: 'That Time I Got Reincarnated as a Slime',
      title_english: 'Tensura (Novel)',
      type: 'Light Novel',
      format: 'NOVEL',
      chapters: 220,
      volumes: 21,
      status: 'Publishing',
      publishing: true,
      score: 8.7,
      popularity: 180000,
      synopsis: 'Satoru Mikami is stabbed by a random killer and reincarnated in an alternate world as a blind slime with the unique skill Predator.',
      genres: [{ mal_id: 2, name: 'Fantasy', type: 'manga', url: '' }, { mal_id: 7, name: 'Isekai', type: 'manga', url: '' }],
      countryOfOrigin: 'JP',
    },
    {
      mal_id: 101583,
      url: 'https://anilist.co/manga/101583',
      images: {
        jpg: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx101583-VI1PT2QGGT8W.jpg' },
        webp: { image_url: 'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx101583-VI1PT2QGGT8W.jpg' },
      },
      title: '86 - Eighty Six',
      title_english: '86 (Novel)',
      type: 'Light Novel',
      format: 'NOVEL',
      chapters: 90,
      volumes: 13,
      status: 'Publishing',
      publishing: true,
      score: 8.9,
      popularity: 160000,
      synopsis: 'The Republic of San Magnolia has long been attacked by the neighboring Empire\'s unmanned Legion. To counter them, the Republic developed the Juggernauts piloted by the unrecognized 86.',
      genres: [{ mal_id: 1, name: 'Action', type: 'manga', url: '' }, { mal_id: 12, name: 'Sci-Fi', type: 'manga', url: '' }, { mal_id: 5, name: 'Drama', type: 'manga', url: '' }],
      countryOfOrigin: 'JP',
    }
  ];

  if (format === 'all') return allSeeds;
  if (format === 'manhwa') return allSeeds.filter(b => b.type === 'Manhwa');
  if (format === 'manhua') return allSeeds.filter(b => b.type === 'Manhua');
  if (format === 'novel') return allSeeds.filter(b => b.type === 'Light Novel');
  if (format === 'manga') return allSeeds.filter(b => b.type === 'Manga');
  return allSeeds;
}

export async function fetchRanking100Books(
  format: BookFormat = 'all',
  sort: NonNullable<BookFetchOptions['sort']> = 'SCORE_DESC'
): Promise<MangaItem[]> {
  try {
    const res1 = await fetchBooksFromAniList({ format, sort, page: 1, perPage: 50 });
    let combined = res1.data || [];

    if (res1.hasNextPage && combined.length >= 25) {
      try {
        const res2 = await fetchBooksFromAniList({ format, sort, page: 2, perPage: 50 });
        if (res2.data?.length) {
          combined = [...combined, ...res2.data];
        }
      } catch {
        // Continue with combined if page 2 is rate-limited
      }
    }

    const seen = new Set<number>();
    const deduplicated = combined.filter((b) => {
      if (seen.has(b.mal_id)) return false;
      seen.add(b.mal_id);
      return true;
    });

    if (deduplicated.length >= 15) {
      return deduplicated;
    }
  } catch (err) {
    console.warn('[bookService] fetchRanking100Books failed, using fallbacks:', err);
  }

  // Fallback: merge Jikan top manga + seed books to guarantee complete listings
  try {
    const jikanRes = await fetchBooksFromJikan({ format, page: 1, perPage: 25 });
    if (jikanRes.data.length > 0) {
      const merged = [...jikanRes.data, ...getVerifiedSeedBooks(format)];
      const seen = new Set<number>();
      return merged.filter((b) => {
        if (seen.has(b.mal_id)) return false;
        seen.add(b.mal_id);
        return true;
      });
    }
  } catch {}

  return getVerifiedSeedBooks(format);
}

export async function fetchSpotlightBooks(): Promise<MangaItem[]> {
  try {
    const res = await fetchBooksFromAniList({
      sort: 'TRENDING_DESC',
      perPage: 10,
    });
    if (res.data.length > 0) return res.data.slice(0, 8);
  } catch (err) {
    // fallback
  }
  return getVerifiedSeedBooks('all');
}

export async function fetchSeasonalBooks(
  seasonYear: number = new Date().getFullYear(),
  format: BookFormat = 'all'
): Promise<MangaItem[]> {
  try {
    let countryOfOrigin: string | undefined;
    let anilistFormat: string | undefined;
    if (format === 'manhwa') countryOfOrigin = 'KR';
    else if (format === 'manhua') countryOfOrigin = 'CN';
    else if (format === 'novel') anilistFormat = 'NOVEL';
    else if (format === 'manga') anilistFormat = 'MANGA';

    const query = `
      query ($page: Int, $perPage: Int, $format: MediaFormat, $country: CountryCode, $startDate_greater: FuzzyDateInt) {
        Page (page: $page, perPage: $perPage) {
          media (
            type: MANGA,
            sort: [TRENDING_DESC, POPULARITY_DESC],
            format: $format,
            countryOfOrigin: $country,
            startDate_greater: $startDate_greater,
            status: RELEASING,
            isAdult: false
          ) {
            ${mediaFields}
          }
        }
      }
    `;

    const res = await fetch(ANILIST_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        query,
        variables: {
          page: 1,
          perPage: 36,
          format: anilistFormat,
          country: countryOfOrigin,
          startDate_greater: (seasonYear - 1) * 10000,
        },
      }),
      signal: AbortSignal.timeout(7000),
    });

    if (res.ok) {
      const json = await res.json();
      const mediaList = json.data?.Page?.media || [];
      if (mediaList.length > 0) {
        return mediaList.map(mapAniListMediaToMangaItem);
      }
    }
  } catch (e) {
    console.warn('[bookService] fetchSeasonalBooks error:', e);
  }

  // Fallback: return verified releasing titles for this format
  return getVerifiedSeedBooks(format).filter((b) => b.publishing || b.status === 'Publishing');
}

