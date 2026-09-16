const fs = require('fs');
let content = fs.readFileSync('src/components/AnimeDetailModal.tsx', 'utf-8');

if (!content.includes('import { motion } from')) {
  content = content.replace(
    /import \{ useState, useEffect \} from 'react';/,
    "import { useState, useEffect } from 'react';\nimport { motion, AnimatePresence } from 'motion/react';"
  );
}

content = content.replace(
  /<div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">/g,
  '<div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">\n      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm" onClick={onClose} />'
);

// We replace the backdrop div that was already there
content = content.replace(
  /<div className="absolute inset-0 bg-neutral-950\/80 backdrop-blur-sm" onClick=\{onClose\} \/>/g,
  ''
);

content = content.replace(
  /<div className="relative w-full max-w-5xl max-h-\[90vh\] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">/g,
  '<motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative w-full max-w-5xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">'
);

content = content.replace(
  /        <\/div>\n      <\/div>\n    <\/div>\n  \);\n\}/g,
  '        </div>\n      </motion.div>\n    </div>\n  );\n}'
);

fs.writeFileSync('src/components/AnimeDetailModal.tsx', content);
