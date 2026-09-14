import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf-8');

content = content.replace(/  user\?: Omit<UserRow, 'password_hash' \| 'salt'> \| null;\n/g, '');

fs.writeFileSync('server.ts', content);
