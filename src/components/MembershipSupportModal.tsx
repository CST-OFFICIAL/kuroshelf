import React, { useState } from 'react';
import {
  X,
  Crown,
  Heart,
  Sparkles,
  Check,
  Shield,
  Zap,
  Ban,
  Award,
  Coffee,
  BookOpen,
  Layers,
  Star,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { AuthUser } from '../types';
import {
  getMembership,
  setMembership,
  getDonations,
  submitDonation,
  DonationEntry,
} from '../services/membershipService';

interface MembershipSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  initialTab?: 'membership' | 'donate';
  onMembershipUpdated: (isPremium: boolean) => void;
}

export const MembershipSupportModal: React.FC<MembershipSupportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialTab = 'membership',
  onMembershipUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'membership' | 'donate'>(initialTab);
  const membership = getMembership(currentUser?.id);
  const [isPremium, setIsPremium] = useState(membership.isPremium);

  // Donation Form States
  const [customAmount, setCustomAmount] = useState<string>('25');
  const [supporterName, setSupporterName] = useState<string>(
    currentUser?.display_name || currentUser?.username || ''
  );
  const [message, setMessage] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [donationSuccess, setDonationSuccess] = useState<DonationEntry | null>(null);
  const [donationError, setDonationError] = useState<string | null>(null);
  const [donationsList, setDonationsList] = useState<DonationEntry[]>(() => getDonations());

  if (!isOpen) return null;

  const PRESET_AMOUNTS = [
    { value: 5, label: '$5', icon: Coffee, desc: 'Boba & Coffee' },
    { value: 15, label: '$15', icon: BookOpen, desc: 'Manga Volume' },
    { value: 50, label: '$50', icon: Layers, desc: 'Collector Box Set' },
    { value: 100, label: '$100', icon: Award, desc: 'Otaku Patron' },
    { value: 500, label: '$500', icon: Star, desc: 'Executive Backer' },
    { value: 1000, label: '$1,000', icon: Crown, desc: 'Dragon Deity' },
  ];

  const handleToggleMembership = () => {
    const nextState = !isPremium;
    setIsPremium(nextState);
    setMembership(nextState, 'vip', currentUser?.id);
    onMembershipUpdated(nextState);
  };

  const handleSelectPreset = (val: number) => {
    setCustomAmount(String(val));
    setDonationError(null);
  };

  const handleDonationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDonationError(null);

    const parsed = parseFloat(customAmount);
    if (isNaN(parsed) || parsed < 1) {
      setDonationError('Minimum contribution is $1.00.');
      return;
    }
    if (parsed > 10000) {
      setDonationError('Maximum single contribution is $10,000.00.');
      return;
    }

    const newDonation = submitDonation({
      supporterName: isAnonymous ? 'Anonymous Otaku' : supporterName || 'Generous Otaku',
      amount: parsed,
      message,
      isAnonymous,
      userId: currentUser?.id,
    });

    setDonationsList(getDonations());
    setDonationSuccess(newDonation);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-950/40">
              {activeTab === 'membership' ? (
                <Crown className="w-5 h-5 text-amber-200" />
              ) : (
                <Heart className="w-5 h-5 text-rose-200 fill-current" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white font-display">
                {activeTab === 'membership' ? 'Kuro VIP Membership' : 'Help KuroShelf Grow'}
              </h2>
              <p className="text-xs text-neutral-400">
                Support independent otaku cataloging, community prediction polls, and ad-free discovery.
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

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 pb-0 bg-neutral-950/40 border-b border-neutral-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('membership');
              setDonationSuccess(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs border-t border-x transition-colors ${
              activeTab === 'membership'
                ? 'bg-neutral-900 border-neutral-800 text-amber-400 -mb-px'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Kuro VIP Plans</span>
            {isPremium && (
              <span className="px-1.5 py-0.2 text-[9px] bg-amber-500/20 text-amber-300 rounded font-mono uppercase">
                Active
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('donate')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs border-t border-x transition-colors ${
              activeTab === 'donate'
                ? 'bg-neutral-900 border-neutral-800 text-rose-400 -mb-px'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Help KuroShelf Grow ($1 - $10,000)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {activeTab === 'membership' ? (
            /* ================= MEMBERSHIP TAB ================= */
            <div className="space-y-6">
              {/* Value Proposition Callout */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-neutral-900 to-rose-950/40 border border-amber-500/30 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider border border-amber-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Otaku VIP Tier
                  </span>
                  <span className="text-amber-400 font-bold text-sm">$4.99 / month or $49 / yr</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Why Upgrade to Kuro VIP?
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Kuro VIP directly powers our independent server infrastructure, anime catalog sync,
                  and provides dedicated community benefits built for hardcore anime & manga enthusiasts.
                </p>
              </div>

              {/* Plans Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Free Otaku Card */}
                <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-white">Standard Otaku</h4>
                        <p className="text-[11px] text-neutral-400">Free forever</p>
                      </div>
                      <span className="text-sm font-extrabold text-neutral-300">$0</span>
                    </div>

                    <ul className="space-y-2 text-[11px] text-neutral-300 pt-2 border-t border-neutral-800">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span><strong>1 Prediction Poll</strong> creation per week</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span><strong>Unlimited voting</strong> on all community polls</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Full anime & manga catalog tracking</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Daily otaku streak & check-in rewards</span>
                      </li>
                      <li className="flex items-center gap-2 text-neutral-500">
                        <span className="w-3.5 h-3.5 text-center shrink-0">✕</span>
                        <span>Standard sponsor & affiliate ads</span>
                      </li>
                    </ul>
                  </div>

                  {!isPremium && (
                    <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-center text-neutral-400 text-[11px] font-semibold">
                      Current Plan
                    </div>
                  )}
                </div>

                {/* Kuro VIP Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-950/30 to-neutral-950 border-2 border-amber-500/50 space-y-4 flex flex-col justify-between shadow-lg">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-amber-300">Kuro VIP</h4>
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <p className="text-[11px] text-neutral-400">Everything in Free, plus:</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-amber-400">$4.99</span>
                        <span className="text-[10px] text-neutral-400 block">/month</span>
                      </div>
                    </div>

                    <ul className="space-y-2 text-[11px] text-neutral-200 pt-2 border-t border-neutral-800">
                      <li className="flex items-center gap-2 text-amber-300 font-semibold">
                        <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span><strong>7 Prediction Polls</strong> creation per week</span>
                      </li>
                      <li className="flex items-center gap-2 text-white">
                        <Ban className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span><strong>100% Ad-Free Experience</strong> (no ads)</span>
                      </li>
                      <li className="flex items-center gap-2 text-white">
                        <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span><strong>Golden VIP Crown & Aura</strong> on your profile</span>
                      </li>
                      <li className="flex items-center gap-2 text-white">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Exclusive <strong>Astral Sovereign</strong> avatar frames</span>
                      </li>
                      <li className="flex items-center gap-2 text-white">
                        <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>High-priority shelf cloud backup & export</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleMembership}
                    className={`w-full py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-md flex items-center justify-center gap-2 ${
                      isPremium
                        ? 'bg-neutral-800 text-amber-300 hover:bg-neutral-700 border border-amber-500/40'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950'
                    }`}
                  >
                    <Crown className="w-4 h-4" />
                    <span>{isPremium ? 'Active VIP Member (Click to Toggle)' : 'Upgrade to Kuro VIP'}</span>
                  </button>
                </div>
              </div>

              {/* Note on simulation */}
              <p className="text-[11px] text-neutral-500 text-center">
                Instant activation enabled. You can toggle your Kuro VIP status anytime to test both standard and premium experience.
              </p>
            </div>
          ) : (
            /* ================= DONATE TAB ================= */
            <div className="space-y-6">
              {donationSuccess ? (
                <div className="p-6 rounded-2xl bg-neutral-950 border border-emerald-500/40 text-center space-y-4 animate-in fade-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">
                      Thank You, {donationSuccess.supporterName}!
                    </h3>
                    <p className="text-xs text-neutral-300 max-w-md mx-auto">
                      Your contribution of <strong>${donationSuccess.amount.toFixed(2)}</strong> as a{' '}
                      <span className="text-amber-400 font-bold">{donationSuccess.tierTitle}</span> helps keep Kuro Shelf fast, independent, and community-driven.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs inline-block">
                    Added to the <strong>KuroShelf Wall of Honor</strong>!
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => setDonationSuccess(null)}
                      className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-colors"
                    >
                      Make Another Donation
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Mission Intro */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-neutral-900 to-amber-950/40 border border-rose-500/30 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-extrabold uppercase tracking-wide border border-rose-500/30 flex items-center gap-1">
                        <Heart className="w-3 h-3 text-rose-400 fill-current" />
                        Community Fund
                      </span>
                      <span className="text-xs text-neutral-400">Range: $1.00 — $10,000.00</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      Help KuroShelf Grow
                    </h3>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Kuro Shelf is built for anime & manga fans by passionate fans. Every single dollar goes
                      directly into API server costs, database maintenance, catalog caching, and expanding our
                      open community tools. It means a lot to us, thank you for your donation!❤️
                    </p>
                  </div>

                  {donationError && (
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
                      {donationError}
                    </div>
                  )}

                  <form onSubmit={handleDonationSubmit} className="space-y-4">
                    {/* Preset Amount Grid */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-neutral-200">
                        Choose an Amount or Enter Custom
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {PRESET_AMOUNTS.map((p) => {
                          const Icon = p.icon;
                          const isSelected = customAmount === String(p.value);
                          return (
                            <button
                              key={p.value}
                              type="button"
                              onClick={() => handleSelectPreset(p.value)}
                              className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all ${
                                isSelected
                                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                                  : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                              }`}
                            >
                              <div className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center text-rose-400 shrink-0">
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-white">{p.label}</div>
                                <div className="text-[9px] text-neutral-400 truncate">{p.desc}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Amount Input ($1 to $10,000) */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-neutral-200 flex items-center justify-between">
                        <span>Custom Amount (USD)</span>
                        <span className="text-[10px] text-neutral-400 font-mono">Min $1 — Max $10,000</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-sm">
                          $
                        </span>
                        <input
                          type="number"
                          min="1"
                          max="10000"
                          step="0.01"
                          placeholder="25.00"
                          value={customAmount}
                          onChange={(e) => {
                            setCustomAmount(e.target.value);
                            setDonationError(null);
                          }}
                          className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 font-mono text-sm focus:outline-none focus:border-rose-500 transition-colors"
                          required
                        />
                      </div>
                    </div>

                    {/* Supporter Name & Anonymous toggle */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-neutral-200">
                          Supporter Name / Handle
                        </label>
                        <input
                          type="text"
                          disabled={isAnonymous}
                          placeholder="e.g. MugenOtaku"
                          value={supporterName}
                          onChange={(e) => setSupporterName(e.target.value)}
                          className={`w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors ${
                            isAnonymous ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          maxLength={40}
                        />
                      </div>

                      <div className="space-y-1 flex flex-col justify-end">
                        <label className="flex items-center gap-2 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer hover:border-neutral-700">
                          <input
                            type="checkbox"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                            className="rounded border-neutral-700 text-rose-500 focus:ring-rose-500 bg-neutral-900"
                          />
                          <span className="text-neutral-300 font-medium text-[11px]">
                            Donate Anonymously
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Tribute Message */}
                    <div className="space-y-1">
                      <label className="font-semibold text-neutral-200">
                        Leave a Tribute Message <span className="text-neutral-500">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Love KuroShelf! Keep anime discovery free and open!"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
                        maxLength={120}
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                      <span>
                        Contribute ${parseFloat(customAmount || '0') > 0 ? parseFloat(customAmount).toFixed(2) : '0.00'} to KuroShelf
                      </span>
                    </button>
                  </form>
                </>
              )}

              {/* Wall of Honor */}
              <div className="space-y-3 pt-4 border-t border-neutral-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <h4 className="font-bold text-white text-xs">Community Wall of Honor</h4>
                  </div>
                  <span className="text-[10px] text-neutral-500">
                    {donationsList.length} Generous Contributors
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {donationsList.map((d) => (
                    <div
                      key={d.id}
                      className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between gap-3 text-[11px]"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white truncate">{d.supporterName}</span>
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 text-[9px] font-bold border border-amber-500/25 shrink-0">
                            {d.tierTitle}
                          </span>
                        </div>
                        {d.message && (
                          <p className="text-[10px] text-neutral-400 truncate mt-0.5 italic">
                            "{d.message}"
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-rose-400 text-xs">
                          ${d.amount.toLocaleString()}
                        </span>
                        <span className="text-[9px] text-neutral-500 block">
                          {new Date(d.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
