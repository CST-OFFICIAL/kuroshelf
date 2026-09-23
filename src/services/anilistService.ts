import { AnimeItem, JikanPagination } from '../types';
import { isNsfwOrAdultClient } from './directJikanFallback';

const ANILIST_GRAPHQL_URL = 'https://graphql.anilist.co';

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
    score: media.averageScore ? Number((media.averageScore / 10).toFixed(2)) : 0,
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
  page?: number;
  perPage?: number;
}): Promise<{ data: AnimeItem[]; pagination: JikanPagination }> {
  const page = options.page || 1;
  const perPage = options.perPage || 24;

  const query = `
    query ($page: Int, $perPage: Int, $sort: [MediaSort], $season: MediaSeason, $seasonYear: Int, $status: MediaStatus, $search: String) {
      Page (page: $page, perPage: $perPage) {
        pageInfo {
          total
          currentPage
          lastPage
          hasNextPage
          perPage
        }
        media (type: ANIME, sort: $sort, season: $season, seasonYear: $seasonYear, status: $status, search: $search, isAdult: false) {
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
  if (options.search) variables.search = options.search;

  const response = await fetch(ANILIST_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`AniList returned status ${response.status}`);
  }

  const json = await response.json();
  const pageData = json.data?.Page;
  const mediaList = pageData?.media || [];

  const animeList = mediaList
    .map(mapAniListMediaToAnimeItem)
    .filter((item: AnimeItem) => !isNsfwOrAdultClient(item));

  return {
    data: animeList,
    pagination: {
      last_visible_page: pageData?.pageInfo?.lastPage || 1,
      has_next_page: Boolean(pageData?.pageInfo?.hasNextPage),
      current_page: pageData?.pageInfo?.currentPage || 1,
      items: {
        count: animeList.length,
        total: pageData?.pageInfo?.total || animeList.length,
        per_page: perPage,
      },
    },
  };
}
