const fs = require('fs');
let navContent = fs.readFileSync('src/components/Navbar.tsx', 'utf-8');

navContent = navContent.replace(
  "User as UserIcon\\n} from 'lucide-react';",
  "User as UserIcon,\\n  Database\\n} from 'lucide-react';"
);

fs.writeFileSync('src/components/Navbar.tsx', navContent);
