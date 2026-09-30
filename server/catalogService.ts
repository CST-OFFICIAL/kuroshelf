
import { supabase, isSupabaseConfigured } from './supabase';
import type { AnimeItem, JikanPagination } from '../src/types';
import { 
  serverSearchAnime as jikanSearch, 
  serverGetAnimeDetails as jikanGetById, 
  serverGetTopAnime, 
  serverGetSeasonalAnime, 
  serverGetUpcomingAnime, 
  isNsfwOrAdult, 
  resolveGenreInfo,
  scoreAnimeRelevance,
  STUDIO_ALIASES,
  COMMON_ABBREVIATIONS,
  ICONIC_CHARACTERS,
  ICONIC_STUDIOS,
  ICONIC_LETTER_ANIME
} from './jikanService';
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
        data: (liveRes?.data || []).filter((item: any) => !isNsfwOrAdult(item)) as unknown as AnimeItem[],
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

  const cleanLower = clean.toLowerCase();
  const resolvedTerm = COMMON_ABBREVIATIONS[cleanLower] || STUDIO_ALIASES[cleanLower] || clean;
  const isStudioSearch = Boolean(STUDIO_ALIASES[cleanLower]);

  if (clean) {
    if (clean.length === 1) {
      // Single letter search: prioritize titles starting with that letter
      query = query.or(`title.ilike.${clean}%,title_english.ilike.${clean}%`);
    } else if (isStudioSearch) {
      const targetStudioName = STUDIO_ALIASES[cleanLower] || clean;
      query = query.or(`title.ilike.%${clean}%,title_english.ilike.%${clean}%,anime_studios.studios.name.ilike.%${targetStudioName}%`);
    } else {
      query = query.or(`title.ilike.%${clean}%,title_english.ilike.%${clean}%,title_japanese.ilike.%${clean}%,title.ilike.%${resolvedTerm}%,title_english.ilike.%${resolvedTerm}%`);
    }
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

  // When a text search query is given, or local results are sparse, trigger live search for character, studio, and canonical anime results
  const shouldFetchLive = Boolean(clean || localItems.length < limit || (options.genres && options.genres !== 'all'));
  if (shouldFetchLive) {
     try {
       const jikanResult = await jikanSearch({
         ...options,
         query: resolvedTerm || clean
       });

       const targetMalIds = [
         ...(ICONIC_CHARACTERS[cleanLower]?.mal_ids || []),
         ...(ICONIC_STUDIOS[cleanLower]?.mal_ids || []),
         ...(ICONIC_LETTER_ANIME[cleanLower] || [])
       ];

       let iconicItems: any[] = [];
       if (targetMalIds.length > 0 && isSupabaseConfigured) {
         try {
           const { data: iconicDb } = await supabase
             .from('anime')
             .select('*, anime_genres(genres(*)), anime_studios(studios(*)), anime_streaming(url, streaming_providers(name))')
             .in('mal_id', targetMalIds);
           if (iconicDb && iconicDb.length > 0) {
             iconicItems = iconicDb.filter(i => !isNsfwOrAdult(i)).map(mapDbToAnime).map(item => ({
               ...item,
               _isChar: Boolean(ICONIC_CHARACTERS[cleanLower]),
               _isStudio: Boolean(ICONIC_STUDIOS[cleanLower])
             }));
           }
         } catch(e) {}
       }

       const jikanDataList = (jikanResult.data || []) as any[];
       if (jikanDataList.length > 0 || iconicItems.length > 0) {
         // Ingest in background
         if (jikanDataList.length > 0) {
           ingestAnimeList(jikanDataList).catch(() => {});
         }
         
         const existingIds = new Set<number>();
         const safeFallbackItems = jikanDataList
           .filter(item => !isNsfwOrAdult(item));

         // Merge candidate items: iconic hits + fallback results + local items
         const combined = [...iconicItems, ...safeFallbackItems, ...localItems].filter(item => {
           if (!item || !item.mal_id || existingIds.has(item.mal_id)) return false;
           existingIds.add(item.mal_id);
           return true;
         });

         if (clean) {
           combined.sort((a: any, b: any) => {
             const isCharA = (a as any)._isChar || false;
             const isStudioA = isStudioSearch || (a as any)._isStudio || false;
             const isIconicA = (a as any)._isIconic || false;
             const isCharB = (b as any)._isChar || false;
             const isStudioB = isStudioSearch || (b as any)._isStudio || false;
             const isIconicB = (b as any)._isIconic || false;
             const relA = a._relevance ?? scoreAnimeRelevance(a, clean, isCharA, isStudioA, isIconicA);
             const relB = b._relevance ?? scoreAnimeRelevance(b, clean, isCharB, isStudioB, isIconicB);
             return relB - relA;
           });
         }

         const pagedSlice = combined.slice(0, limit);
         return {
           data: pagedSlice,
           pagination: {
             last_visible_page: Math.max(Math.ceil(((count || 0) + safeFallbackItems.length + iconicItems.length) / limit), 1),
             has_next_page: jikanResult.pagination?.has_next_page || combined.length >= limit,
             current_page: page,
             items: { count: pagedSlice.length, total: Math.max(count || 0, combined.length), per_page: limit }
           }
         };
       }
     } catch (err) {
       // Live API failed (rate limits), silent fallback to existing local items
     }
  }

  if (clean && localItems.length > 0) {
    localItems.sort((a: any, b: any) => {
      const relA = scoreAnimeRelevance(a, clean, false, isStudioSearch);
      const relB = scoreAnimeRelevance(b, clean, false, isStudioSearch);
      return relB - relA;
    });
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
    // Fetch live from Jikan to backfill relations, streaming, or genres
    try {
      const jikanRes = await jikanGetById(id);
      if (jikanRes && !isNsfwOrAdult(jikanRes)) {
        if (jikanRes.relations && Array.isArray(jikanRes.relations)) {
          mapped.relations = jikanRes.relations;
        }
        if ((!mapped.genres || mapped.genres.length === 0) && jikanRes.genres && jikanRes.genres.length > 0) {
          mapped.genres = jikanRes.genres as unknown as AnimeItem['genres'];
        }
        if (jikanRes.themes && jikanRes.themes.length > 0) {
          mapped.themes = jikanRes.themes as unknown as AnimeItem['themes'];
        }
        if (jikanRes.demographics && jikanRes.demographics.length > 0) {
          mapped.demographics = jikanRes.demographics as unknown as AnimeItem['demographics'];
        }
        if (jikanRes.streaming && jikanRes.streaming.length > 0) {
          mapped.streaming = jikanRes.streaming;
        }
        // Fire and forget ingestion update
        ingestAnimeList([jikanRes] as any).catch(() => {});
      }
    } catch (e) {}

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
