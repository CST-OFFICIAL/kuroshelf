import React, { useState } from 'react';
import { X, Plus, Trash2, Vote, Sparkles, AlertCircle, Crown, Calendar } from 'lucide-react';
import { AuthUser } from '../types';
import { getWeeklyPollStatus } from '../services/membershipService';

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  isPremium?: boolean;
  onOpenMembershipModal: () => void;
  onSubmitPoll: (pollData: {
    animeTitle?: string;
    question: string;
    options: string[];
    durationDays: number;
  }) => void;
}

export const CreatePollModal: React.FC<CreatePollModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isPremium = false,
  onOpenMembershipModal,
  onSubmitPoll,
}) => {
  const [animeTitle, setAnimeTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [durationDays, setDurationDays] = useState<number>(7);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const quota = getWeeklyPollStatus(currentUser?.id, isPremium);

  const handleAddOption = () => {
    if (options.length >= 5) {
      setError('You can add a maximum of 5 options per prediction poll.');
      return;
    }
    setOptions([...options, '']);
    setError(null);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      setError('A prediction poll requires at least 2 options.');
      return;
    }
    setOptions(options.filter((_, i) => i !== index));
    setError(null);
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
    if (error) setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!quota.canCreate) {
      setError(
        isPremium
          ? `You have reached your limit of 7 prediction polls for this week. Quota resets in ${quota.resetsInDays} day(s).`
          : `Standard members can create 1 prediction poll per week. Quota resets in ${quota.resetsInDays} day(s). Upgrade to Kuro VIP for 7 polls/week!`
      );
      return;
    }

    if (!question.trim() || question.trim().length < 8) {
      setError('Please provide a clear prediction question of at least 8 characters.');
      return;
    }

    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      setError('Please provide at least 2 non-empty options for your prediction poll.');
      return;
    }

    // Check for duplicate options
    const uniqueOptions = new Set(cleanOptions.map((o) => o.toLowerCase()));
    if (uniqueOptions.size !== cleanOptions.length) {
      setError('All poll options must be unique.');
      return;
    }

    onSubmitPoll({
      animeTitle: animeTitle.trim() || undefined,
      question: question.trim(),
      options: cleanOptions,
      durationDays,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Create Prediction Poll</h2>
                {isPremium && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase tracking-wide border border-amber-500/30 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" />
                    VIP Member
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                Engage the Kuro Shelf otaku community with real predictions.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Quota Indicator Banner */}
          <div
            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              quota.canCreate
                ? 'bg-neutral-950/80 border-neutral-800'
                : 'bg-amber-950/20 border-amber-500/30'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-xs">Weekly Creation Quota</span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                    quota.remaining > 0
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {quota.used} of {quota.limit} used
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                {isPremium
                  ? `Kuro VIP members receive 7 prediction poll creations per week. (${quota.remaining} remaining)`
                  : `Standard members get 1 prediction poll creation per week. (Voting is always unlimited!)`}
              </p>
            </div>

            {!isPremium ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMembershipModal();
                }}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-extrabold text-[11px] transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Get 7 Polls/Wk with VIP</span>
              </button>
            ) : quota.remaining === 0 ? (
              <span className="text-[11px] text-amber-400 font-semibold shrink-0">
                Resets in {quota.resetsInDays} day(s)
              </span>
            ) : null}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-2.5 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Anime / Manga Title (Optional) */}
            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-200">
                Related Anime or Manga Title <span className="text-neutral-500">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. One Piece, Jujutsu Kaisen, Berserk..."
                value={animeTitle}
                onChange={(e) => setAnimeTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
                maxLength={80}
              />
            </div>

            {/* Question */}
            <div className="space-y-1.5">
              <label className="font-semibold text-neutral-200 flex items-center justify-between">
                <span>Prediction Question *</span>
                <span className="text-[10px] text-neutral-500 font-normal">Min. 8 characters</span>
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Will the Demon Slayer Infinity Castle trilogy surpass Mugen Train at the global box office?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors resize-none"
                maxLength={200}
                required
              />
            </div>

            {/* Options */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-neutral-200">
                  Poll Options <span className="text-neutral-500">({options.length}/5)</span>
                </label>
                {options.length < 5 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Option</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-5 text-center text-neutral-500 font-mono text-[11px]">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500 transition-colors"
                      maxLength={70}
                      required
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="p-2 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                        title="Remove option"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Poll Duration */}
            <div className="space-y-1.5 pt-1">
              <label className="font-semibold text-neutral-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-400" />
                <span>Poll Duration</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { days: 3, label: '3 Days' },
                  { days: 7, label: '7 Days' },
                  { days: 14, label: '14 Days' },
                  { days: 30, label: '30 Days' },
                ].map((item) => (
                  <button
                    key={item.days}
                    type="button"
                    onClick={() => setDurationDays(item.days)}
                    className={`py-2 rounded-xl border text-center font-bold text-[11px] transition-colors ${
                      durationDays === item.days
                        ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!quota.canCreate}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold transition-all ${
                  quota.canCreate
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-900/30'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                <Vote className="w-4 h-4" />
                <span>Publish Prediction Poll</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
