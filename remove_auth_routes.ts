import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf-8');

const regex = /\/\/ ---------------- Authentication Endpoints ----------------[\s\S]*?\/\/ ---------------- Shelf Endpoints ----------------/;
if (regex.test(content)) {
  content = content.replace(regex, '// ---------------- Shelf Endpoints ----------------');
  fs.writeFileSync('server.ts', content);
  console.log('Successfully removed old mock auth routes');
} else {
  console.log('Regex failed');
}
