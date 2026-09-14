import fs from 'fs';
let content = fs.readFileSync('server/jikanService.ts', 'utf-8');

const target = `      const results = VERIFIED_SEED_ANIME.filter(a => {
        const t1 = a.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        const t2 = a.title_english ? a.title_english.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
        const t3 = a.title_japanese ? a.title_japanese.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
        return t1.includes(q) || t2.includes(q) || t3.includes(q);
      });
      return { data: results as any, pagination: undefined };
    }
  }`;

const replacement = `      const results = VERIFIED_SEED_ANIME.filter(a => {
        const t1 = a.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        const t2 = a.title_english ? a.title_english.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
        const t3 = a.title_japanese ? a.title_japanese.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
        return t1.includes(q) || t2.includes(q) || t3.includes(q);
      });
      
      if (results.length > 0) {
        return { data: results as any, pagination: undefined };
      }
      return null;
    }
  }`;

content = content.replace(target, replacement);
fs.writeFileSync('server/jikanService.ts', content);
