
import { supabase, isSupabaseConfigured } from './supabase';
import { AnimeItem, JikanPagination } from '../src/types';
import { serverSearchAnime as jikanSearch, serverGetAnimeDetails as jikanGetById, serverGetTopAnime, serverGetSeasonalAnime, serverGetUpcomingAnime } from './jikanService';
import { ingestAnimeList } from './ingestionService';


function mapDbToAnime(row: any): AnimeItem {
  let mappedGenres = [];
  if (row.anime_genres && Array.isArray(row.anime_genres)) {
    mappedGenres = row.anime_genres.map((ag) => ag.genres).filter(Boolean);
  }
  return {
    ...row,
    genres: mappedGenres.length > 0 ? mappedGenres : (row.genres || []),
    images: row.images_json,
    trailer: {
      url: row.trailer_url,
      images: row.trailer_images_json
    },
    broadcast: {
      day: row.broadcast_day,
      time: row.broadcast_time,
      timezone: row.broadcast_timezone,
      string: row.broadcast_string
    }
  };
}

export async function getCatalogTopAnime(filter: string = 'bypopularity', page: number = 1, limit: number = 24): Promise<{ data: AnimeItem[], pagination: JikanPagination }> {
  console.log('getCatalogTopAnime called, isSupabaseConfigured:', isSupabaseConfigured);
  if (!isSupabaseConfigured) {
    if (filter === 'airing') return await serverGetSeasonalAnime(page, limit) as any;
    if (filter === 'upcoming') return await serverGetUpcomingAnime(page, limit) as any;
    return await serverGetTopAnime(filter, page, limit) as any;
  }

  const offset = (page - 1) * limit;
  let query = supabase.from('anime').select('*, anime_genres(genres(*))', { count: 'exact' });

  if (filter === 'airing') {
    query = query.eq('status', 'Currently Airing').order('score', { ascending: false, nullsFirst: false });
  } else if (filter === 'upcoming') {
    query = query.eq('status', 'Not yet aired').order('popularity', { ascending: true });
  } else if (filter === 'favorite') {
    query = query.order('score', { ascending: false, nullsFirst: false });
  } else {
    query = query.order('popularity', { ascending: true });
  }

  const { data, count, error } = await query.range(offset, offset + limit - 1);
  if (error) {
    console.log('[Error suppressed]', 'getCatalogTopAnime error:', error);
  }

  // Fallback to Jikan if Supabase DB is missing items for this page
  if (!data || data.length < limit) {
    try {
      console.log(`[Catalog] Local DB has ${data?.length || 0} items for filter '${filter}' page ${page}, falling back to Jikan...`);
      let jikanResult;
      if (filter === 'airing') {
        jikanResult = await serverGetSeasonalAnime(page, limit);
      } else if (filter === 'upcoming') {
        jikanResult = await serverGetUpcomingAnime(page, limit);
      } else {
        jikanResult = await serverGetTopAnime(filter, page, limit);
      }
      
      if (jikanResult && jikanResult.data && jikanResult.data.length > 0) {
        // Background ingestion
        ingestAnimeList(jikanResult.data).catch(err => console.log('[Error suppressed]', 'Fallback ingestion error:', err));
        return {
          data: jikanResult.data as any[],
          pagination: jikanResult.pagination || { last_visible_page: page + (jikanResult.data.length === limit ? 1 : 0), has_next_page: jikanResult.data.length === limit, current_page: page, items: { count: jikanResult.data.length, total: 10000, per_page: limit } }
        };
      }
    } catch (err) {
      console.log('[Error suppressed]', '[Catalog] Jikan API fallback failed in top anime:', err.message);
    }
  }

  // TODO: genres fetching
  return {
    data: (data || []).map(mapDbToAnime) as any[],
    pagination: {
      last_visible_page: Math.ceil((count || 0) / limit),
      has_next_page: offset + limit < (count || 0),
      current_page: page,
      items: { count: data?.length || 0, total: count || 0, per_page: limit }
    }
  };
}

export async function searchCatalogAnime(options: any): Promise<{ data: AnimeItem[], pagination: JikanPagination }> {
  const page = Math.max(Number(options.page) || 1, 1);
  const limit = Math.min(Math.max(Number(options.limit) || 24, 1), 25);
  const offset = (page - 1) * limit;
  const clean = options.query?.trim() || '';

  if (!isSupabaseConfigured) {
    return { data: [], pagination: { last_visible_page: 1, has_next_page: false, current_page: 1, items: { count: 0, total: 0, per_page: limit } } };
  }
  
  let query;
  if (options.genres && options.genres !== 'all') {
    query = supabase.from('anime').select('*, anime_genres!inner(genres!inner(*))', { count: 'exact' });
    query = query.eq('anime_genres.genres.mal_id', Number(options.genres));
  } else {
    query = supabase.from('anime').select('*, anime_genres(genres(*))', { count: 'exact' });
  }

  if (clean) {
    query = query.or(`title.ilike.%${clean}%,title_english.ilike.%${clean}%,title_japanese.ilike.%${clean}%`);
  }
  
  if (options.status && options.status !== 'all') {
    if (options.status === 'airing') query = query.eq('status', 'Currently Airing');
    else if (options.status === 'complete') query = query.eq('status', 'Finished Airing');
    else if (options.status === 'upcoming') query = query.eq('status', 'Not yet aired');
  }

  if (options.type && options.type !== 'all') {
    query = query.eq('type', options.type);
  }

  // Handle orderBy mapping
  if (options.orderBy === 'score') {
    query = query.order('score', { ascending: options.sort === 'asc', nullsFirst: false });
  } else if (options.orderBy === 'popularity') {
    query = query.order('popularity', { ascending: options.sort === 'asc' });
  } else if (options.orderBy === 'favorites') {
    query = query.order('favorites', { ascending: options.sort === 'asc', nullsFirst: false });
  } else {
    // Default fallback
    query = query.order('popularity', { ascending: true });
  }

  query = query.range(offset, offset + limit - 1);
  
  const { data, count, error } = await query;
  if (error && error.code !== 'PGRST103') { // PGRST103 is Requested range not satisfiable
    console.log('[Catalog] searchCatalogAnime DB query error:', error.message);
  }

  // If local DB is empty, trigger Live API fallback for queries and genre searches
  if ((clean || options.genres !== 'all') && (!data || data.length === 0)) {
     try {
       console.log('[Catalog] Local DB search empty, triggering live API ingestion...');
       const jikanResult = await jikanSearch(options);
       if (jikanResult.data && jikanResult.data.length > 0) {
         ingestAnimeList(jikanResult.data).catch(() => {});
         return jikanResult as any;
       }
     } catch (err) {
       // Live API failed (rate limits), silent fallback to empty array
     }
  }

  return {
    data: (data || []).map(mapDbToAnime) as any[],
    pagination: {
      last_visible_page: Math.ceil((count || 0) / limit),
      has_next_page: offset + limit < (count || 0),
      current_page: page,
      items: { count: data?.length || 0, total: count || 0, per_page: limit }
    }
  };
}

export async function getCatalogAnimeById(id: number): Promise<{ data: BaseJikanAnime | null }> {
  if (!isSupabaseConfigured) return { data: await jikanGetById(id) as any };
  const { data, error } = await supabase.from('anime').select('*, anime_genres(genres(*))').eq('mal_id', id).single();
  
  if (data) {
    return { data: mapDbToAnime(data) as any };
  }

  const jikanRes = await jikanGetById(id);
  if (jikanRes) {
    ingestAnimeList([jikanRes]).catch(() => {});
    return { data: jikanRes };
  }

  return { data: null };
}
