
import { supabase, isSupabaseConfigured } from './supabase';
import { AnimeItem, JikanPagination } from '../src/types';
import { serverSearchAnime as jikanSearch, serverGetAnimeDetails as jikanGetById, serverGetTopAnime, serverGetSeasonalAnime, serverGetUpcomingAnime } from './jikanService';
import { ingestAnimeList } from './ingestionService';

export async function getCatalogTopAnime(filter: string = 'bypopularity', page: number = 1, limit: number = 24): Promise<{ data: AnimeItem[], pagination: JikanPagination }> {
  console.log('getCatalogTopAnime called, isSupabaseConfigured:', isSupabaseConfigured);
  if (!isSupabaseConfigured) {
    if (filter === 'airing') return await serverGetSeasonalAnime(page, limit) as any;
    if (filter === 'upcoming') return await serverGetUpcomingAnime(page, limit) as any;
    return await serverGetTopAnime(filter, page, limit) as any;
  }

  const offset = (page - 1) * limit;
  let query = supabase.from('anime').select('*', { count: 'exact' });

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
    console.error('getCatalogTopAnime error:', error);
    return { data: [], pagination: { last_visible_page: 1, has_next_page: false, current_page: 1, items: { count: 0, total: 0, per_page: limit } } };
  }

  // TODO: genres fetching
  return {
    data: data as any[],
    pagination: {
      last_visible_page: Math.ceil((count || 0) / limit),
      has_next_page: offset + limit < (count || 0),
      current_page: page,
      items: { count: data?.length || 0, total: count || 0, per_page: limit }
    }
  };
}

export async function searchCatalogAnime(options: any): Promise<{ data: AnimeItem[], pagination: JikanPagination }> {
  if (!isSupabaseConfigured) return await jikanSearch(options) as any;
  
  const page = Math.max(Number(options.page) || 1, 1);
  const limit = Math.min(Math.max(Number(options.limit) || 24, 1), 25);
  const offset = (page - 1) * limit;
  const clean = options.query?.trim() || '';

  let query = supabase.from('anime').select('*', { count: 'exact' });

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

  if (options.orderBy === 'score') {
    query = query.order('score', { ascending: options.sort === 'asc', nullsFirst: false });
  } else if (options.orderBy === 'popularity') {
    query = query.order('popularity', { ascending: options.sort !== 'desc', nullsFirst: false });
  } else if (options.orderBy === 'title') {
    query = query.order('title', { ascending: options.sort !== 'desc' });
  } else if (options.orderBy === 'start_date') {
    query = query.order('year', { ascending: options.sort === 'asc', nullsFirst: false });
  } else {
    query = query.order('popularity', { ascending: true, nullsFirst: false });
  }

  const { data, count, error } = await query.range(offset, offset + limit - 1);
  
  if (error) {
    console.error('searchCatalogAnime error:', error);
  }

  if ((!data || data.length === 0) && clean && page === 1) {
    console.log('[Catalog] Local search empty, falling back to Jikan:', clean);
    const jikanResult = await jikanSearch(options);
    if (jikanResult.data && jikanResult.data.length > 0) {
      ingestAnimeList(jikanResult.data).catch(err => console.error('Fallback ingestion error:', err));
      return {
        data: jikanResult.data,
        pagination: jikanResult.pagination || { last_visible_page: 1, has_next_page: false, current_page: 1, items: { count: jikanResult.data.length, total: jikanResult.data.length, per_page: limit } }
      };
    }
  }

  return {
    data: (data || []) as any[],
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
  const { data, error } = await supabase.from('anime').select('*').eq('mal_id', id).single();
  
  if (data) {
    return { data: data as any };
  }

  const jikanRes = await jikanGetById(id);
  if (jikanRes) {
    ingestAnimeList([jikanRes]).catch(() => {});
    return { data: jikanRes };
  }

  return { data: null };
}
