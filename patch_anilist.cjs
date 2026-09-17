const fs = require('fs');
let code = fs.readFileSync('server/jikanService.ts', 'utf-8');

code = code.replace(
  "const formatStr = type && type !== 'all' ? FORMAT_MAP[type.toLowerCase()] : undefined;",
  "const formatStr = typeApi && typeApi !== 'ALL' ? typeApi : undefined;"
);

fs.writeFileSync('server/jikanService.ts', code);
