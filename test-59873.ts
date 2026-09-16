import { supabase } from './server/supabase';
import { ingestAnimeList } from './server/ingestionService';

async function test() {
  const query = `
       query {
         Media(idMal: 59873, type: ANIME) {
           idMal
           title { english romaji native }
           coverImage { large }
           averageScore
           episodes
           status
           seasonYear
           description(asHtml: false)
         }
       }
     `;
     const res = await fetch('https://graphql.anilist.co', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
       body: JSON.stringify({ query })
     });
     const data = await res.json();
     if (data?.data?.Media) {
       const m = data.data.Media;
       const animeItem = {
          mal_id: m.idMal,
          url: '',
          title: m.title.romaji || m.title.english || '',
          title_english: m.title.english || null,
          title_japanese: m.title.native || null,
          images: {
            jpg: { image_url: m.coverImage.large },
            webp: { image_url: m.coverImage.large }
          },
          score: m.averageScore ? m.averageScore / 10 : null,
          episodes: m.episodes || null,
          status: m.status,
          year: m.seasonYear || null,
          synopsis: m.description ? m.description.replace(/<[^>]*>?/gm, '') : '',
          genres: [],
          airing: false
       };
       const ingestRes = await ingestAnimeList([animeItem]);
       console.log('Result:', ingestRes);
     }
}
test();
