import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf-8');
const startIndex = content.indexOf('// ---------------- Authentication Endpoints ----------------');
const endIndex = content.indexOf('// ---------------- Shelf Endpoints ----------------');

if (startIndex !== -1 && endIndex !== -1) {
  content = content.slice(0, startIndex) + content.slice(endIndex);
  fs.writeFileSync('server.ts', content);
  console.log('Removed mock auth routes');
} else {
  console.log('Could not find auth route section');
}
