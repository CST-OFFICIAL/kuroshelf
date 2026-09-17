const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');
content = content.replace(
  "AlertCircle\\n} from 'lucide-react';",
  "AlertCircle,\\n  Star\\n} from 'lucide-react';"
);
fs.writeFileSync('src/App.tsx', content);
