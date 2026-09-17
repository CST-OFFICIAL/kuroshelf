const https = require('https');
https.get('https://api.jikan.moe/v4/anime?q=Koori', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('Anime:', JSON.parse(data).data?.[0]?.title));
});
https.get('https://api.jikan.moe/v4/manga?q=Koori', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log('Manga:', JSON.parse(data).data?.[0]?.title));
});
