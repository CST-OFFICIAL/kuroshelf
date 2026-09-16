const fs = require('fs');
let content = fs.readFileSync('server/ingestionService.ts', 'utf-8');

const regex = /result\.failures\+\+;\n\s+\}/g;
content = content.replace(regex, "result.failures++;\n    }\n    // Rate limit buffer for AI generation\n    await sleep(250);");
fs.writeFileSync('server/ingestionService.ts', content);
