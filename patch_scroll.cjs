const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const targetToRemove = `  // Failsafe to ensure body scrolling is always enabled if no modal is open
  useEffect(() => {
    if (!selectedAnime && !authModalOpen && !infoModalType) {
      document.body.style.overflow = 'unset';
      document.body.style.overflowX = 'hidden';
    }
  }, [selectedAnime, authModalOpen, infoModalType]);`;

code = code.replace(targetToRemove, "");

const targetToInsert = `  const [selectedAnime, setSelectedAnime] = useState<AnimeItem | null>(null);`;
const replacementToInsert = `  const [selectedAnime, setSelectedAnime] = useState<AnimeItem | null>(null);

  // Failsafe to ensure body scrolling is always enabled if no modal is open
  useEffect(() => {
    if (!selectedAnime && !authModalOpen && !infoModalType) {
      document.body.style.overflow = 'unset';
      document.body.style.overflowX = 'hidden';
    }
  }, [selectedAnime, authModalOpen, infoModalType]);`;

code = code.replace(targetToInsert, replacementToInsert);
fs.writeFileSync('src/App.tsx', code);
