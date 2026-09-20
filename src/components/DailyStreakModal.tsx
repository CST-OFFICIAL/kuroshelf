import React from 'react';
import { X, Flame, Trophy, Calendar, Sparkles } from 'lucide-react';
import { DailyStreakInfo } from '../types';
import { DailyStreakWidget } from './DailyStreakWidget';
import { getStreakMilestones } from '../services/streakService';

interface DailyStreakModalProps {
  userId?: string;
  streakInfo: DailyStreakInfo;
  onStreakUpdated: (info: DailyStreakInfo) => void;
  onClose: () => void;
}

export const DailyStreakModal: React.FC<DailyStreakModalProps> = ({
  userId,
  streakInfo,
  onStreakUpdated,
  onClose,
}) => {
  const milestones = getStreakMilestones(streakInfo.currentStreak);

  return (
    <div
      id="daily-streak-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-xl rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 sm:p-8 space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Flame className="w-6 h-6 fill-amber-400/30" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-display text-white">Daily Otaku Streak</h2>
              <p className="text-xs text-neutral-400">Track your daily visits, earn milestone badges, and protect your streak.</p>
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

        {/* Main Widget */}
        <DailyStreakWidget
          userId={userId}
          streakInfo={streakInfo}
          onStreakUpdated={onStreakUpdated}
          compact={false}
        />

        {/* Milestones Showcase */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Streak Milestone Badges</span>
            </span>
            <span className="text-[11px] font-mono text-neutral-400">
              {milestones.filter((m) => m.unlocked).length} / {milestones.length} Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {milestones.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                  m.unlocked
                    ? 'bg-gradient-to-r from-amber-500/15 to-neutral-900 border-amber-500/40 text-white'
                    : 'bg-neutral-950/60 border-neutral-800/80 text-neutral-500 opacity-60'
                }`}
              >
                <div className={`p-2 rounded-xl text-base shrink-0 ${m.unlocked ? 'bg-amber-400 text-neutral-950 font-bold' : 'bg-neutral-800 text-neutral-500'}`}>
                  {m.badge.split(' ')[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h5 className={`text-xs font-bold truncate ${m.unlocked ? 'text-amber-200' : 'text-neutral-400'}`}>
                      {m.title}
                    </h5>
                    <span className="text-[10px] font-mono font-bold text-neutral-400 shrink-0">
                      {m.days}d
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-2">
                    {m.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info stats */}
        <div className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-rose-400" />
            <span>Total Check-Ins: <strong className="text-white">{streakInfo.totalCheckIns || 0}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-400 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Resets daily at 00:00 local time</span>
          </div>
        </div>
      </div>
    </div>
  );
};
