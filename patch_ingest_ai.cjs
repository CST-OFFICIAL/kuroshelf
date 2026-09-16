const fs = require('fs');
let content = fs.readFileSync('server/ingestionService.ts', 'utf-8');

content = content.replace(
  /import \{ fetchFromJikan \} from '\.\/jikanService';/,
  "import { fetchFromJikan } from './jikanService';\nimport { rewriteSynopsis } from './aiService';"
);

// We want to rewrite the synopsis before inserting/updating
const oldLogic = /duration: item\.duration \|\| null,/;
const newLogic = `
        duration: item.duration || null,
        synopsis: await rewriteSynopsis(item.synopsis || null),`;

content = content.replace(oldLogic, newLogic.trim());

// Remove the old simple synopsis mapping
content = content.replace(/synopsis: item\.synopsis \|\| null,\n/, '');

fs.writeFileSync('server/ingestionService.ts', content);
