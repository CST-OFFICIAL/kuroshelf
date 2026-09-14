import fs from 'fs';
let content = fs.readFileSync('server/jikanService.ts', 'utf-8');

const target = `    const q = url.searchParams.get('q')?.toLowerCase();
    if (q) {
      const results = VERIFIED_SEED_ANIME.filter(a => 
        a.title.toLowerCase().includes(q) || 
        (a.title_english && a.title_english.toLowerCase().includes(q)) ||
        (a.title_japanese && a.title_japanese.toLowerCase().includes(q))
      );`;

const replacement = `    let q = url.searchParams.get('q')?.toLowerCase();
    if (q) {
      q = q.replace(/[^a-z0-9]/g, '');
      const results = VERIFIED_SEED_ANIME.filter(a => {
        const t1 = a.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        const t2 = a.title_english ? a.title_english.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
        const t3 = a.title_japanese ? a.title_japanese.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
        return t1.includes(q) || t2.includes(q) || t3.includes(q);
      });`;

content = content.replace(target, replacement);
fs.writeFileSync('server/jikanService.ts', content);
