const fs = require('fs');
let code = fs.readFileSync('server/jikanService.ts', 'utf-8');

const targetQuery = `        genres
      }
    }
  }
  \`;`;
const replacementQuery = `        genres
        studios(isMain: true) { nodes { name } }
      }
    }
  }
  \`;`;

const targetMap = `        genres: item.genres?.map(g => ({ name: g, mal_id: 0 })) || [],
        images: { jpg: { image_url: item.coverImage?.large, large_image_url: item.coverImage?.large } },`;
const replacementMap = `        genres: item.genres?.map(g => ({ name: g, mal_id: 0 })) || [],
        studios: item.studios?.nodes?.map(n => ({ name: n.name, mal_id: 0 })) || [],
        images: { jpg: { image_url: item.coverImage?.large, large_image_url: item.coverImage?.large } },`;

code = code.replace(targetQuery, replacementQuery).replace(targetMap, replacementMap);

fs.writeFileSync('server/jikanService.ts', code);
