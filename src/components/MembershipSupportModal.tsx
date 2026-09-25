import React, { useState, useEffect } from 'react';
import {
  Crown,
  Heart,
  Sparkles,
  Zap,
  Shield,
  Ban,
  Check,
  X,
  CreditCard,
  Building,
  Smartphone,
  Globe,
  AlertCircle,
  Users,
  Coffee,
  BookOpen,
  Layers,
  Award,
  Star,
  CheckCircle2,
  Lock,
  ArrowRight,
  Info
} from 'lucide-react';
import { AuthUser } from '../types';
import {
  getMembership,
  subscribeMembership,
  cancelMembership,
  submitDonation,
  getDonations,
  DonationEntry,
  MembershipInfo
} from '../services/membershipService';
import { VerifiedMemberBadge } from './VerifiedMemberBadge';

interface MembershipSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  initialTab?: 'membership' | 'donate';
  onMembershipUpdated: (isPremium: boolean) => void;
}

type PaymentMethodType = 'upi' | 'card' | 'netbanking' | 'paypal';

export const MembershipSupportModal: React.FC<MembershipSupportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialTab = 'membership',
  onMembershipUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'membership' | 'donate'>(initialTab);
  const [membership, setMembershipState] = useState<MembershipInfo>(() => getMembership(currentUser?.id));
  const isPremium = membership.isPremium;

  // Membership Plan selection
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [checkoutStep, setCheckoutStep] = useState<'plans' | 'checkout' | 'success' | 'confirm_cancel'>('plans');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('upi');

  // Checkout inputs
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState(currentUser?.display_name || currentUser?.username || '');
  const [selectedBank, setSelectedBank] = useState('sbi');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [lastTxnId, setLastTxnId] = useState<string | null>(null);

  // Donation Form States
  const [customAmount, setCustomAmount] = useState<string>('25');
  const [supporterName, setSupporterName] = useState<string>(
    currentUser?.display_name || currentUser?.username || ''
  );
  const [message, setMessage] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [donationMethod, setDonationMethod] = useState<PaymentMethodType>('upi');
  const [donationSuccess, setDonationSuccess] = useState<DonationEntry | null>(null);
  const [donationError, setDonationError] = useState<string | null>(null);
  const [donationsList, setDonationsList] = useState<DonationEntry[]>(() => getDonations());

  useEffect(() => {
    if (isOpen) {
      setMembershipState(getMembership(currentUser?.id));
      setDonationsList(getDonations());
      setCheckoutStep('plans');
      setPaymentError(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const PRESET_AMOUNTS = [
    { value: 5, label: '$5', icon: Coffee, desc: 'Boba & Coffee' },
    { value: 15, label: '$15', icon: BookOpen, desc: 'Manga Volume' },
    { value: 50, label: '$50', icon: Layers, desc: 'Collector Box Set' },
    { value: 100, label: '$100', icon: Award, desc: 'Otaku Patron' },
    { value: 500, label: '$500', icon: Star, desc: 'Executive Backer' },
    { value: 1000, label: '$1,000', icon: Crown, desc: 'Dragon Deity' },
  ];

  const handleStartCheckout = (cycle: 'monthly' | 'yearly') => {
    setSelectedCycle(cycle);
    setPaymentError(null);
    setCheckoutStep('checkout');
  };

  const handleProcessPayment = () => {
    setPaymentError(null);

    // Basic client validation
    if (paymentMethod === 'upi' && !upiId.trim()) {
      setPaymentError('Please enter a valid UPI ID (e.g. yourname@oksbi or yourname@paytm).');
      return;
    }
    if (paymentMethod === 'card') {
      if (!cardNumber.replace(/\s/g, '') || cardNumber.length < 12) {
        setPaymentError('Please enter a valid 16-digit card number.');
        return;
      }
      if (!cardExpiry || !cardCvv) {
        setPaymentError('Please provide card expiry date and CVV.');
        return;
      }
    }

    setIsProcessingPayment(true);

    // Realistic processing latency simulation
    setTimeout(() => {
      const generatedTxn = `TXN-VIP-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const updated = subscribeMembership({
        cycle: selectedCycle,
        userId: currentUser?.id,
        paymentMethod,
      });

      setMembershipState(updated);
      setIsProcessingPayment(false);
      setLastTxnId(generatedTxn);
      setCheckoutStep('success');
      onMembershipUpdated(true);
    }, 1200);
  };

  const handleConfirmCancel = () => {
    const updated = cancelMembership(currentUser?.id);
    setMembershipState(updated);
    setCheckoutStep('plans');
    onMembershipUpdated(false);
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

  const monthlyPrice = 4.99;
  const yearlyRegular = monthlyPrice * 12; // 59.88
  const yearlyDiscounted = 41.90; // 30% discount (~3.49/mo)
  const yearlySavings = (yearlyRegular - yearlyDiscounted).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between bg-slate-50 dark:bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-950/40">
              {activeTab === 'membership' ? (
                <Crown className="w-5 h-5 text-amber-200" />
              ) : (
                <Heart className="w-5 h-5 text-rose-200 fill-current" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-display font-extrabold text-slate-900 dark:text-white">
                  {activeTab === 'membership' ? 'Kuro VIP Membership' : 'Support KuroShelf & Community'}
                </h2>
                {isPremium && activeTab === 'membership' && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-[10px] font-bold">
                    <VerifiedMemberBadge size="xs" />
                    <span>VIP Member</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                {activeTab === 'membership'
                  ? 'Unlock high-tier otaku perks, verified member badge, and 100% ad-free experience'
                  : 'Independent community fund powering fast anime servers & catalog ingestion'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 dark:border-neutral-800 bg-slate-100/70 dark:bg-neutral-950/50 px-5 pt-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('membership');
              setCheckoutStep('plans');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs border-t border-x transition-colors cursor-pointer ${
              activeTab === 'membership'
                ? 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-amber-700 dark:text-amber-400 -mb-px'
                : 'border-transparent text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Kuro VIP Plans</span>
            {isPremium && (
              <span className="px-1.5 py-0.2 text-[9px] bg-sky-500/20 text-sky-600 dark:text-sky-300 rounded font-mono uppercase flex items-center gap-1">
                <VerifiedMemberBadge size="xs" />
                Active
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('donate')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs border-t border-x transition-colors cursor-pointer ${
              activeTab === 'donate'
                ? 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 text-rose-600 dark:text-rose-400 -mb-px'
                : 'border-transparent text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Help KuroShelf Grow ($1 - $10,000)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs bg-white dark:bg-neutral-900">
          {activeTab === 'membership' ? (
            /* ================= MEMBERSHIP TAB ================= */
            <div className="space-y-6">
              {/* CURRENT ACTIVE VIP DASHBOARD */}
              {isPremium && checkoutStep === 'plans' ? (
                <div className="space-y-5">
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-amber-500/10 to-indigo-500/10 border border-sky-500/30 space-y-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/30">
                          <Crown className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                              Active Kuro VIP Member
                            </h3>
                            <VerifiedMemberBadge size="sm" />
                          </div>
                          <p className="text-xs text-slate-600 dark:text-neutral-300">
                            Plan:{' '}
                            <strong className="text-sky-600 dark:text-sky-400 font-semibold capitalize">
                              {membership.billingCycle === 'yearly' ? 'Yearly Membership' : 'Monthly Membership'}
                            </strong>{' '}
                            • Blue verified subscriber badge enabled
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Subscription Active</span>
                        </span>
                        {membership.expiresAt && (
                          <span className="text-[10px] text-slate-500 dark:text-neutral-400 block mt-1">
                            Valid until: {new Date(membership.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-neutral-300">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span><strong>Verified Blue Icon</strong> next to your name</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 dark:text-neutral-300">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span><strong>7 Prediction Polls</strong> per week</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 dark:text-neutral-300">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span><strong>100% Ad-Free</strong> Experience</span>
                      </div>
                    </div>
                  </div>

                  {/* Cancel Membership Action */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-xs">Manage Subscription</h4>
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                        You can cancel your VIP subscription renewal at any time.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCheckoutStep('confirm_cancel')}
                      className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:hover:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-900/50 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Cancel Membership
                    </button>
                  </div>
                </div>
              ) : checkoutStep === 'confirm_cancel' ? (
                /* CONFIRM CANCELLATION STEP */
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-neutral-950 border border-red-500/30 text-center space-y-4 animate-in fade-in">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Cancel VIP Subscription?
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-neutral-300 max-w-md mx-auto">
                      Are you sure you want to cancel your VIP membership? You will no longer be charged,
                      and you will retain your VIP benefits and blue verified badge until the end of your billing cycle.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setCheckoutStep('plans')}
                      className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-800 dark:text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Keep My VIP Subscription
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmCancel}
                      className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-red-900/30"
                    >
                      Confirm Cancellation
                    </button>
                  </div>
                </div>
              ) : checkoutStep === 'checkout' ? (
                /* ================= CHECKOUT STEP ================= */
                <div className="space-y-5 animate-in fade-in">
                  {/* Back to plans button */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCheckoutStep('plans')}
                      className="text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      ← Back to Plans
                    </button>
                    <span className="text-slate-500 dark:text-neutral-400 text-[11px] font-medium">
                      Encrypted 256-bit Secure Checkout
                    </span>
                  </div>

                  {/* Order Summary Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 via-amber-500/10 to-indigo-500/10 border border-sky-500/30 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                          Kuro VIP {selectedCycle === 'yearly' ? 'Yearly Pass' : 'Monthly Pass'}
                        </span>
                        <VerifiedMemberBadge size="xs" />
                        {selectedCycle === 'yearly' && (
                          <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                            30% OFF
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-neutral-300">
                        Duration: {selectedCycle === 'yearly' ? '365 Days (1 Year)' : '30 Days (1 Month)'} • Includes Blue Member Badge
                      </p>
                    </div>

                    <div className="text-right">
                      {selectedCycle === 'yearly' ? (
                        <>
                          <span className="text-xs text-slate-400 line-through mr-1.5">${yearlyRegular.toFixed(2)}</span>
                          <span className="text-lg font-black text-amber-600 dark:text-amber-400">${yearlyDiscounted.toFixed(2)}</span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">
                            Save ${yearlySavings}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-lg font-black text-amber-600 dark:text-amber-400">${monthlyPrice}</span>
                          <span className="text-[10px] text-slate-500 dark:text-neutral-400 block">/month</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Educational Information on Connecting Bank / Vercel Integration */}
                  <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-start gap-2.5 text-slate-700 dark:text-blue-200 text-[11px] leading-relaxed">
                    <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-blue-900 dark:text-blue-300">Connecting Bank Accounts & Production Payments:</strong>
                      <p className="mt-0.5 text-slate-600 dark:text-neutral-300">
                        You should never write your private bank account details into source code. When deploying on Vercel or any server, payment gateways like <strong>Razorpay (India UPI/Cards)</strong>, <strong>Cashfree</strong>, or <strong>PayPal</strong> are configured via secure <strong>Environment Variables</strong> in your Vercel Dashboard. Payments route safely through the gateway and deposit straight into your verified bank account!
                      </p>
                    </div>
                  </div>

                  {/* Payment Methods Tabs */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-900 dark:text-white block">
                      Select Payment Method
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => { setPaymentMethod('upi'); setPaymentError(null); }}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethod === 'upi'
                            ? 'bg-sky-500/15 border-sky-500 text-sky-800 dark:text-sky-300 shadow-xs'
                            : 'bg-slate-50 dark:bg-neutral-950 border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:border-slate-300'
                        }`}
                      >
                        <Smartphone className="w-4 h-4 text-sky-500" />
                        <span className="font-bold text-xs">UPI (India)</span>
                        <span className="text-[9px] text-slate-500 dark:text-neutral-400">GPay / PhonePe / Paytm</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setPaymentMethod('card'); setPaymentError(null); }}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethod === 'card'
                            ? 'bg-sky-500/15 border-sky-500 text-sky-800 dark:text-sky-300 shadow-xs'
                            : 'bg-slate-50 dark:bg-neutral-950 border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:border-slate-300'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-amber-500" />
                        <span className="font-bold text-xs">Cards</span>
                        <span className="text-[9px] text-slate-500 dark:text-neutral-400">RuPay / Visa / MC</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setPaymentMethod('netbanking'); setPaymentError(null); }}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethod === 'netbanking'
                            ? 'bg-sky-500/15 border-sky-500 text-sky-800 dark:text-sky-300 shadow-xs'
                            : 'bg-slate-50 dark:bg-neutral-950 border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:border-slate-300'
                        }`}
                      >
                        <Building className="w-4 h-4 text-emerald-500" />
                        <span className="font-bold text-xs">Net Banking</span>
                        <span className="text-[9px] text-slate-500 dark:text-neutral-400">All Indian Banks</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => { setPaymentMethod('paypal'); setPaymentError(null); }}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethod === 'paypal'
                            ? 'bg-sky-500/15 border-sky-500 text-sky-800 dark:text-sky-300 shadow-xs'
                            : 'bg-slate-50 dark:bg-neutral-950 border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:border-slate-300'
                        }`}
                      >
                        <Globe className="w-4 h-4 text-indigo-500" />
                        <span className="font-bold text-xs">PayPal</span>
                        <span className="text-[9px] text-slate-500 dark:text-neutral-400">Global & USD</span>
                      </button>
                    </div>
                  </div>

                  {/* Payment Method Fields */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 space-y-3">
                    {paymentMethod === 'upi' && (
                      <div className="space-y-2">
                        <label className="font-semibold text-slate-800 dark:text-neutral-200">
                          Enter UPI Virtual Payment Address (VPA)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:border-sky-500 transition-colors"
                        />
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-neutral-400 pt-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Supports PhonePe, Google Pay, BHIM, Paytm, and all Indian banking UPI apps.</span>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'card' && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="font-semibold text-slate-800 dark:text-neutral-200">Card Number</label>
                          <input
                            type="text"
                            placeholder="4532 •••• •••• 8821"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            maxLength={19}
                            className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white placeholder-slate-400 font-mono text-xs focus:outline-none focus:border-sky-500 transition-colors"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="font-semibold text-slate-800 dark:text-neutral-200">Expiry Date</label>
                            <input
                              type="text"
                              placeholder="MM/YY"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              maxLength={5}
                              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white placeholder-slate-400 font-mono text-xs focus:outline-none focus:border-sky-500 transition-colors"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-semibold text-slate-800 dark:text-neutral-200">CVV / CVC</label>
                            <input
                              type="password"
                              placeholder="•••"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value)}
                              maxLength={4}
                              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white placeholder-slate-400 font-mono text-xs focus:outline-none focus:border-sky-500 transition-colors"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="font-semibold text-slate-800 dark:text-neutral-200">Cardholder Name</label>
                          <input
                            type="text"
                            placeholder="Name on card"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:border-sky-500 transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'netbanking' && (
                      <div className="space-y-2">
                        <label className="font-semibold text-slate-800 dark:text-neutral-200">Select Bank</label>
                        <select
                          value={selectedBank}
                          onChange={(e) => setSelectedBank(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-sky-500 transition-colors"
                        >
                          <option value="sbi">State Bank of India (SBI)</option>
                          <option value="hdfc">HDFC Bank</option>
                          <option value="icici">ICICI Bank</option>
                          <option value="axis">Axis Bank</option>
                          <option value="kotak">Kotak Mahindra Bank</option>
                          <option value="pnb">Punjab National Bank (PNB)</option>
                          <option value="other">Other Indian Bank</option>
                        </select>
                      </div>
                    )}

                    {paymentMethod === 'paypal' && (
                      <div className="space-y-2">
                        <p className="text-slate-600 dark:text-neutral-300 text-xs">
                          You will be connected to PayPal's secure portal to authorize your payment of{' '}
                          <strong>${selectedCycle === 'yearly' ? yearlyDiscounted.toFixed(2) : monthlyPrice.toFixed(2)}</strong>.
                        </p>
                      </div>
                    )}
                  </div>

                  {paymentError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{paymentError}</span>
                    </div>
                  )}

                  {/* Authorize & Complete Payment Button */}
                  <button
                    type="button"
                    disabled={isProcessingPayment}
                    onClick={handleProcessPayment}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-sky-950/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>
                      {isProcessingPayment
                        ? 'Verifying Payment with Gateway...'
                        : `Pay $${selectedCycle === 'yearly' ? yearlyDiscounted.toFixed(2) : monthlyPrice.toFixed(2)} & Activate VIP`}
                    </span>
                  </button>
                </div>
              ) : checkoutStep === 'success' ? (
                /* ================= SUCCESS RECEIPT STEP ================= */
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-neutral-950 border border-emerald-500/40 text-center space-y-4 animate-in fade-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-1.5">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Welcome to Kuro VIP!
                      </h3>
                      <VerifiedMemberBadge size="sm" />
                    </div>
                    <p className="text-xs text-slate-600 dark:text-neutral-300 max-w-md mx-auto">
                      Your <strong>{selectedCycle === 'yearly' ? 'Yearly' : 'Monthly'} Membership</strong> is now active.
                      Your blue verified member badge is equipped across your profile, navbar, and comments!
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-left max-w-sm mx-auto space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-neutral-400">Transaction ID:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{lastTxnId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-neutral-400">Amount Paid:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ${selectedCycle === 'yearly' ? yearlyDiscounted.toFixed(2) : monthlyPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-neutral-400">Valid Until:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {membership.expiresAt ? new Date(membership.expiresAt).toLocaleDateString() : 'Active'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => setCheckoutStep('plans')}
                      className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-sky-900/30"
                    >
                      Done & View Benefits
                    </button>
                  </div>
                </div>
              ) : (
                /* ================= PLANS COMPARISON & SELECTION ================= */
                <>
                  {/* Value Proposition Callout */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 dark:from-amber-950/40 dark:via-neutral-900 dark:to-rose-950/40 border border-amber-500/30 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold uppercase tracking-wider border border-amber-500/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                        Otaku VIP Tier
                      </span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold text-xs">
                        Includes Verified Blue Member Badge
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Why Upgrade to Kuro VIP?
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
                      Kuro VIP directly powers our independent server infrastructure, anime catalog sync,
                      and provides dedicated community benefits built for hardcore anime & manga enthusiasts.
                    </p>
                  </div>

                  {/* Plans Comparison Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Free Plan Card */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-950/80 border border-slate-200 dark:border-neutral-800 space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Standard Otaku</h4>
                            <p className="text-[11px] text-slate-500 dark:text-neutral-400">Free forever</p>
                          </div>
                          <span className="text-sm font-extrabold text-slate-900 dark:text-neutral-300">$0</span>
                        </div>

                        <ul className="space-y-2 text-[11px] text-slate-700 dark:text-neutral-300 pt-2 border-t border-slate-200 dark:border-neutral-800">
                          <li className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span><strong>1 Prediction Poll</strong> creation per week</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span><strong>Unlimited voting</strong> on all community polls</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Full anime & manga catalog tracking</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Daily otaku streak & check-in rewards</span>
                          </li>
                          <li className="flex items-center gap-2 text-slate-400 dark:text-neutral-500">
                            <span className="w-3.5 h-3.5 text-center shrink-0">✕</span>
                            <span>Standard sponsor & affiliate ads</span>
                          </li>
                        </ul>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-200/60 dark:bg-neutral-900 border border-slate-300 dark:border-neutral-800 text-center text-slate-600 dark:text-neutral-400 text-[11px] font-semibold">
                        Current Free Tier
                      </div>
                    </div>

                    {/* Kuro VIP Card with Monthly & Yearly options */}
                    <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-white dark:from-amber-950/30 dark:to-neutral-950 border-2 border-amber-500/50 space-y-4 flex flex-col justify-between shadow-lg">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-sm text-amber-700 dark:text-amber-300">Kuro VIP</h4>
                              <Crown className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                              <VerifiedMemberBadge size="xs" />
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-neutral-400">Everything in Free, plus:</p>
                          </div>
                        </div>

                        {/* Plan Cycle Picker (Monthly vs Yearly) */}
                        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-neutral-900 rounded-xl border border-slate-200 dark:border-neutral-800">
                          <button
                            type="button"
                            onClick={() => setSelectedCycle('monthly')}
                            className={`py-2 px-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer text-center ${
                              selectedCycle === 'monthly'
                                ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-neutral-700'
                                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <div>Monthly</div>
                            <div className="text-amber-600 dark:text-amber-400 font-extrabold text-[11px]">
                              ${monthlyPrice}/mo
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedCycle('yearly')}
                            className={`py-2 px-2.5 rounded-lg font-bold text-xs transition-all cursor-pointer text-center relative ${
                              selectedCycle === 'yearly'
                                ? 'bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs border border-emerald-500/50'
                                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <span className="absolute -top-2 right-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[8px] font-black uppercase tracking-wider shadow-xs animate-pulse">
                              Save 30%
                            </span>
                            <div>Yearly</div>
                            <div className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px]">
                              ${yearlyDiscounted}/yr
                            </div>
                          </button>
                        </div>

                        {/* Yearly Discount Banner */}
                        {selectedCycle === 'yearly' && (
                          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold text-center">
                            Save 30% by purchasing a yearly membership! (~$3.49/mo)
                          </div>
                        )}

                        <ul className="space-y-2 text-[11px] text-slate-800 dark:text-neutral-200 pt-2 border-t border-amber-500/20 dark:border-neutral-800">
                          <li className="flex items-center gap-2 text-sky-700 dark:text-sky-300 font-semibold">
                            <VerifiedMemberBadge size="xs" />
                            <span><strong>Verified Blue Member Icon</strong> on all posts & profile</span>
                          </li>
                          <li className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold">
                            <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                            <span><strong>7 Prediction Polls</strong> creation per week</span>
                          </li>
                          <li className="flex items-center gap-2 text-slate-900 dark:text-white">
                            <Ban className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                            <span><strong>100% Ad-Free Experience</strong> (no ads)</span>
                          </li>
                          <li className="flex items-center gap-2 text-slate-900 dark:text-white">
                            <Crown className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                            <span><strong>Golden VIP Crown & Aura</strong> on your profile</span>
                          </li>
                          <li className="flex items-center gap-2 text-slate-900 dark:text-white">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                            <span>Exclusive <strong>Astral Sovereign</strong> avatar frames</span>
                          </li>
                          <li className="flex items-center gap-2 text-slate-900 dark:text-white">
                            <Shield className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                            <span>High-priority shelf cloud backup & export</span>
                          </li>
                        </ul>
                      </div>

                      {/* Proceed to Checkout Button */}
                      <button
                        type="button"
                        onClick={() => handleStartCheckout(selectedCycle)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-extrabold text-xs transition-all shadow-md shadow-amber-950/20 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Crown className="w-4 h-4 text-amber-200" />
                        <span>
                          {selectedCycle === 'yearly'
                            ? `Upgrade Yearly ($${yearlyDiscounted}/yr • Save 30%)`
                            : `Upgrade Monthly ($${monthlyPrice}/mo)`}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* ================= DONATE TAB ================= */
            <div className="space-y-6">
              {donationSuccess ? (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-neutral-950 border border-emerald-500/40 text-center space-y-4 animate-in fade-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Thank You, {donationSuccess.supporterName}!
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-neutral-300 max-w-md mx-auto">
                      Your contribution of <strong>${donationSuccess.amount.toFixed(2)}</strong> as a{' '}
                      <span className="text-amber-600 dark:text-amber-400 font-bold">{donationSuccess.tierTitle}</span>{' '}
                      has been permanently recorded on your account and appears on the Supporters Wall banner!
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-400 text-xs inline-block space-y-1">
                    <div>
                      Featured on the top banner for <strong>1 minute</strong> to avoid infinite loops, and saved permanently on your profile!
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => setDonationSuccess(null)}
                      className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Make Another Donation
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Mission Intro */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-rose-500/10 dark:from-rose-950/40 dark:via-neutral-900 dark:to-amber-950/40 border border-rose-500/30 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] font-extrabold uppercase tracking-wide border border-rose-500/30 flex items-center gap-1">
                        <Heart className="w-3 h-3 text-rose-500 dark:text-rose-400 fill-current" />
                        Community Fund
                      </span>
                      <span className="text-xs text-slate-500 dark:text-neutral-400">Range: $1.00 — $10,000.00</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Help KuroShelf Grow
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
                      Kuro Shelf is built for anime & manga fans by passionate fans. Every single dollar goes
                      directly into API server costs, database maintenance, catalog caching, and expanding our
                      open community tools. It means a lot to us, thank you for your donation! ❤️
                    </p>
                  </div>

                  {donationError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs">
                      {donationError}
                    </div>
                  )}

                  <form onSubmit={handleDonationSubmit} className="space-y-4">
                    {/* Preset Amount Grid */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-800 dark:text-neutral-200">
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
                              onClick={() => {
                                setCustomAmount(String(p.value));
                                setDonationError(null);
                              }}
                              className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 shadow-xs'
                                  : 'bg-slate-50 dark:bg-neutral-950 border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300 hover:border-slate-300 dark:hover:border-neutral-700'
                              }`}
                            >
                              <div className="w-7 h-7 rounded-lg bg-slate-200/70 dark:bg-neutral-900 flex items-center justify-center text-rose-500 dark:text-rose-400 shrink-0">
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-slate-900 dark:text-white">{p.label}</div>
                                <div className="text-[9px] text-slate-500 dark:text-neutral-400 truncate">{p.desc}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Amount Input ($1 to $10,000) */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-800 dark:text-neutral-200 flex items-center justify-between">
                        <span>Custom Amount (USD)</span>
                        <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono">Min $1 — Max $10,000</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-400 font-bold text-sm">
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
                          className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 font-mono text-sm focus:outline-none focus:border-rose-500 transition-colors"
                          required
                        />
                      </div>
                    </div>

                    {/* Payment Method for Donation */}
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-800 dark:text-neutral-200">
                        Payment Gateway
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() => setDonationMethod('upi')}
                          className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                            donationMethod === 'upi'
                              ? 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 font-bold'
                              : 'bg-slate-50 dark:bg-neutral-950 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400'
                          }`}
                        >
                          <Smartphone className="w-3.5 h-3.5 mx-auto text-sky-500 mb-1" />
                          <div className="text-[11px]">UPI (India)</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDonationMethod('card')}
                          className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                            donationMethod === 'card'
                              ? 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 font-bold'
                              : 'bg-slate-50 dark:bg-neutral-950 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5 mx-auto text-amber-500 mb-1" />
                          <div className="text-[11px]">Cards</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDonationMethod('netbanking')}
                          className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                            donationMethod === 'netbanking'
                              ? 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 font-bold'
                              : 'bg-slate-50 dark:bg-neutral-950 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400'
                          }`}
                        >
                          <Building className="w-3.5 h-3.5 mx-auto text-emerald-500 mb-1" />
                          <div className="text-[11px]">Net Banking</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDonationMethod('paypal')}
                          className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                            donationMethod === 'paypal'
                              ? 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300 font-bold'
                              : 'bg-slate-50 dark:bg-neutral-950 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400'
                          }`}
                        >
                          <Globe className="w-3.5 h-3.5 mx-auto text-indigo-500 mb-1" />
                          <div className="text-[11px]">PayPal</div>
                        </button>
                      </div>
                    </div>

                    {/* Supporter Name & Anonymous toggle */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-800 dark:text-neutral-200">
                          Supporter Name / Handle
                        </label>
                        <input
                          type="text"
                          disabled={isAnonymous}
                          placeholder="e.g. MugenOtaku"
                          value={supporterName}
                          onChange={(e) => setSupporterName(e.target.value)}
                          className={`w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors ${
                            isAnonymous ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          maxLength={40}
                        />
                      </div>

                      <div className="space-y-1 flex flex-col justify-end">
                        <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 cursor-pointer hover:border-slate-300 dark:hover:border-neutral-700">
                          <input
                            type="checkbox"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                            className="rounded border-slate-300 dark:border-neutral-700 text-rose-500 focus:ring-rose-500 bg-white dark:bg-neutral-900"
                          />
                          <span className="text-slate-700 dark:text-neutral-300 font-medium text-[11px]">
                            Donate Anonymously
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Tribute Message */}
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-800 dark:text-neutral-200">
                        Leave a Tribute Message <span className="text-slate-400 dark:text-neutral-500">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Love KuroShelf! Keep anime discovery free and open!"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition-colors"
                        maxLength={120}
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 cursor-pointer"
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
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">Community Supporters Wall</h4>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-neutral-500">
                    {donationsList.length} Generous Contributors
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {donationsList.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 dark:text-neutral-500 text-xs">
                      The Supporters Wall recognizes every community contribution.
                    </div>
                  ) : (
                    Array.from(
                      new Map(donationsList.map((d, i) => [d.id || `don-${i}`, d])).values()
                    ).map((d, idx) => (
                      <div
                        key={`${d.id || 'don'}-${idx}`}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800/80 flex items-center justify-between gap-3 text-[11px]"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white truncate">{d.supporterName}</span>
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[9px] font-bold border border-amber-500/25 shrink-0">
                              {d.tierTitle}
                            </span>
                          </div>
                          {d.message && (
                            <p className="text-[10px] text-slate-500 dark:text-neutral-400 truncate mt-0.5 italic">
                              "{d.message}"
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-extrabold text-rose-600 dark:text-rose-400 text-xs">
                            ${d.amount.toLocaleString()}
                          </span>
                          <span className="text-[9px] text-slate-400 dark:text-neutral-500 block">
                            {new Date(d.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
