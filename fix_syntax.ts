import fs from 'fs';
let c1 = fs.readFileSync('src/lib/supabase.ts', 'utf-8');
c1 = c1.replace(/\\n$/, '\n');
fs.writeFileSync('src/lib/supabase.ts', c1);

let c2 = fs.readFileSync('server/supabase.ts', 'utf-8');
c2 = c2.replace(/\\n$/, '\n');
fs.writeFileSync('server/supabase.ts', c2);
