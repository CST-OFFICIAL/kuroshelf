import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  CheckCircle2,
  LogOut,
  X,
  Crown,
  Sparkles,
  BookOpen,
  Tv,
} from 'lucide-react';
import { AuthUser, SavedAccount } from '../types';
import {
  getSavedAccounts,
  switchAccount,
  removeSavedAccount,
  quickLogInPresetAccount,
} from '../services/authService';
import { AnimeAvatar } from './AnimeAvatar';
import { getStoredProfileCustomization } from '../services/profileCustomizationService';

interface AccountSwitcherModalProps {
  currentUser: AuthUser | null;
  onClose: () => void;
  onAccountSwitched: (user: AuthUser) => void;
  onOpenAddNewAccount: () => void;
}

export const AccountSwitcherModal: React.FC<AccountSwitcherModalProps> = ({
  currentUser,
  onClose,
  onAccountSwitched,
  onOpenAddNewAccount,
}) => {
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  useEffect(() => {
    setSavedAccounts(getSavedAccounts());
  }, [currentUser]);

  const handleSwitch = async (userId: string) => {
    if (currentUser?.id === userId) return;
    setSwitchingId(userId);
    try {
      const switched = await switchAccount(userId);
      if (switched) {
        onAccountSwitched(switched);
        onClose();
      }
    } finally {
      setSwitchingId(null);
    }
  };

  const handleRemove = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    const res = await removeSavedAccount(userId);
    setSavedAccounts(res.remainingAccounts);
    if (res.nextActiveUser) {
      onAccountSwitched(res.nextActiveUser);
    }
  };

  const handleQuickAddPreset = async (presetAccountId: string) => {
    setSwitchingId(presetAccountId);
    try {
      const user = await quickLogInPresetAccount(presetAccountId);
      onAccountSwitched(user);
      onClose();
    } finally {
      setSwitchingId(null);
    }
  };

  return (
    <div
      id="account-switcher-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 sm:p-7 space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black font-display text-white">Switch Account</h2>
              <p className="text-xs text-neutral-400">
                Manage and switch between your Kuro Shelf accounts seamlessly.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Currently Logged In Accounts List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold text-neutral-300">
              Logged In Accounts ({savedAccounts.length})
            </span>
            <span className="text-[11px] font-mono text-neutral-400">
              Active: <strong className="text-rose-400">@{currentUser?.username || 'Guest'}</strong>
            </span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {savedAccounts.map((account) => {
              const isActive = currentUser?.id === account.user.id;
              const isAdmin = account.user.role === 'admin' || account.user.username.toLowerCase() === 'kuro';
              const custom = getStoredProfileCustomization(account.user.id);

              return (
                <div
                  key={account.user.id}
                  onClick={() => !isActive && handleSwitch(account.user.id)}
                  className={`w-full p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 text-left ${
                    isActive
                      ? 'bg-rose-950/20 border-rose-500/50 shadow-md shadow-rose-950/20'
                      : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/60 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <AnimeAvatar
                        presetId={custom.avatar_preset || 'silly_derp_cat'}
                        customAvatarUrl={account.user.avatar_url || undefined}
                        frameColor={custom.avatar_frame_color || 'none'}
                        size="md"
                        isAdmin={isAdmin}
                      />
                      {isActive && (
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-neutral-900" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white truncate">
                          {account.user.display_name || account.user.username}
                        </h4>
                        {isAdmin && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase flex items-center gap-0.5 border border-amber-500/30">
                            <Crown className="w-2.5 h-2.5" />
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 truncate">
                        @{account.user.username} • <span className="font-mono text-[11px] text-neutral-400">{account.user.email}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isActive ? (
                      <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={switchingId === account.user.id}
                        onClick={() => handleSwitch(account.user.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-rose-600 hover:text-white text-neutral-300 text-xs font-bold transition-all cursor-pointer"
                      >
                        {switchingId === account.user.id ? 'Switching...' : 'Switch'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleRemove(e, account.user.id)}
                      className="p-1.5 rounded-xl text-neutral-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                      title="Log out and remove this account"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Log In Additional Accounts (User Request: "Log in two more accounts") */}
        <div className="space-y-3 pt-2 border-t border-neutral-800">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Log In Two More Accounts</span>
            </span>
            <span className="text-[10px] text-neutral-400">1-click instant login</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Account 1: Ren Manga Savant */}
            <button
              type="button"
              disabled={switchingId === 'acc_ren_mangasavant' || currentUser?.id === 'acc_ren_mangasavant'}
              onClick={() => handleQuickAddPreset('acc_ren_mangasavant')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                currentUser?.id === 'acc_ren_mangasavant'
                  ? 'bg-amber-950/20 border-amber-500/40 opacity-70'
                  : 'bg-neutral-950/70 border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-rose-400 flex items-center justify-center text-sm font-bold text-neutral-950">
                  🐹
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-white truncate">Ren • Manga Savant</h5>
                  <p className="text-[10px] text-amber-300 font-mono">@mangasavant</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/80">
                <span className="flex items-center gap-1 text-[10px]">
                  <BookOpen className="w-3 h-3 text-amber-400" />
                  Manga Collector
                </span>
                <span className="font-bold text-xs text-amber-400 flex items-center gap-0.5">
                  {currentUser?.id === 'acc_ren_mangasavant' ? 'Active' : 'Log In →'}
                </span>
              </div>
            </button>

            {/* Account 2: Sakura Anime Reviewer */}
            <button
              type="button"
              disabled={switchingId === 'acc_sakura_animereviewer' || currentUser?.id === 'acc_sakura_animereviewer'}
              onClick={() => handleQuickAddPreset('acc_sakura_animereviewer')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                currentUser?.id === 'acc_sakura_animereviewer'
                  ? 'bg-rose-950/20 border-rose-500/40 opacity-70'
                  : 'bg-neutral-950/70 border-neutral-800 hover:border-rose-500/50 hover:bg-neutral-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-400 to-purple-500 flex items-center justify-center text-sm font-bold text-white">
                  👻
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-white truncate">Sakura • Anime Reviewer</h5>
                  <p className="text-[10px] text-rose-300 font-mono">@sakuradreamer</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/80">
                <span className="flex items-center gap-1 text-[10px]">
                  <Tv className="w-3 h-3 text-rose-400" />
                  Seasonal Critic
                </span>
                <span className="font-bold text-xs text-rose-400 flex items-center gap-0.5">
                  {currentUser?.id === 'acc_sakura_animereviewer' ? 'Active' : 'Log In →'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Custom Add Account Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAddNewAccount();
            }}
            className="w-full px-5 py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4 text-rose-400" />
            <span>Add Custom Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
