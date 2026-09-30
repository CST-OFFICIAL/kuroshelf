import { useState } from 'react';
import { PredictionPoll, AuthUser } from '../types';
import {
  Vote,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Crown,
  Sparkles,
  User,
  TrendingUp,
} from 'lucide-react';
import { getWeeklyPollStatus } from '../services/membershipService';

interface PollsViewProps {
  polls: PredictionPoll[];
  userVotes: Record<string, string>;
  onVote: (pollId: string, optionId: string) => void;
  onSelectAnime?: (animeId?: number, animeTitle?: string) => void;
  currentUser: AuthUser | null;
  isPremium?: boolean;
  onOpenCreatePoll: () => void;
  onOpenMembershipModal: () => void;
  onOpenAuthModal?: () => void;
}

export function PollsView({
  polls,
  userVotes,
  onVote,
  onSelectAnime,
  currentUser,
  isPremium = false,
  onOpenCreatePoll,
  onOpenMembershipModal,
  onOpenAuthModal,
}: PollsViewProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'voted' | 'active'>('all');
  const quota = getWeeklyPollStatus(currentUser?.id, isPremium);

  const filteredPolls = polls.filter((poll) => {
    if (filterMode === 'voted') {
      return Boolean(userVotes[poll.id]);
    }
    if (filterMode === 'active') {
      return poll.status === 'active';
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-neutral-800/80 pb-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-rose-400 text-xs uppercase font-bold tracking-wider mb-1">
              <Vote className="w-4 h-4" />
              <span>Community Predictions</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
              Anime & Manga Prediction Polls
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Predict upcoming story arcs, box office achievements, and anime milestones.
            </p>
          </div>

          {/* Action Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (!currentUser) {
                  onOpenAuthModal?.();
                  return;
                }
                onOpenCreatePoll();
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-md shadow-rose-950/40 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Make Prediction Poll</span>
            </button>
          </div>
        </div>

        {/* Guest Banner if not signed in */}
        {!currentUser && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <p className="font-bold text-white text-xs">Account Required to Participate in Predictions</p>
                <p className="text-[11px] text-neutral-300">Open an account or sign in to vote in weekly matchups and make your own predictions!</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs transition-all shadow-md shadow-rose-950/40 cursor-pointer shrink-0"
            >
              Open Account / Sign In
            </button>
          </div>
        )}

        {/* Weekly Quota Card & VIP Perks */}
        <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs">Your Weekly Poll Creation Quota:</span>
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                  quota.remaining > 0
                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}
              >
                {quota.used} of {quota.limit} used this week
              </span>
              {isPremium ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase tracking-wide border border-amber-500/30 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" />
                  VIP (7 Polls/Wk)
                </span>
              ) : (
                <span className="text-[10px] text-neutral-400">Standard (1 Poll/Wk)</span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400">
              Free members receive <strong>1 poll creation per week</strong>. Kuro VIP members receive{' '}
              <strong>7 poll creations per week</strong>. Open an account to participate and vote on unlimited prediction polls!
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isPremium ? (
              <button
                type="button"
                onClick={onOpenMembershipModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-extrabold text-[11px] transition-all shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Upgrade to 7 Polls/Wk</span>
              </button>
            ) : (
              <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" />
                <span>VIP Active</span>
              </span>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-1.5 bg-neutral-900/60 p-1 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filterMode === 'all'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All Polls ({polls.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('active')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filterMode === 'active'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('voted')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filterMode === 'voted'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              My Votes ({Object.keys(userVotes).length})
            </button>
          </div>

          <span className="text-[11px] text-neutral-500 hidden sm:inline">
            Live database tallying & real-time percentage
          </span>
        </div>
      </div>

      {/* Polls 2-Column Responsive Grid (Matches Library Predictions Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredPolls.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-3xl bg-[#10141e] border border-slate-800 space-y-3">
            <Vote className="w-10 h-10 text-neutral-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No prediction polls found</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              {filterMode === 'voted'
                ? "You haven't participated in any prediction polls yet. Click 'All Polls' to cast your votes!"
                : 'Be the first to publish an anime or manga prediction poll for the Kuro Shelf community.'}
            </p>
            {filterMode === 'voted' ? (
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className="px-4 py-1.5 rounded-xl bg-neutral-800 text-neutral-200 font-semibold text-xs hover:bg-neutral-700 transition-colors"
              >
                View All Polls
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenCreatePoll}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 transition-colors shadow-md"
              >
                Create Prediction Poll
              </button>
            )}
          </div>
        ) : (
          filteredPolls.map((poll) => {
            const userSelectedOptionId = userVotes[poll.id];
            const hasVoted = Boolean(userSelectedOptionId);

            return (
              <div
                key={poll.id}
                className="p-5 sm:p-6 rounded-3xl bg-[#10141e] border border-slate-800 shadow-md space-y-4 hover:border-rose-500/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Poll Header: Category + Timer */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {poll.animeTitle ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 font-bold border border-rose-500/30 text-xs">
                          {poll.animeTitle}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 font-bold border border-rose-500/30 text-xs">
                          {poll.category || 'General Anime'}
                        </span>
                      )}

                      {poll.isVipPoll && (
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase tracking-wide border border-amber-500/30 flex items-center gap-1">
                          <Crown className="w-2.5 h-2.5 text-amber-400" />
                          VIP
                        </span>
                      )}

                      {poll.animeTitle && onSelectAnime && (
                        <button
                          type="button"
                          onClick={() => onSelectAnime(poll.animeId, poll.animeTitle)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[10px] font-medium border border-rose-500/20 transition-colors cursor-pointer"
                          title={`Inspect ${poll.animeTitle}`}
                        >
                          <span>Inspect Title</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>

                    <span className="flex items-center gap-1 font-semibold text-slate-400 shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(poll.endsAt).toLocaleDateString()}</span>
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                    {poll.question}
                  </h3>
                </div>

                {/* Options with live percentage bars */}
                <div className="space-y-2.5 pt-1">
                  {poll.options.map((opt) => {
                    const percent =
                      poll.totalVotes > 0
                        ? Math.round((opt.votes / poll.totalVotes) * 100)
                        : 0;
                    const isSelected = userSelectedOptionId === opt.id;

                    return (
                      <button
                        key={opt.id}
                        disabled={hasVoted}
                        type="button"
                        onClick={() => {
                          if (!currentUser) {
                            onOpenAuthModal?.();
                            return;
                          }
                          onVote(poll.id, opt.id);
                        }}
                        className={`relative w-full text-left p-3.5 rounded-2xl border transition-all overflow-hidden ${
                          isSelected
                            ? 'bg-rose-950/40 border-rose-500 text-white shadow-md shadow-rose-950/30'
                            : hasVoted
                            ? 'bg-slate-900/90 border-slate-800 text-slate-300 cursor-default'
                            : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 text-slate-300 hover:text-white cursor-pointer'
                        }`}
                      >
                        {/* Progress fill bar */}
                        {hasVoted && (
                          <div
                            className={`absolute inset-0 opacity-20 pointer-events-none transition-all duration-500 ${
                              isSelected ? 'bg-rose-500' : 'bg-slate-600'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        )}

                        <div className="relative z-10 flex items-center justify-between gap-3 text-xs sm:text-sm">
                          <span className="font-bold flex items-center gap-2">
                            {isSelected ? (
                              <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />
                            )}
                            <span>{opt.text}</span>
                          </span>
                          {hasVoted && (
                            <span className="font-mono font-black text-xs shrink-0 text-slate-400">
                              {percent}% ({opt.votes})
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Footer attribution & Total Votes */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/80 font-medium">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-neutral-500" />
                    <span>By {poll.creatorName || 'Otaku Analyst'}</span>
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-slate-400">
                    <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                    {poll.totalVotes} total votes
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
