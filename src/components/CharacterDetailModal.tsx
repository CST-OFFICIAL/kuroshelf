import React, { useState, useEffect } from 'react';
import { X, Heart, Film, Mic, Loader2 } from 'lucide-react';
import { CharacterDetail, AnimeItem } from '../types';
import { getCharacterDetails, getAnimeById } from '../services/jikan';

interface CharacterDetailModalProps {
  characterId: number;
  characterName?: string;
  onClose: () => void;
  onSelectAnime: (anime: AnimeItem) => void;
  onSelectVoiceActor: (personId: number, personName: string) => void;
}

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({
  characterId,
  characterName,
  onClose,
  onSelectAnime,
  onSelectVoiceActor,
}) => {
  const [data, setData] = useState<CharacterDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getCharacterDetails(characterId, characterName)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch character:', err);
        if (isMounted) {
          setLoading(false);
        }
      });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      isMounted = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [characterId, characterName, onClose]);

  const handleAnimeClick = async (malId: number) => {
    try {
      const anime = await getAnimeById(malId);
      if (anime) {
        onClose();
        onSelectAnime(anime);
      }
    } catch (e) {
      console.warn('Failed to load anime for character:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div
        id="character-detail-modal"
        className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl my-auto text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-character-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-neutral-950/80 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
            <p className="text-sm text-neutral-400">Retrieving character dossier...</p>
          </div>
        ) : !data ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-base text-neutral-300 font-semibold">Character details unavailable</p>
            <p className="text-xs text-neutral-500">Could not retrieve extended profile for {characterName || 'this character'}.</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs text-white rounded-lg"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800">
            {/* Header / Hero */}
            <div className="relative p-6 sm:p-8 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-900 border-b border-neutral-800 flex flex-col sm:flex-row gap-6 items-start">
              {/* Character Avatar */}
              <div className="relative w-32 sm:w-40 aspect-[3/4] shrink-0 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-xl">
                <img
                  src={data.image_url}
                  alt={data.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Character Info */}
              <div className="space-y-3 flex-1">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                      Character Profile
                    </span>
                    {data.favorites ? (
                      <span className="flex items-center gap-1 text-xs text-rose-400 font-semibold">
                        <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                        {data.favorites.toLocaleString()} favorites
                      </span>
                    ) : null}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">{data.name}</h2>
                  {data.name_kanji && (
                    <p className="text-sm font-medium text-neutral-400 font-serif">{data.name_kanji}</p>
                  )}
                </div>

                {data.nicknames && data.nicknames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {data.nicknames.map((nick, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-neutral-800/80 text-neutral-300 text-[11px]"
                      >
                        {nick}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Voice Actors (Seiyuu) */}
              {data.voices && data.voices.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <Mic className="w-3.5 h-3.5 text-rose-400" />
                    <span>Voice Actors (Seiyuu)</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.voices.map((va, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          onClose();
                          onSelectVoiceActor(va.person_id, va.name);
                        }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-rose-500/50 cursor-pointer transition-all group"
                      >
                        {va.image_url ? (
                          <img
                            src={va.image_url}
                            alt={va.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-lg object-cover bg-neutral-900 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-neutral-900 flex items-center justify-center shrink-0">
                            <Mic className="w-5 h-5 text-neutral-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-white group-hover:text-rose-400 truncate transition-colors">
                            {va.name}
                          </div>
                          <div className="text-xs text-neutral-500">{va.language}</div>
                        </div>
                        <span className="text-[10px] text-neutral-400 group-hover:text-rose-400 font-medium px-2 py-1 bg-neutral-900 rounded-md border border-neutral-800">
                          View Roles
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Biography / Description */}
              {data.about && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Biography & Background
                  </h3>
                  <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 text-sm text-neutral-300 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-line scrollbar-thin scrollbar-thumb-neutral-800">
                    {data.about}
                  </div>
                </div>
              )}

              {/* Anime Appearances */}
              {data.anime && data.anime.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <Film className="w-3.5 h-3.5 text-rose-400" />
                    <span>Featured In Anime</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {data.anime.map((show) => (
                      <div
                        key={show.mal_id}
                        onClick={() => handleAnimeClick(show.mal_id)}
                        className="group bg-neutral-950 border border-neutral-800 hover:border-rose-500/50 rounded-xl overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5"
                      >
                        <div className="aspect-[3/4] overflow-hidden bg-neutral-900 relative">
                          <img
                            src={show.image_url}
                            alt={show.title}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          {show.role && (
                            <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-neutral-950/80 backdrop-blur-md text-[10px] font-semibold text-neutral-300">
                              {show.role}
                            </span>
                          )}
                        </div>
                        <div className="p-2.5">
                          <h4 className="font-semibold text-xs text-white line-clamp-1 group-hover:text-rose-400 transition-colors">
                            {show.title}
                          </h4>
                          {show.score && (
                            <div className="text-[10px] text-amber-400 font-bold mt-0.5">
                              ★ {show.score}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
