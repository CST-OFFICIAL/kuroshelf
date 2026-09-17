const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const target = `  app.get('/api/anime/search', async (req: Request, res: Response): Promise<void> => {`;
const replacement = `  app.get('/api/test-db', async (req: Request, res: Response): Promise<void> => {
    const { data, error } = await supabase.from('anime').select('*, anime_genres(genres(*)), anime_studios(studios(*)), anime_streaming(url, streaming_providers(name))').eq('mal_id', 16498).single();
    res.json({ data, error });
  });

  app.get('/api/anime/search', async (req: Request, res: Response): Promise<void> => {`;

code = code.replace(target, replacement);
fs.writeFileSync('server.ts', code);
