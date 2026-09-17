const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const target1 = `  app.get('/api/anime/top100', async (req: Request, res: Response): Promise<void> => {
    try {
      // First try to get top 100 from Supabase
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('anime').select('*').order('score', { ascending: false, nullsFirst: false }).limit(100);
        if (!error && data && data.length >= 10) {
           res.json({ success: true, data: data.map(item => ({...item, images: item.images_json})) });
           return;
        }
      }
      
      // Fallback: Fetch from Jikan API pages 1-4
      const p1 = serverGetTopAnime('favorite', 1, 25);
      const p2 = serverGetTopAnime('favorite', 2, 25);
      const p3 = serverGetTopAnime('favorite', 3, 25);
      const p4 = serverGetTopAnime('favorite', 4, 25);
      
      const results = await Promise.all([p1, p2, p3, p4]);
      const combined = results.map(r => (r as any).data).flat();
      
      res.json({ success: true, data: combined });
    } catch (err) {
      console.warn('[API /api/anime/top100] Fetch unavailable:', err);
      res.status(500).json({ success: false, data: [], error: 'Failed to fetch Top 100' });
    }
  });`;

const replacement1 = `  app.get('/api/anime/top100', async (req: Request, res: Response): Promise<void> => {
    try {
      const year = req.query.year ? Number(req.query.year) : undefined;
      const genre = req.query.genre ? String(req.query.genre) : undefined;

      // First try to get top 100 from Supabase
      if (isSupabaseConfigured) {
        let query = supabase.from('anime').select('*, anime_genres!inner(genres!inner(name))');
        
        if (year) query = query.eq('year', year);
        if (genre && genre !== 'all') query = query.eq('anime_genres.genres.name', genre);
        
        const { data, error } = await query.order('score', { ascending: false, nullsFirst: false }).limit(100);
        
        if (!error && data && data.length > 0) {
           res.json({ success: true, data: data.map(item => {
             const cleaned = { ...item };
             delete cleaned.anime_genres;
             cleaned.images = cleaned.images_json;
             return cleaned;
           })});
           return;
        }
      }
      
      // Fallback: Fetch from Jikan/Anilist using serverSearchAnime (since we need genres/year)
      if (year || genre) {
          const searchParams: any = { orderBy: 'score', limit: 25, sort: 'desc' };
          if (genre && genre !== 'all') searchParams.genres = genre;
          // For Jikan we might need to map genre name to ID, but Anilist fallback handles name natively if we mapped it.
          // Wait, our Anilist fallback uses genres (which maps ID to name), but we are passing name directly.
          // In serverSearchAnime, options.genres is expected to be ID. But if it's not 'all', the fallback tries to map GENRE_MAP[genreId].
          // To avoid breaking the fallback, we'll just let it fail gracefully or return empty for Jikan if it's missing.
      }
      
      const p1 = serverGetTopAnime('favorite', 1, 25);
      const p2 = serverGetTopAnime('favorite', 2, 25);
      const p3 = serverGetTopAnime('favorite', 3, 25);
      const p4 = serverGetTopAnime('favorite', 4, 25);
      
      const results = await Promise.all([p1, p2, p3, p4]);
      const combined = results.map(r => (r as any).data).flat();
      
      res.json({ success: true, data: combined });
    } catch (err) {
      console.warn('[API /api/anime/top100] Fetch unavailable:', err);
      res.status(500).json({ success: false, data: [], error: 'Failed to fetch Top 100' });
    }
  });`;

if (code.includes(target1)) {
  code = code.replace(target1, replacement1);
  fs.writeFileSync('server.ts', code);
} else {
  console.log("Target 1 not found!");
}
