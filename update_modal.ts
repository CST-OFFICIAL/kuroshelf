import fs from 'fs';
let content = fs.readFileSync('src/components/AnimeDetailModal.tsx', 'utf-8');

const stateTarget = `  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);`;
const stateReplacement = `  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [communityScore, setCommunityScore] = useState<{ score: number | null, users: number } | null>(null);`;

content = content.replace(stateTarget, stateReplacement);

const fetchTarget = `  // Fetch characters when anime opens
  useEffect(() => {`;
const fetchReplacement = `  // Fetch community score
  useEffect(() => {
    if (!anime) return;
    fetch(\`/api/ratings/community/anime/\${anime.mal_id}\`)
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setCommunityScore(res.data);
        }
      })
      .catch(err => console.warn('Community score fetch error', err));
  }, [anime?.mal_id]);

  // Fetch characters when anime opens
  useEffect(() => {`;
content = content.replace(fetchTarget, fetchReplacement);

const scoreTarget = `              {/* Stats Bar */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {anime.score && (
                  <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm">{anime.score.toFixed(2)}</span>
                    {anime.scored_by ? (
                      <span className="text-[10px] text-amber-400/80 font-normal">({anime.scored_by.toLocaleString()} votes)</span>
                    ) : null}
                  </div>
                )}`;
const scoreReplacement = `              {/* Stats Bar */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex flex-col gap-1">
                  {communityScore?.score !== null && communityScore?.score !== undefined && (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold" title="Kuro Shelf Community Rating">
                      <Star className="w-4 h-4 fill-rose-400 text-rose-400" />
                      <span className="text-sm">{communityScore.score.toFixed(2)}</span>
                      <span className="text-[10px] text-rose-400/80 font-normal">({communityScore.users} KS user{communityScore.users !== 1 ? 's' : ''})</span>
                    </div>
                  )}
                  {anime.score && (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold" title="MyAnimeList Global Rating">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm">{anime.score.toFixed(2)}</span>
                      {anime.scored_by ? (
                        <span className="text-[10px] text-amber-400/80 font-normal">({anime.scored_by.toLocaleString()} MAL votes)</span>
                      ) : null}
                    </div>
                  )}
                </div>`;
content = content.replace(scoreTarget, scoreReplacement);

fs.writeFileSync('src/components/AnimeDetailModal.tsx', content);
