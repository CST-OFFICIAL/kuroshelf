import { useState, useEffect } from 'react';
import { ListPlus, Check, X, FolderPlus } from 'lucide-react';
import { WatchlistPlaylist } from '../types';
import { getStoredPlaylists, savePlaylist, addItemToPlaylist } from '../services/playlistService';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: number;
    mediaType: 'anime' | 'manga';
    title: string;
    image: string;
    score?: number;
    genres?: string[];
  } | null;
  userId?: string;
}

export function AddToPlaylistModal({ isOpen, onClose, item, userId }: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<WatchlistPlaylist[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredPlaylists(userId);
      setPlaylists(stored);
      if (item) {
        const containing = new Set<string>();
        for (const pl of stored) {
          if (pl.items.some((i) => i.id === item.id && i.mediaType === item.mediaType)) {
            containing.add(pl.id);
          }
        }
        setAddedIds(containing);
      }
    }
  }, [isOpen, item, userId]);

  if (!isOpen || !item) return null;

  const handleTogglePlaylist = (playlist: WatchlistPlaylist) => {
    if (addedIds.has(playlist.id)) {
      // already in playlist
      return;
    }
    const success = addItemToPlaylist(
      playlist.id,
      {
        id: item.id,
        mediaType: item.mediaType,
        title: item.title,
        image: item.image,
        score: item.score,
        genres: item.genres,
        reason: 'Added by user',
      },
      userId
    );
    if (success) {
      setAddedIds((prev) => new Set([...prev, playlist.id]));
      setPlaylists(getStoredPlaylists(userId));
    }
  };

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newPlaylistName.trim();
    if (!cleanName) return;

    const newPl: WatchlistPlaylist = {
      id: `pl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: cleanName,
      items: [
        {
          id: item.id,
          mediaType: item.mediaType,
          title: item.title,
          image: item.image,
          score: item.score,
          genres: item.genres,
          reason: 'Added by user',
          addedAt: Date.now(),
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    savePlaylist(newPl, userId);
    setNewPlaylistName('');
    setIsCreating(false);
    setPlaylists(getStoredPlaylists(userId));
    setAddedIds((prev) => new Set([...prev, newPl.id]));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-2xl overflow-hidden space-y-4 p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-2 text-rose-500">
            <ListPlus className="w-5 h-5" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Add to Watchlist Playlist
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Item summary */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800/80">
          <img
            src={item.image}
            alt={item.title}
            className="w-10 h-14 object-cover rounded-md shadow-xs shrink-0"
          />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
              {item.mediaType === 'manga' ? 'Book / Manga' : 'Anime'}
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
              {item.title}
            </h4>
          </div>
        </div>

        {/* Existing Playlists List */}
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {playlists.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500 dark:text-neutral-400">
              You don&apos;t have any custom playlists yet. Create your first one below!
            </div>
          ) : (
            playlists.map((pl) => {
              const isAdded = addedIds.has(pl.id);
              return (
                <button
                  key={pl.id}
                  type="button"
                  onClick={() => handleTogglePlaylist(pl)}
                  disabled={isAdded}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isAdded
                      ? 'bg-rose-500/10 border-rose-500/40 text-rose-500 dark:text-rose-400'
                      : 'bg-slate-50 dark:bg-neutral-950/60 border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 text-slate-800 dark:text-neutral-200'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold truncate">{pl.name}</span>
                      {pl.isAiCurated && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-purple-500/15 text-purple-400 border border-purple-500/30">
                          AI Drop
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-neutral-400 block mt-0.5">
                      {pl.items.length} {pl.items.length === 1 ? 'title' : 'titles'}
                    </span>
                  </div>

                  <div className="shrink-0">
                    {isAdded ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-rose-500">
                        <Check className="w-4 h-4" /> Added
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-neutral-800 text-xs font-bold text-slate-700 dark:text-neutral-300 hover:bg-rose-600 hover:text-white transition-colors">
                        + Add
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Create New Playlist Form */}
        {isCreating ? (
          <form onSubmit={handleCreateAndAdd} className="space-y-2 pt-2 border-t border-slate-100 dark:border-neutral-800">
            <span className="text-xs font-bold text-slate-700 dark:text-neutral-300 block">
              New Playlist Name
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="e.g. Chill Weekend Anime, Top 10 Manga..."
                autoFocus
                className="flex-1 h-9 px-3 rounded-xl bg-slate-100 dark:bg-neutral-950 border border-slate-300 dark:border-neutral-700 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-rose-500"
              />
              <button
                type="submit"
                disabled={!newPlaylistName.trim()}
                className="px-3.5 h-9 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                Create & Add
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-2.5 h-9 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 text-xs font-semibold hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-neutral-700 text-xs font-bold text-slate-600 dark:text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-500/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Create New Playlist</span>
          </button>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
