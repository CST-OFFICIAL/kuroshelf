
import { supabase, isSupabaseConfigured } from './supabase';
import { AnimeItem, JikanPagination } from '../src/types';
import { serverSearchAnime as jikanSearch, serverGetAnimeDetails as jikanGetById, serverGetTopAnime, serverGetSeasonalAnime, serverGetUpcomingAnime, isNsfwOrAdult, resolveGenreInfo } from './jikanService';
import { ingestAnimeList } from './ingestionService';
import { cleanOfficialText } from './officialSynopsisService';


function mapDbToAnime(row: any): AnimeItem {
  let mappedGenres = [];
  if (row.anime_genres && Array.isArray(row.anime_genres)) {
    mappedGenres = row.anime_genres.map((ag) => ag.genres).filter(Boolean);
  }
  let mappedStudios = [];
  if (row.anime_studios && Array.isArray(row.anime_studios)) {
    mappedStudios = row.anime_studios.map(as => as.studios).filter(Boolean);
  }

  let mappedStreaming = [];
  if (row.anime_streaming && Array.isArray(row.anime_streaming)) {
    mappedStreaming = row.anime_streaming.map(as => ({
      name: as.streaming_providers?.name || 'Unknown',
      url: as.url
    })).filter(Boolean);
  }

  return {
    ...row,
    synopsis: cleanOfficialText(row.synopsis) || row.synopsis,
    genres: mappedGenres.length > 0 ? mappedGenres : (row.genres || []),
    studios: mappedStudios.length > 0 ? mappedStudios : (row.studios || []),
    streaming: mappedStreaming.length > 0 ? mappedStreaming : (row.streaming || []),
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
  let query = supabase.from('anime').select('*, anime_genres(genres(*)), anime_studios(studios(*)), anime_streaming(url, streaming_providers(name))', { count: 'exact' });

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
        ingestAnimeList(jikanResult.data as any).catch(err => console.log('[Error suppressed]', 'Fallback ingestion error:', err));
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
    data: (data || []).filter(item => !isNsfwOrAdult(item)).map(mapDbToAnime) as any[],
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
    try {
      const liveRes = await jikanSearch(options);
      return {
        data: (liveRes?.data || []).filter((item: any) => !isNsfwOrAdult(item)),
        pagination: liveRes?.pagination || {
          last_visible_page: 1,
          has_next_page: false,
          current_page: page,
          items: { count: liveRes?.data?.length || 0, total: liveRes?.data?.length || 0, per_page: limit }
        }
      };
    } catch {
      return { data: [], pagination: { last_visible_page: 1, has_next_page: false, current_page: 1, items: { count: 0, total: 0, per_page: limit } } };
    }
  }
  
  let query;
  if (options.genres && options.genres !== 'all') {
    const genreTokens = String(options.genres).split(',').map(s => s.trim()).filter(Boolean);
    const resolvedMalIds: number[] = [];
    const resolvedNames: string[] = [];

    genreTokens.forEach(token => {
      const meta = resolveGenreInfo(token);
      if (meta && meta.mal_id > 0) {
        resolvedMalIds.push(meta.mal_id);
      }
      if (meta && meta.name) {
        resolvedNames.push(meta.name);
      } else if (isNaN(Number(token))) {
        resolvedNames.push(token);
      }
    });

    query = supabase.from('anime').select('*, anime_genres!inner(genres!inner(*)), anime_studios(studios(*)), anime_streaming(url, streaming_providers(name))', { count: 'exact' });

    if (resolvedMalIds.length > 0) {
      if (resolvedMalIds.length === 1) {
        query = query.eq('anime_genres.genres.mal_id', resolvedMalIds[0]);
      } else {
        query = query.in('anime_genres.genres.mal_id', resolvedMalIds);
      }
    } else if (resolvedNames.length > 0) {
      query = query.ilike('anime_genres.genres.name', `%${resolvedNames[0]}%`);
    }
  } else {
    query = supabase.from('anime').select('*, anime_genres(genres(*)), anime_studios(studios(*)), anime_streaming(url, streaming_providers(name))', { count: 'exact' });
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

  const localItems: AnimeItem[] = (data || []).filter(item => !isNsfwOrAdult(item)).map(mapDbToAnime) as any[];

  // If local DB is empty or has fewer items than limit for a search/genre query, trigger Live API fallback to supplement!
  const hasSearchOrFilter = Boolean(clean || (options.genres && options.genres !== 'all') || (options.status && options.status !== 'all') || (options.type && options.type !== 'all'));
  if (hasSearchOrFilter && localItems.length < limit) {
     try {
       console.log('[Catalog] Local DB results sparse (' + localItems.length + '/' + limit + '), triggering live API fallback...');
       const jikanResult = await jikanSearch(options);
       if (jikanResult.data && jikanResult.data.length > 0) {
         // Ingest in background
         ingestAnimeList(jikanResult.data as any).catch(() => {});
         
         const existingIds = new Set(localItems.map(item => item.mal_id));
         const safeFallbackItems = (jikanResult.data as any[])
           .filter(item => !isNsfwOrAdult(item) && !existingIds.has(item.mal_id));

         const combinedItems = [...localItems, ...safeFallbackItems].slice(0, limit);
         return {
           data: combinedItems,
           pagination: {
             last_visible_page: Math.max(Math.ceil(((count || 0) + safeFallbackItems.length) / limit), 1),
             has_next_page: jikanResult.pagination?.has_next_page || combinedItems.length === limit,
             current_page: page,
             items: { count: combinedItems.length, total: Math.max(count || 0, combinedItems.length), per_page: limit }
           }
         };
       }
     } catch (err) {
       // Live API failed (rate limits), silent fallback to existing local items
     }
  }

  return {
    data: localItems,
    pagination: {
      last_visible_page: Math.ceil((count || 0) / limit),
      has_next_page: offset + limit < (count || 0),
      current_page: page,
      items: { count: localItems.length, total: count || 0, per_page: limit }
    }
  };
}

export async function getCatalogAnimeById(id: number): Promise<{ data: AnimeItem | null }> {
  if (id === 34246) return { data: null };
  if (!isSupabaseConfigured) {
    const live = await jikanGetById(id);
    if (!live || isNsfwOrAdult(live)) return { data: null };
    return { data: live as any };
  }
  const { data, error } = await supabase.from('anime').select('*, anime_genres(genres(*)), anime_studios(studios(*)), anime_streaming(url, streaming_providers(name))').eq('mal_id', id).single();
  
  if (data) {
    if (isNsfwOrAdult(data)) return { data: null };
    let mapped = mapDbToAnime(data);
    // If genres or streaming are missing, fetch live from Jikan to backfill
    if (!mapped.genres || mapped.genres.length === 0 || !mapped.streaming || mapped.streaming.length === 0) {
      try {
        const jikanRes = await jikanGetById(id);
        if (jikanRes && !isNsfwOrAdult(jikanRes)) {
          if ((!mapped.genres || mapped.genres.length === 0) && jikanRes.genres && jikanRes.genres.length > 0) {
            mapped.genres = jikanRes.genres;
          }
          if (jikanRes.themes && jikanRes.themes.length > 0) {
            mapped.themes = jikanRes.themes;
          }
          if (jikanRes.demographics && jikanRes.demographics.length > 0) {
            mapped.demographics = jikanRes.demographics;
          }
          if (jikanRes.streaming && jikanRes.streaming.length > 0) {
            mapped.streaming = jikanRes.streaming;
          }
          // Fire and forget ingestion update
          ingestAnimeList([jikanRes] as any).catch(() => {});
        }
      } catch (e) {}
    }
    return { data: mapped as any };
  }

  const jikanRes = await jikanGetById(id);
  if (jikanRes && !isNsfwOrAdult(jikanRes)) {
    ingestAnimeList([jikanRes] as any).catch(() => {});
    return { data: jikanRes as any };
  }

  return { data: null };
}

export async function updateAnimeSynopsis(id: number, synopsis: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  await supabase.from('anime').update({ synopsis }).eq('mal_id', id);
}
