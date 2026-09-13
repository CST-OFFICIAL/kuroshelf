async function testUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    console.log(`${url}: ${res.status}`);
  } catch (err) {
    console.log(`${url}: ${err.message}`);
  }
}
async function run() {
  await testUrl("https://cdn.myanimelist.net/images/anime/1522/128039.jpg");
  await testUrl("https://cdn.myanimelist.net/images/anime/1522/128039t.jpg");
  await testUrl("https://cdn.myanimelist.net/images/anime/1522/128039l.jpg");
  await testUrl("https://cdn.myanimelist.net/images/anime/1522/128039.webp");
  await testUrl("https://cdn.myanimelist.net/images/anime/1522/128039t.webp");
  await testUrl("https://cdn.myanimelist.net/images/anime/1522/128039l.webp");

  await testUrl("https://cdn.myanimelist.net/images/anime/1316/143527.jpg");
  await testUrl("https://cdn.myanimelist.net/images/anime/1316/143527l.jpg");
  await testUrl("https://cdn.myanimelist.net/images/anime/1316/143527.webp");
  await testUrl("https://cdn.myanimelist.net/images/anime/1316/143527l.webp");
}
run();
