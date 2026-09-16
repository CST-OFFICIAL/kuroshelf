import { ingestAnimeList } from './server/ingestionService';
import { supabase } from './server/supabase';

async function test() {
  const mockAnime = {
    mal_id: 1,
    url: 'https://myanimelist.net/anime/1',
    title: 'Cowboy Bebop',
    images: { jpg: { image_url: 'img' } },
    airing: false,
    genres: [{ mal_id: 1, name: 'Action', type: 'anime', url: '' }],
    themes: [],
    demographics: [],
    explicit_genres: [],
    studios: []
  };
  
  const { data, error } = await supabase.from('genres').insert({ name: 'Action', type: 'anime', mal_id: 1 });
  console.log('manual insert error:', error);
}
test();
