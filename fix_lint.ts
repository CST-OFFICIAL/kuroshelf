import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(
  /supabase\.auth\.onAuthStateChange\(async \(event, session\) => \{/g,
  'supabase.auth.onAuthStateChange(async (_event, session) => {'
);

fs.writeFileSync('src/App.tsx', content);
