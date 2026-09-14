import { VERIFIED_SEED_ANIME } from './server/verifiedSeed.js';
let q = 'rezero';
q = q.replace(/[^a-z0-9]/g, '');
const results = VERIFIED_SEED_ANIME.filter(a => {
  const t1 = a.title.toLowerCase().replace(/[^a-z0-9]/g, '');
  const t2 = a.title_english ? a.title_english.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const t3 = a.title_japanese ? a.title_japanese.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  return t1.includes(q) || t2.includes(q) || t3.includes(q);
});
console.log(results.length);
