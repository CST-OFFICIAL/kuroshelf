const fs = require('fs');
let content = fs.readFileSync('server/catalogService.ts', 'utf-8');

// I will just completely replace the searchCatalogAnime function
const searchStart = content.indexOf('export async function searchCatalogAnime(options: any)');
const searchEnd = content.indexOf('export async function getCatalogAnimeById', searchStart);

if (searchStart !== -1 && searchEnd !== -1) {
  const newFunc = `export async function searchCatalogAnime(options: any): Promise<{ data: AnimeItem[], pagination: JikanPagination }> {
  const page = Math.max(Number(options.page) || 1, 1);
  const limit = Math.min(Math.max(Number(options.limit) || 24, 1), 25);
  const offset = (page - 1) * limit;
  const clean = options.query?.trim() || '';

  if (!isSupabaseConfigured) {
    return { data: [], pagination: { last_visible_page: 1, has_next_page: false, current_page: 1, items: { count: 0, total: 0, per_page: limit } } };
  }
  
  let query;
  if (options.genres && options.genres !== 'all') {
    query = supabase.from('anime').select('*, anime_genres!inner(genres!inner(mal_id))', { count: 'exact' });
    query = query.eq('anime_genres.genres.mal_id', Number(options.genres));
  } else {
    query = supabase.from('anime').select('*', { count: 'exact' });
  }

  if (clean) {
    query = query.or(\`title.ilike.%\${clean}%,title_english.ilike.%\${clean}%,title_japanese.ilike.%\${clean}%\`);
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
  if (error) {
    console.error('searchCatalogAnime error:', error);
  }

  if (clean && (!data || data.length === 0)) {
     try {
       console.log('[Catalog] Local DB search empty for query, triggering live API ingestion...');
       const jikanResult = await jikanSearch(options);
       if (jikanResult.data && jikanResult.data.length > 0) {
         ingestAnimeList(jikanResult.data).catch(() => {});
         return jikanResult as any;
       }
     } catch (err) {
       console.warn('[Catalog] Live API ingestion failed:', err.message);
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

`;
  content = content.substring(0, searchStart) + newFunc + content.substring(searchEnd);
  fs.writeFileSync('server/catalogService.ts', content);
} else {
  console.log('Failed to find indices');
}
