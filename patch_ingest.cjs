const fs = require('fs');
let content = fs.readFileSync('server/ingestionService.ts', 'utf-8');
content = content.replace(
  /\} catch \(e\) \{\n      console\.error\(\`Error processing anime \$\{item\.mal_id\}:\`, e\);\n      result\.failures\+\+;\n    \}/,
  `} catch (e) {
      console.error(\`Error processing anime \${item.mal_id}:\`, e);
      result.failures++;
    }`
);
// wait let's just use grep to see where the catch block is
