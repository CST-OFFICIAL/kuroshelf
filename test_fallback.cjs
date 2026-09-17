const fetch = require('node-fetch');
fetch('http://localhost:3000/api/anime/search?q=ramparts+of+ice').then(r=>r.json()).then(d=>{
  console.log("Success:", d.success);
  console.log("Data length:", d.data?.length);
  console.log("Error:", d.error);
});
