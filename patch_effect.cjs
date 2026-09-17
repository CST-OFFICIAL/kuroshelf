const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `// Load Rankings when rankingFilter changes
  useEffect(() => {
    if (activeTab !== 'rankings') return;
    setLoadingRankings(true);
    getTopAnime(rankingFilter, 24)
      .then((data) => setTopRankedAnime(data))
      .catch((err) => console.warn('[Rankings] Notice:', err))
      .finally(() => setLoadingRankings(false));
  }, [rankingFilter, activeTab]);`;

const replacement = `// Load Rankings when rankingFilter changes
  useEffect(() => {
    if (activeTab !== 'rankings') return;
    setLoadingRankings(true);
    getTopAnime(rankingFilter, 24, 1, rankingGenre, rankingYear)
      .then((data) => setTopRankedAnime(data))
      .catch((err) => console.warn('[Rankings] Notice:', err))
      .finally(() => setLoadingRankings(false));
  }, [rankingFilter, activeTab, rankingGenre, rankingYear]);`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', code);
} else {
  console.log("Target not found!");
}
