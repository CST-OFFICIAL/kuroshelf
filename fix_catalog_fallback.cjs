const fs = require('fs');
let content = fs.readFileSync('server/catalogService.ts', 'utf-8');

content = content.replace(
  /  const page = Math\.max\(Number\(options\.page\) \|\| 1, 1\);\n  const limit = Math\.min\(Math\.max\(Number\(options\.limit\) \|\| 24, 1\), 25\);\n  const offset = \(page - 1\) \* limit;\n  const clean = options\.query\?\.trim\(\) \|\| '';\n\n  let query = supabase\.from\('anime'\)\.select\('\*', \{ count: 'exact' \}\);/,
  "  let query = supabase.from('anime').select('*', { count: 'exact' });"
);

fs.writeFileSync('server/catalogService.ts', content);
