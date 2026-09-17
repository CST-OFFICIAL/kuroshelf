const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace getShelfItem with useMemo version
content = content.replace(
  /const getShelfItem = \(malId: number\) => shelf\.find\(s => s\.anime\.mal_id === malId\);/g,
  `const shelfMap = useMemo(() => {
    const map = new Map<number, ShelfEntry>();
    for (const item of shelf) map.set(item.anime.mal_id, item);
    return map;
  }, [shelf]);
  const getShelfItem = useCallback((malId: number) => shelfMap.get(malId), [shelfMap]);`
);

// We need to make sure useMemo is imported
if (!content.includes('useMemo')) {
  content = content.replace(/import \{ useState, useEffect, useCallback \} from 'react';/, "import { useState, useEffect, useCallback, useMemo } from 'react';");
}

fs.writeFileSync('src/App.tsx', content);
