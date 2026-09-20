import React, { useState } from 'react';
import { Flame, Shield, Trophy, CheckCircle2, Sparkles, ChevronRight, Zap } from 'lucide-react';
import { DailyStreakInfo, StreakMilestone } from '../types';
import {
  recordDailyCheckIn,
  getLast7DaysStreak,
  getStreakMilestones,
  getMotivationalQuote,
} from '../services/streakService';

interface DailyStreakWidgetProps {
  userId?: string;
  streakInfo: DailyStreakInfo;
  onStreakUpdated: (info: DailyStreakInfo) => void;
  compact?: boolean;
}

export const DailyStreakWidget: React.FC<DailyStreakWidgetProps> = ({
  userId,
  streakInfo,
  onStreakUpdated,
  compact = false,
}) => {
  const [justClaimed, setJustClaimed] = useState(false);
  const [unlockedMilestone, setUnlockedMilestone] = useState<StreakMilestone | null>(null);

  const last7Days = getLast7DaysStreak(streakInfo.streakHistory);
  const milestones = getStreakMilestones(streakInfo.currentStreak);
  const nextMilestone = milestones.find((m) => !m.unlocked) || milestones[milestones.length - 1];
  const motivational = getMotivationalQuote(streakInfo.currentStreak);

  const handleCheckIn = () => {
    const res = recordDailyCheckIn(userId);
    onStreakUpdated(res.info);
    if (res.newlyClaimed) {
      setJustClaimed(true);
      if (res.milestoneUnlocked) {
        setUnlockedMilestone(res.milestoneUnlocked);
      }
      setTimeout(() => {
        setJustClaimed(false);
      }, 4000);
    }
  };

  if (compact) {
    return (
      <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${streakInfo.checkedInToday ? 'bg-amber-500/20 text-amber-400' : 'bg-neutral-800 text-neutral-400'}`}>
              <Flame className={`w-5 h-5 ${streakInfo.checkedInToday ? 'animate-bounce text-amber-400 fill-amber-400/40' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base text-white font-mono">{streakInfo.currentStreak}</span>
                <span className="text-xs font-bold text-neutral-300">Day Streak</span>
              </div>
              <p className="text-[10px] text-neutral-400">
                {streakInfo.checkedInToday ? 'Streak secured today!' : 'Pending today’s check-in'}
              </p>
            </div>
          </div>

          {!streakInfo.checkedInToday ? (
            <button
              type="button"
              onClick={handleCheckIn}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold text-xs shadow-md shadow-rose-950/40 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>Check In</span>
            </button>
          ) : (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Active</span>
            </span>
          )}
        </div>

        {/* 7 Day Dots */}
        <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80">
          {last7Days.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[9px] font-medium text-neutral-400">{d.dayName[0]}</span>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                  d.checkedIn
                    ? 'bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-xs shadow-amber-500/30'
                    : d.isToday
                    ? 'border-2 border-dashed border-amber-400/80 text-amber-300'
                    : 'bg-neutral-800 text-neutral-500'
                }`}
                title={`${d.date}: ${d.checkedIn ? 'Checked in' : 'Missed'}`}
              >
                {d.checkedIn ? '✓' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl p-6 bg-gradient-to-b from-neutral-900/95 via-neutral-900/90 to-neutral-950/95 border border-amber-500/30 shadow-2xl shadow-amber-950/20 overflow-hidden space-y-6">
      {/* Background ambient flame glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-amber-500/15 via-rose-500/10 to-transparent blur-3xl pointer-events-none" />

      {/* Header and Streak counter */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800/80">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
              streakInfo.checkedInToday
                ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-amber-400 text-white shadow-lg shadow-amber-500/30 ring-2 ring-amber-400/40'
                : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
            }`}>
              <Flame className={`w-8 h-8 ${streakInfo.checkedInToday ? 'animate-pulse text-white fill-white/30' : 'text-neutral-400'}`} />
            </div>
            {streakInfo.checkedInToday && (
              <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-emerald-500 text-white">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white">
                {streakInfo.currentStreak} Day {streakInfo.currentStreak === 1 ? 'Streak' : 'Streak'}
              </h3>
              {streakInfo.currentStreak >= 3 && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  On Fire
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {streakInfo.checkedInToday
                ? '🔥 You have checked in today! Come back tomorrow to keep the flame alive.'
                : '⚡ Log in or check in now to extend your daily streak by +1 day!'}
            </p>
          </div>
        </div>

        {/* Check-In Action Button */}
        <div className="flex items-center gap-3">
          {!streakInfo.checkedInToday ? (
            <button
              type="button"
              onClick={handleCheckIn}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-extrabold text-sm shadow-xl shadow-rose-950/50 hover:shadow-rose-900/60 transition-all cursor-pointer flex items-center justify-center gap-2 transform active:scale-95"
            >
              <Zap className="w-4 h-4 fill-white animate-bounce" />
              <span>Claim Daily Check-In</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Checked In for Today!</span>
            </div>
          )}
        </div>
      </div>

      {/* Celebration Banner if just claimed */}
      {justClaimed && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-neutral-900 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            <span className="font-bold">
              Check-in recorded! Daily streak is now <strong className="text-white">{streakInfo.currentStreak} Days</strong>.
            </span>
          </div>
          {unlockedMilestone && (
            <span className="px-2 py-0.5 rounded-md bg-amber-400 text-neutral-950 font-black text-[10px] uppercase">
              Milestone: {unlockedMilestone.title}!
            </span>
          )}
        </div>
      )}

      {/* 7-Day Activity Calendar Matrix */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span className="font-semibold text-neutral-300">Past 7 Days Activity</span>
          <span className="text-[11px] font-mono">
            Longest Record: <strong className="text-white">{streakInfo.longestStreak} Days</strong>
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {last7Days.map((day, idx) => (
            <div
              key={idx}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                day.checkedIn
                  ? 'bg-gradient-to-b from-amber-500/20 to-rose-500/10 border-amber-500/40 text-white shadow-xs shadow-amber-500/20'
                  : day.isToday
                  ? 'bg-neutral-800/80 border-amber-400/60 text-amber-300 animate-pulse'
                  : 'bg-neutral-900/60 border-neutral-800/80 text-neutral-500'
              }`}
            >
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">{day.dayName}</span>
              <div className="my-1">
                {day.checkedIn ? (
                  <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                ) : day.isToday ? (
                  <span className="text-xs font-bold text-amber-400">TODAY</span>
                ) : (
                  <span className="text-xs font-mono text-neutral-600">•</span>
                )}
              </div>
              <span className="text-[9px] font-mono text-neutral-400">{day.date.split('-')[2]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Shield Protection & Next Milestone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        {/* Streak Shield */}
        <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${streakInfo.freezeAvailable ? 'bg-cyan-500/15 text-cyan-400' : 'bg-neutral-800 text-neutral-500'}`}>
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Streak Freeze Shield</h4>
              <p className="text-[11px] text-neutral-400">
                {streakInfo.freezeAvailable ? 'Active: protects 1 missed day' : 'Used: renews every 7-day milestone'}
              </p>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
            streakInfo.freezeAvailable
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'bg-neutral-800 text-neutral-500'
          }`}>
            {streakInfo.freezeAvailable ? 'Shield Ready' : 'Depleted'}
          </span>
        </div>

        {/* Next Milestone */}
        <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Next: {nextMilestone.title}</h4>
              <p className="text-[11px] text-neutral-400">
                {Math.max(0, nextMilestone.days - streakInfo.currentStreak)} more {nextMilestone.days - streakInfo.currentStreak === 1 ? 'day' : 'days'} ({nextMilestone.badge})
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-600" />
        </div>
      </div>

      {/* Motivational anime quote */}
      <div className="pt-2 text-center text-xs text-neutral-400 italic">
        "{motivational.quote}" — <span className="text-neutral-300 not-italic font-medium">{motivational.anime}</span>
      </div>
    </div>
  );
};
