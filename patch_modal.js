const fs = require('fs');
let content = fs.readFileSync('src/components/AnimeDetailModal.tsx', 'utf-8');

content = content.replace(
  /import \{\n  X,\n  Star,/,
  "import {\n  X,\n  Star,\n  CheckCircle2,\n  Info,\n  BookOpen,"
);

content = content.replace(
  /interface AnimeDetailModalProps \{/,
  "import { AuthUser } from '../types';\n\ninterface AnimeDetailModalProps {\n  currentUser?: AuthUser | null;\n  onOpenAuth?: () => void;"
);

content = content.replace(
  /export function AnimeDetailModal\(\{/,
  "export function AnimeDetailModal({\n  currentUser,\n  onOpenAuth,"
);

fs.writeFileSync('src/components/AnimeDetailModal.tsx', content);
