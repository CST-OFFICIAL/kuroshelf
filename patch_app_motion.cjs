const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

if (!content.includes('import { motion, AnimatePresence }')) {
  content = content.replace(
    /import \{ useState, useEffect, useCallback \} from 'react';/,
    "import { useState, useEffect, useCallback } from 'react';\nimport { motion, AnimatePresence } from 'motion/react';"
  );
}

// Wrap the main content (inside the <main> block)
content = content.replace(
  /<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">/g,
  '<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">\n        <AnimatePresence mode="wait">\n          <motion.div\n            key={activeTab}\n            initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}\n            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}\n            exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}\n            transition={{ duration: 0.25, ease: "easeInOut" }}\n            className="w-full"\n          >'
);

content = content.replace(
  /<\/main>/g,
  '          </motion.div>\n        </AnimatePresence>\n      </main>'
);

fs.writeFileSync('src/App.tsx', content);
