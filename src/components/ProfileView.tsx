import { useState, useEffect } from 'react';
import { Shield, Save, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import { AuthUser } from '../types';
import { updateProfileSetup, logoutUser } from '../services/authService';

interface ProfileViewProps {
  currentUser: AuthUser;
  onProfileUpdated: (user: AuthUser) => void;
}

export function ProfileView({ currentUser, onProfileUpdated }: ProfileViewProps) {
  const [displayName, setDisplayName] = useState(currentUser.display_name || currentUser.username || '');
  const [username, setUsername] = useState(currentUser.username || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (success) {
      timeout = setTimeout(() => setSuccess(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [success]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!displayName.trim() || displayName.trim().length < 2 || displayName.trim().length > 50) {
      setError('Display name must be between 2 and 50 characters.');
      return;
    }

    if (!username.trim() || username.trim().length < 4 || username.trim().length > 30) {
      setError('Username must be between 4 and 30 characters.');
      return;
    }

    // Check for alphanumeric in username (no spaces)
    if (!/^[a-zA-Z0-9_.]+$/.test(username.trim())) {
      setError('Username can only contain letters, numbers, underscores (_), and dots (.).');
      return;
    }

    setLoading(true);
    try {
      const res = await updateProfileSetup(username.trim(), displayName.trim());
      if (res.success) {
        setSuccess(true);
        onProfileUpdated({
          ...currentUser,
          username: username.trim(),
          display_name: displayName.trim(),
          profile_setup_complete: true
        });
      } else {
        setError(res.error || 'Failed to update profile.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Your Profile</h1>
        <p className="text-neutral-400">Manage your account settings, username, and identity.</p>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-neutral-800">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center text-white font-extrabold text-4xl shadow-md border-4 border-neutral-950">
            {displayName.charAt(0).toUpperCase() || username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1">{displayName || 'Anonymous'}</h2>
            <p className="text-rose-400 font-medium">@{username}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-900/50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-200 leading-relaxed">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-900/50 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-200 leading-relaxed">Profile updated successfully!</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6 max-w-lg">
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300 block">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="E.g. Otaku Explorer"
              required
              minLength={2}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-rose-500 transition-colors"
            />
            <p className="text-xs text-neutral-400">Your visible name across Kuro Shelf.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300 block">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                placeholder="otaku_explorer"
                required
                minLength={4}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
            <p className="text-xs text-neutral-400">Must be at least 4 characters. Only letters, numbers, underscores (_), and dots (.).</p>
          </div>

          <div className="pt-4 border-t border-neutral-800">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-sm transition-colors shadow-lg shadow-rose-900/20"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      <div className="mt-8 p-4 rounded-xl bg-neutral-900/50 border border-neutral-800/80 text-xs text-neutral-300 space-y-2">
        <div className="flex items-center gap-2 text-neutral-400">
          <Shield className="w-4 h-4 text-rose-400" />
          <span className="font-semibold text-neutral-200">Account Security</span>
        </div>
        <p className="text-[11px] text-neutral-400 leading-relaxed max-w-2xl">
          Your reading progress, votes, and lists are tied directly to this identity. Kuro Shelf uses Row Level Security (RLS) to ensure your private bookmarks are strictly inaccessible to anyone else. 
        </p>
      </div>

      <div className="mt-6">
        <button
          onClick={async () => {
            await logoutUser();
            window.location.reload();
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
