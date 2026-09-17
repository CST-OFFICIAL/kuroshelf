fetch('http://localhost:3000/api/anime/catalog?page=1').then(r=>r.json()).then(d=>console.log("Catalog", d.data[0]?.studios));
fetch('http://localhost:3000/api/anime/top100').then(r=>r.json()).then(d=>console.log("Top 100", d.data[0]?.studios));
