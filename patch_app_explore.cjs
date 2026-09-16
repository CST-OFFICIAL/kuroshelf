const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(
  /import \{ HeroBanner \} from '\.\/components\/HeroBanner';/,
  "import { HeroBanner } from './components/HeroBanner';\nimport { ExploreView } from './components/ExploreView';"
);

content = content.replace(
  /\{\/\* 2\. TAB: HOME \(DISCOVER\) \*\/\}/,
  "{/* TAB: EXPLORE */}\n            {activeTab === 'explore' && (\n              <ExploreView \n                onSelectAnime={setSelectedAnime}\n                getShelfStatus={(id) => getShelfItem(id)?.status}\n                onUpdateStatus={handleUpdateShelfStatus}\n                onToggleLike={handleToggleLike}\n                getIsLiked={(id) => getShelfItem(id)?.isLiked || false}\n              />\n            )}\n            {/* 2. TAB: HOME (DISCOVER) */}"
);

fs.writeFileSync('src/App.tsx', content);
