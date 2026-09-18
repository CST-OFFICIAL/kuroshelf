import React, { useState, useEffect } from 'react';
import { X, Mic, Heart, Film, User, Calendar, Loader2 } from 'lucide-react';
import { PersonDetail, AnimeItem } from '../types';
import { getPersonDetails, getAnimeById } from '../services/jikan';

interface VoiceActorModalProps {
  personId: number;
  personName?: string;
  onClose: () => void;
  onSelectAnime: (anime: AnimeItem) => void;
  onSelectCharacter: (characterId: number, characterName: string) => void;
}

export const VoiceActorModal: React.FC<VoiceActorModalProps> = ({
  personId,
  personName,
  onClose,
  onSelectAnime,
  onSelectCharacter,
}) => {
  const [data, setData] = useState<PersonDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getPersonDetails(personId, personName)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch person:', err);
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
  }, [personId, personName, onClose]);

  const handleAnimeClick = async (malId: number) => {
    try {
      const anime = await getAnimeById(malId);
      if (anime) {
        onClose();
        onSelectAnime(anime);
      }
    } catch (e) {
      console.warn('Failed to load anime for voice actor:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div
        id="voice-actor-modal"
        className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl my-auto text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-va-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-neutral-950/80 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
            <p className="text-sm text-neutral-400">Retrieving voice actor profile...</p>
          </div>
        ) : !data ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-base text-neutral-300 font-semibold">Voice Actor details unavailable</p>
            <p className="text-xs text-neutral-500">Could not retrieve extended profile for {personName || 'this artist'}.</p>
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
              {/* Profile Image */}
              <div className="relative w-32 sm:w-40 aspect-[3/4] shrink-0 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-xl">
                <img
                  src={data.image_url}
                  alt={data.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="space-y-3 flex-1">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <Mic className="w-3 h-3" />
                      <span>Seiyuu / Staff</span>
                    </span>
                    {data.favorites ? (
                      <span className="flex items-center gap-1 text-xs text-rose-400 font-semibold">
                        <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                        {data.favorites.toLocaleString()} favorites
                      </span>
                    ) : null}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">{data.name}</h2>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-neutral-400">
                  {data.birthday && (
                    <div className="flex items-center gap-1 bg-neutral-950 px-2.5 py-1 rounded-md border border-neutral-800">
                      <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Birthday: {data.birthday}</span>
                    </div>
                  )}
                  {data.occupations && data.occupations.length > 0 && (
                    <div className="flex items-center gap-1 bg-neutral-950 px-2.5 py-1 rounded-md border border-neutral-800">
                      <User className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{data.occupations.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Biography / Description */}
              {data.about && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    About
                  </h3>
                  <div className="p-4 rounded-xl bg-neutral-950/60 border border-neutral-800/80 text-sm text-neutral-300 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-line scrollbar-thin scrollbar-thumb-neutral-800">
                    {data.about}
                  </div>
                </div>
              )}

              {/* Notable Roles Voiced */}
              {data.roles && data.roles.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <Film className="w-3.5 h-3.5 text-rose-400" />
                    <span>Notable Roles ({data.roles.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.roles.map((role, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-all"
                      >
                        {/* Character Image (clickable) */}
                        <div
                          onClick={() => {
                            onClose();
                            onSelectCharacter(role.character_id, role.character_name);
                          }}
                          className="w-14 h-14 rounded-lg overflow-hidden bg-neutral-900 shrink-0 cursor-pointer group relative"
                          title="View Character Profile"
                        >
                          <img
                            src={role.character_image}
                            alt={role.character_name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div
                            onClick={() => {
                              onClose();
                              onSelectCharacter(role.character_id, role.character_name);
                            }}
                            className="font-bold text-sm text-white hover:text-rose-400 truncate cursor-pointer transition-colors"
                          >
                            {role.character_name}
                          </div>
                          <div
                            onClick={() => handleAnimeClick(role.anime_id)}
                            className="text-xs text-neutral-400 hover:text-rose-400 truncate cursor-pointer transition-colors mt-0.5"
                          >
                            {role.anime_title}
                          </div>
                          {role.role && (
                            <span className="inline-block text-[10px] text-neutral-500 mt-1">
                              {role.role}
                            </span>
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
