const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

if (!content.includes('startBackgroundScraper')) {
  content = content.replace(
    /import \{ runIngestionJob \} from '.\/server\/ingestionService';/,
    `import { runIngestionJob } from './server/ingestionService';\nimport { startBackgroundScraper } from './server/scraperDaemon';`
  );

  content = content.replace(
    /app\.listen\(PORT, '0\.0\.0\.0', \(\) => \{/,
    `app.listen(PORT, '0.0.0.0', () => {\n    startBackgroundScraper();`
  );
  fs.writeFileSync('server.ts', content);
}
