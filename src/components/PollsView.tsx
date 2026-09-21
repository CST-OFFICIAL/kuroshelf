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
              onClick={onOpenCreatePoll}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-md shadow-rose-950/40 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Make Prediction Poll</span>
            </button>
          </div>
        </div>

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
              <strong>7 poll creations per week</strong>. Everyone can participate and vote on unlimited polls!
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

      {/* Polls list */}
      <div className="space-y-6">
        {filteredPolls.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-3">
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
                className="px-4 py-1.5 rounded-lg bg-neutral-800 text-neutral-200 font-semibold text-xs hover:bg-neutral-700 transition-colors"
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
                className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800/80 space-y-5 shadow-lg hover:border-neutral-700/80 transition-all"
              >
                {/* Poll Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {poll.animeTitle && (
                        <span className="text-xs font-bold text-rose-400 uppercase tracking-wide">
                          {poll.animeTitle}
                        </span>
                      )}

                      {poll.isVipPoll && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-extrabold uppercase tracking-wide border border-amber-500/30 flex items-center gap-1">
                          <Crown className="w-2.5 h-2.5 text-amber-400" />
                          VIP Creator
                        </span>
                      )}

                      {poll.creatorName && (
                        <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                          <User className="w-3 h-3 text-neutral-500" />
                          <span>by {poll.creatorName}</span>
                        </span>
                      )}

                      {poll.animeTitle && onSelectAnime && (
                        <button
                          type="button"
                          onClick={() => onSelectAnime(poll.animeId, poll.animeTitle)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[10px] font-medium border border-rose-500/20 transition-colors cursor-pointer"
                          title={`Inspect ${poll.animeTitle}`}
                        >
                          <span>Inspect Title</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                      {poll.question}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-xs">
                    <span className="flex items-center gap-1 text-neutral-400 px-2.5 py-1 rounded-md bg-neutral-950 border border-neutral-800">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      <span>
                        {poll.totalVotes === 0
                          ? 'No votes yet'
                          : `${poll.totalVotes.toLocaleString()} votes`}
                      </span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {poll.status}
                    </span>
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
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
                        onClick={() => onVote(poll.id, opt.id)}
                        className={`relative w-full text-left p-3.5 rounded-xl border transition-all overflow-hidden ${
                          isSelected
                            ? 'border-rose-500 bg-rose-950/20 shadow-sm'
                            : hasVoted
                            ? 'border-neutral-800 bg-neutral-950/80 cursor-default'
                            : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700 hover:bg-neutral-800/60 cursor-pointer'
                        }`}
                      >
                        {/* Visual progress bar when voted */}
                        {hasVoted && (
                          <div
                            className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                              isSelected ? 'bg-rose-500/25' : 'bg-neutral-800/40'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        )}

                        <div className="relative z-10 flex items-center justify-between gap-4 text-xs sm:text-sm">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? 'border-rose-500 bg-rose-500 text-white'
                                  : 'border-neutral-700 bg-neutral-900'
                              }`}
                            >
                              {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>
                            <span
                              className={`font-medium ${
                                isSelected ? 'text-white' : 'text-neutral-200'
                              }`}
                            >
                              {opt.text}
                            </span>
                          </div>

                          {hasVoted && (
                            <div className="flex items-center gap-2 shrink-0 font-bold">
                              <span
                                className={isSelected ? 'text-rose-400' : 'text-neutral-400'}
                              >
                                {percent}%
                              </span>
                              <span className="text-[11px] text-neutral-400 font-normal">
                                ({opt.votes})
                              </span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Footer status text */}
                <div className="text-[11px] text-neutral-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1">
                  {hasVoted ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Vote registered! Anyone can vote freely on all prediction polls.
                    </span>
                  ) : (
                    <span>Click any option to cast your prediction vote.</span>
                  )}
                  <span>Closes {new Date(poll.endsAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
