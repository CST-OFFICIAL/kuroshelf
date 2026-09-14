import fs from 'fs';
let content = fs.readFileSync('server/jikanService.ts', 'utf-8');

const target = `function getVerifiedSeedFallback<T>(endpoint: string): { data: T, pagination: any } | null {
  if (endpoint.includes('airing') || endpoint.includes('seasons/now')) return { data: VERIFIED_SEED_ANIME as any, pagination: undefined };
  if (endpoint.includes('upcoming') || endpoint.includes('seasons/upcoming')) return { data: VERIFIED_SEED_ANIME as any, pagination: undefined };
  if (endpoint.includes('bypopularity') || endpoint.includes('top/anime')) return { data: VERIFIED_SEED_ANIME as any, pagination: undefined };
  
  // detail fallback`;

const replacement = `function getVerifiedSeedFallback<T>(endpoint: string): { data: T, pagination: any } | null {
  if (endpoint.includes('airing') || endpoint.includes('seasons/now')) return { data: VERIFIED_SEED_ANIME as any, pagination: undefined };
  if (endpoint.includes('upcoming') || endpoint.includes('seasons/upcoming')) return { data: VERIFIED_SEED_ANIME as any, pagination: undefined };
  if (endpoint.includes('bypopularity') || endpoint.includes('top/anime')) return { data: VERIFIED_SEED_ANIME as any, pagination: undefined };
  
  // search fallback
  if (endpoint.startsWith('/anime?')) {
    const url = new URL(endpoint, 'http://localhost');
    const q = url.searchParams.get('q')?.toLowerCase();
    if (q) {
      const results = VERIFIED_SEED_ANIME.filter(a => 
        a.title.toLowerCase().includes(q) || 
        (a.title_english && a.title_english.toLowerCase().includes(q)) ||
        (a.title_japanese && a.title_japanese.toLowerCase().includes(q))
      );
      return { data: results as any, pagination: undefined };
    }
  }

  // detail fallback`;

content = content.replace(target, replacement);
fs.writeFileSync('server/jikanService.ts', content);
