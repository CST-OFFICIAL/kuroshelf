import { useState, useEffect } from 'react';
import { X, User, Lock, Mail, LogIn, LogOut, CheckCircle2, Shield, Eye, EyeOff, KeyRound, Sparkles } from 'lucide-react';
import { AuthUser } from '../types';
import { loginUser, logoutUser, loginWithGoogle, sendEmailOtp, verifyEmailOtp, updateProfileSetup } from '../services/authService';

interface AuthModalProps {
  currentUser: AuthUser | null;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser | null) => void;
}

type AuthTab = 'login' | 'register' | 'otp' | 'setup_profile';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthModal({ currentUser, onClose, onAuthSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<AuthTab>('login');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (currentUser && !currentUser.profile_setup_complete) {
      setTab('setup_profile');
    }
  }, [currentUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError('Please enter your email and password');
      return;
    }
    if (!EMAIL_REGEX.test(identifier.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await loginUser(identifier.trim(), password);
      if (res.success && res.user) {
        onAuthSuccess(res.user);
        if (!res.user.profile_setup_complete) {
          setTab('setup_profile');
        } else {
          onClose();
        }
      } else {
        setError(res.error || 'Failed to sign in');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (countdown > 0) return;
    setError(null);
    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      setError('A valid email address is required.');
      return;
    }
    setLoading(true);
    try {
      const res = await sendEmailOtp(email.trim());
      if (res.success) {
        setTab('otp');
        setCountdown(60);
      } else {
        setError(res.error || 'Failed to send verification code');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp.trim()) {
      setError('Please enter the verification code');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyEmailOtp(email.trim(), otp.trim());
      if (res.success && res.user) {
        onAuthSuccess(res.user);
        if (!res.user.profile_setup_complete) {
          setTab('setup_profile');
        } else {
          onClose();
        }
      } else {
        setError(res.error || 'Invalid or expired verification code');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || username.trim().length < 3 || username.trim().length > 30) {
      setError('Username must be between 3 and 30 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await updateProfileSetup(username.trim(), password || undefined);
      if (res.success) {
        onAuthSuccess(currentUser ? { ...currentUser, username: username.trim(), profile_setup_complete: true } : null);
        onClose();
      } else {
        setError(res.error || 'Failed to complete profile setup');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      onAuthSuccess(null);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const isProfileComplete = currentUser?.profile_setup_complete;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => {
          if (!currentUser || isProfileComplete) onClose();
        }}
      />
      
      <div className="relative w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl shadow-black overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800/60 bg-neutral-900/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
              <Sparkles className="w-4 h-4 text-rose-400" />
            </div>
            <h3 className="text-base font-bold text-white font-display">
              {currentUser && isProfileComplete ? 'Your Kuro Shelf Account' : 'Kuro Shelf Authentication'}
            </h3>
          </div>
          {(!currentUser || isProfileComplete) && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {currentUser && isProfileComplete ? (
            /* Logged-In Profile Card */
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-white truncate">
                    {currentUser.username}
                  </h4>
                  <p className="text-xs text-neutral-400 truncate mt-0.5">
                    {currentUser.email}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium mt-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Active Session</span>
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-900/50 border border-neutral-800/80 text-xs text-neutral-300 space-y-2">
                <div className="flex items-center gap-2 text-neutral-400">
                  <Shield className="w-4 h-4 text-rose-400" />
                  <span className="font-semibold text-neutral-200">Personal Shelf Synced</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Your reading and watching progress, custom ratings, and community prediction votes are securely saved to your Kuro Shelf database account.
                </p>
              </div>

              <button
                onClick={handleLogout}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-neutral-900 hover:bg-red-950/60 hover:text-red-300 text-neutral-300 font-medium text-xs border border-neutral-800 hover:border-red-800/80 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>{loading ? 'Signing Out...' : 'Sign Out'}</span>
              </button>
            </div>
          ) : tab === 'setup_profile' ? (
            /* Setup Profile Form */
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h4 className="text-lg font-bold text-white">Complete your profile</h4>
                <p className="text-xs text-neutral-400">Choose a username to join the community.</p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleSetupProfile} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-neutral-400 font-medium block">
                    Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="otaku_explorer"
                      required
                      minLength={3}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-neutral-400 font-medium block">
                    Set a Password (Optional)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength={8}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-10 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-md shadow-rose-950/50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Complete Setup'}</span>
                </button>
              </form>
            </div>
          ) : tab === 'otp' ? (
            /* OTP Form */
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h4 className="text-lg font-bold text-white">Check your email</h4>
                <p className="text-xs text-neutral-400">We sent a verification code to {email}</p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-neutral-400 font-medium block">
                    Verification Code
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit code"
                      required
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500 text-center tracking-[0.5em]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-md shadow-rose-950/50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{loading ? 'Verifying...' : 'Verify Code'}</span>
                </button>
                
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading || countdown > 0}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs text-neutral-400 hover:text-white transition-colors disabled:opacity-50 disabled:hover:text-neutral-500"
                >
                  <span>{countdown > 0 ? `Resend code in ${countdown}s` : "Didn't receive the code? Resend"}</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tab Nav */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-neutral-900 border border-neutral-800">
                <button
                  onClick={() => {
                    setTab('login');
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    tab === 'login'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setTab('register');
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    tab === 'register'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
                  {error}
                </div>
              )}

              {tab === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 font-medium block">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text" inputMode="email" autoCapitalize="none" autoCorrect="off"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="name@example.com"
                        required
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 font-medium block">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-10 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-md shadow-rose-950/50"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 font-medium block">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text" inputMode="email" autoCapitalize="none" autoCorrect="off"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        required
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-md shadow-rose-950/50"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{loading ? 'Sending Code...' : 'Send Verification Code'}</span>
                  </button>
                </form>
              )}
              
              <div className="mt-4 flex items-center justify-between">
                <span className="w-1/5 border-b border-gray-700 lg:w-1/4"></span>
                <span className="text-xs text-center text-gray-500 uppercase">or</span>
                <span className="w-1/5 border-b border-gray-700 lg:w-1/4"></span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  const res = await loginWithGoogle();
                  if (!res.success) {
                    setError(res.error || 'Failed to sign in with Google');
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium border border-gray-700"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
