import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace synchronous getAuthHeaders() with await getAuthHeaders()
content = content.replace(
  /fetch\('\/api\/shelf', \{ headers: getAuthHeaders\(\), credentials: 'include' \}\)/g,
  `fetch('/api/shelf', { headers: await getAuthHeaders(), credentials: 'include' })`
);
content = content.replace(
  /fetch\('\/api\/likes', \{ headers: getAuthHeaders\(\), credentials: 'include' \}\)/g,
  `fetch('/api/likes', { headers: await getAuthHeaders(), credentials: 'include' })`
);
content = content.replace(
  /fetch\('\/api\/ratings', \{ headers: getAuthHeaders\(\), credentials: 'include' \}\)/g,
  `fetch('/api/ratings', { headers: await getAuthHeaders(), credentials: 'include' })`
);

content = content.replace(
  /headers: \{ \.\.\.getAuthHeaders\(\), 'Content-Type': 'application\/json' \},/g,
  `headers: { ...(await getAuthHeaders()), 'Content-Type': 'application/json' },`
);

content = content.replace(
  /headers: getAuthHeaders\(\),/g,
  `headers: await getAuthHeaders(),`
);

fs.writeFileSync('src/App.tsx', content);
