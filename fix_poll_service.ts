import fs from 'fs';
let content = fs.readFileSync('src/services/pollService.ts', 'utf-8');

content = content.replace(/headers: getAuthHeaders\(\),/g, 'headers: await getAuthHeaders(),');

fs.writeFileSync('src/services/pollService.ts', content);
