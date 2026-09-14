import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(/const handleAddToShelf = \(anime: AnimeItem, status: ShelfStatus\) => \{/g, 'const handleAddToShelf = async (anime: AnimeItem, status: ShelfStatus) => {');
content = content.replace(/const handleToggleLike = \(anime: AnimeItem\) => \{/g, 'const handleToggleLike = async (anime: AnimeItem) => {');
content = content.replace(/const handleSetRating = \(anime: AnimeItem, rating: number\) => \{/g, 'const handleSetRating = async (anime: AnimeItem, rating: number) => {');
content = content.replace(/const handleUpdateProgress = \(id: number, mediaType: 'anime' \| 'manga', progress: number\) => \{/g, 'const handleUpdateProgress = async (id: number, mediaType: "anime" | "manga", progress: number) => {');
content = content.replace(/const handleRemoveFromShelf = \(id: number, mediaType: 'anime' \| 'manga'\) => \{/g, 'const handleRemoveFromShelf = async (id: number, mediaType: "anime" | "manga") => {');

fs.writeFileSync('src/App.tsx', content);
