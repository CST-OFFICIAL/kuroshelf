const fs = require('fs');
let code = fs.readFileSync('src/services/jikan.ts', 'utf-8');

const target1 = `export async function getTopAnime(
  filter: 'airing' | 'bypopularity' | 'favorite' | 'upcoming' | 'top100' = 'bypopularity',
  limit: number = 20,
  page: number = 1
): Promise<AnimeItem[]> {
  
  if (filter === 'top100') {
    const res = await fetchFromApi<AnimeItem[]>('/api/anime/top100', []);
    return Array.isArray(res.data) ? res.data : [];
  }
`;

const replacement1 = `export async function getTopAnime(
  filter: 'airing' | 'bypopularity' | 'favorite' | 'upcoming' | 'top100' = 'bypopularity',
  limit: number = 20,
  page: number = 1,
  genre?: string,
  year?: string
): Promise<AnimeItem[]> {
  
  if (filter === 'top100') {
    let url = '/api/anime/top100';
    if (genre && genre !== 'all' || (year && year !== 'all')) {
      const params = new URLSearchParams();
      if (genre && genre !== 'all') params.set('genre', genre);
      if (year && year !== 'all') params.set('year', year);
      url += '?' + params.toString();
    }
    const res = await fetchFromApi<AnimeItem[]>(url, []);
    return Array.isArray(res.data) ? res.data : [];
  }
`;

if (code.includes(target1)) {
  code = code.replace(target1, replacement1);
  fs.writeFileSync('src/services/jikan.ts', code);
} else {
  console.log("Target 1 not found!");
}
