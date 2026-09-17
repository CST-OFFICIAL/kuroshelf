const https = require('https');

const data = JSON.stringify({
  query: `query {
    Page(page: 1, perPage: 5) {
      media(search: "Ramparts of Ice") {
        idMal
        type
        title {
          english
          romaji
        }
      }
    }
  }`
});

const options = {
  hostname: 'graphql.anilist.co',
  port: 443,
  path: '/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log(body));
});

req.write(data);
req.end();
