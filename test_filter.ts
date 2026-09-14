import { VERIFIED_SEED_ANIME } from './server/verifiedSeed.js';
const q = 'rezero';
const results = VERIFIED_SEED_ANIME.filter(a => 
  a.title.toLowerCase().includes(q) || 
  (a.title_english && a.title_english.toLowerCase().includes(q)) ||
  (a.title_japanese && a.title_japanese.toLowerCase().includes(q))
);
console.log(results.length);
