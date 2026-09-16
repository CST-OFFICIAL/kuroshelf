import { PredictionPoll } from '../types';
import { Vote, CheckCircle2, Clock } from 'lucide-react';

interface PollsViewProps {
  polls: PredictionPoll[];
  userVotes: Record<string, string>;
  onVote: (pollId: string, optionId: string) => void;
}

export function PollsView({ polls, userVotes, onVote }: PollsViewProps) {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-neutral-800/80 pb-6 space-y-3">
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

        {/* Database-Backed Community Notice */}
        <div className="p-3 rounded-xl bg-neutral-900/90 border border-neutral-800 text-[11px] text-neutral-400 flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/25 shrink-0">
            Live Polls
          </span>
          <span>
            Community predictions are synchronized with Kuro Shelf&apos;s database. Votes are validated and tallied in real-time.
          </span>
        </div>
      </div>

      {/* Polls list */}
      <div className="space-y-6">
        {polls.map((poll) => {
          const userSelectedOptionId = userVotes[poll.id];
          const hasVoted = Boolean(userSelectedOptionId);

          return (
            <div
              key={poll.id}
              className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800/80 space-y-5 shadow-lg"
            >
              {/* Poll Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
                <div>
                  {poll.animeTitle && (
                    <span className="text-xs font-bold text-rose-400 uppercase tracking-wide block mb-1">
                      {poll.animeTitle}
                    </span>
                  )}
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {poll.question}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-xs">
                  <span className="flex items-center gap-1 text-neutral-400 px-2.5 py-1 rounded-md bg-neutral-950 border border-neutral-800">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{poll.totalVotes === 0 ? 'No votes yet' : `${poll.totalVotes.toLocaleString()} votes`}</span>
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
                          : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700 hover:bg-neutral-800/60'
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
                          <span className={`font-medium ${isSelected ? 'text-white' : 'text-neutral-200'}`}>
                            {opt.text}
                          </span>
                        </div>

                        {hasVoted && (
                          <div className="flex items-center gap-2 shrink-0 font-bold">
                            <span className={isSelected ? 'text-rose-400' : 'text-neutral-400'}>
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
              <div className="text-[11px] text-neutral-400 flex items-center justify-between pt-1">
                {hasVoted ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Vote registered! Thank you for participating.
                  </span>
                ) : (
                  <span>Click an option to cast your prediction vote.</span>
                )}
                <span>Closes {new Date(poll.endsAt).toLocaleDateString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
