import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(
  /const handleUpdateRating = \(anime: AnimeItem, rating: number\) => \{/g,
  'const handleUpdateRating = async (anime: AnimeItem, rating: number) => {'
);

fs.writeFileSync('src/App.tsx', content);
