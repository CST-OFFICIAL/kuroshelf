const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

const newRoute = `
  app.get('/api/anime/top100', async (req: Request, res: Response): Promise<void> => {
    try {
      // First try to get top 100 from Supabase
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('anime').select('*').order('score', { ascending: false, nullsFirst: false }).limit(100);
        if (!error && data && data.length >= 10) {
           res.json({ success: true, data: data });
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
  });

  // Seasonal Anime
`;

content = content.replace('  // Seasonal Anime', newRoute);
fs.writeFileSync('server.ts', content);
