const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const oldGrid = `<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {topRankedAnime.map((anime, idx) => {
                      const shelfItem = getShelfItem(anime.mal_id);
                      return (
                        <div key={\`rank-page-\${anime.mal_id}-\${idx}\`} className="relative">
                          {rankingFilter === 'top100' && (
                            <div className="absolute -left-2 -top-2 w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-sm shadow-lg z-10 border-2 border-neutral-900 shadow-rose-900/50">
                              {idx + 1}
                            </div>
                          )}
                          <AnimeCard
                            anime={anime}
                            onSelect={setSelectedAnime}
                            isLiked={shelfItem?.isLiked}
                            onToggleLike={handleToggleLike}
                            shelfStatus={shelfItem?.status}
                            onUpdateShelfStatus={handleUpdateShelfStatus}
                          />
                        </div>
                      );
                    })}
                  </div>`;

const newGrid = `
                  {rankingFilter === 'top100' ? (
                    <div className="flex flex-col gap-3 max-w-4xl mx-auto">
                      {topRankedAnime.map((anime, idx) => {
                        const shelfItem = getShelfItem(anime.mal_id);
                        return (
                          <div 
                            key={\`top100-\${anime.mal_id}-\${idx}\`}
                            onClick={() => setSelectedAnime(anime)}
                            className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 bg-neutral-900 border border-neutral-800 rounded-xl hover:bg-neutral-800/80 hover:border-neutral-700 transition-all cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-0.5"
                          >
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                              <div className="flex flex-col items-center justify-center w-8 sm:w-12 shrink-0">
                                <span className="text-xl sm:text-2xl font-black text-rose-500 font-display">
                                  #{idx + 1}
                                </span>
                              </div>
                              <div className="relative w-16 h-24 sm:w-20 sm:h-28 rounded-lg overflow-hidden shrink-0 shadow-md">
                                <img 
                                  src={anime.images?.webp?.image_url || anime.images?.jpg?.image_url} 
                                  alt={anime.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  loading="lazy"
                                />
                              </div>
                              
                              <div className="flex flex-col flex-1 sm:hidden">
                                <h3 className="font-bold text-sm text-white line-clamp-2 leading-tight">{anime.title}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                  <span className="text-amber-400 font-bold text-xs">{anime.score?.toFixed(2) || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0 hidden sm:flex flex-col gap-1.5">
                              <h3 className="text-lg font-bold text-white group-hover:text-rose-400 transition-colors line-clamp-1">{anime.title}</h3>
                              {anime.title_english && anime.title_english !== anime.title && (
                                <p className="text-xs text-neutral-400 line-clamp-1">{anime.title_english}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-neutral-300">
                                <span className="font-medium px-2 py-0.5 bg-neutral-950 rounded border border-neutral-800">{anime.type || 'TV'}</span>
                                {anime.year && <span>{anime.year}</span>}
                                {anime.episodes && <span>• {anime.episodes} eps</span>}
                                <span className="text-neutral-500">•</span>
                                <span className={anime.status === 'Currently Airing' ? 'text-emerald-400 font-medium' : ''}>
                                  {anime.status}
                                </span>
                              </div>
                              {anime.genres && anime.genres.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {anime.genres.slice(0, 4).map(g => (
                                    <span key={g.mal_id} className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-800/80 text-neutral-400">
                                      {g.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="hidden sm:flex flex-col items-end gap-2 shrink-0 pl-4 border-l border-neutral-800 min-w-[120px]">
                              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                <span className="text-amber-400 font-black text-lg">{anime.score?.toFixed(2) || 'N/A'}</span>
                              </div>
                              {anime.scored_by && (
                                <span className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">
                                  {(anime.scored_by / 1000).toFixed(1)}k users
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {topRankedAnime.map((anime, idx) => {
                        const shelfItem = getShelfItem(anime.mal_id);
                        return (
                          <AnimeCard
                            key={\`rank-page-\${anime.mal_id}-\${idx}\`}
                            anime={anime}
                            onSelect={setSelectedAnime}
                            isLiked={shelfItem?.isLiked}
                            onToggleLike={handleToggleLike}
                            shelfStatus={shelfItem?.status}
                            onUpdateShelfStatus={handleUpdateShelfStatus}
                          />
                        );
                      })}
                    </div>
                  )}
`;

content = content.replace(oldGrid, newGrid);
fs.writeFileSync('src/App.tsx', content);
