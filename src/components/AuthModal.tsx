import { useState, useEffect } from 'react';
import { X, User, Lock, Mail, LogIn, LogOut, CheckCircle2, Shield, Eye, EyeOff, Sparkles, AlertCircle } from 'lucide-react';
import { AuthUser } from '../types';
import { loginUser, logoutUser, loginWithGoogle, registerUser, updateProfileSetup } from '../services/authService';
import { validateUsername } from '../services/profileCustomizationService';

interface AuthModalProps {
  currentUser: AuthUser | null;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser | null) => void;
}

type AuthTab = 'login' | 'register' | 'setup_profile';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthModal({ currentUser, onClose, onAuthSuccess }: AuthModalProps) {
  // Lock body and html scroll
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBody || '';
      document.documentElement.style.overflow = prevHtml || '';
    };
  }, []);

  const [tab, setTab] = useState<AuthTab>('login');
  // All inputs strictly start empty - no pre-filled boxes as requested
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (currentUser && !currentUser.profile_setup_complete) {
      setTab('setup_profile');
      setUsername('');
      setDisplayName('');
    }
  }, [currentUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError('Please enter your email or username and password');
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
        setError(res.error || 'Failed to sign in. Please verify your credentials.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateUsername(username.trim(), null);
    if (!validation.valid) {
      setError(validation.error || 'Invalid username');
      return;
    }

    if (!displayName.trim() || displayName.trim().length < 2) {
      setError('Display name must be at least 2 characters.');
      return;
    }

    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser(username.trim(), displayName.trim(), email.trim(), password);
      if (res.success && res.user) {
        onAuthSuccess(res.user);
        onClose();
      } else {
        setError(res.error || 'Failed to create account');
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

    const validation = validateUsername(username.trim(), currentUser);
    if (!validation.valid) {
      setError(validation.error || 'Invalid username');
      return;
    }

    if (!displayName.trim() || displayName.trim().length < 2) {
      setError('Display name must be at least 2 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await updateProfileSetup(username.trim(), displayName.trim(), password || undefined);
      if (res.success && res.user) {
        onAuthSuccess(res.user);
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
    } catch {
      setError('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const isProfileComplete = currentUser?.profile_setup_complete;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overscroll-contain">
      <div 
        className="absolute inset-0 bg-black/80"
        onClick={() => {
          if (!currentUser || isProfileComplete) onClose();
        }}
      />
      
      <div className="relative w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl shadow-black overflow-hidden animate-in fade-in zoom-in-95 duration-200 overscroll-contain">
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
                  {(currentUser.display_name || currentUser.username).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-white truncate">
                    {currentUser.display_name || currentUser.username}
                  </h4>
                  <p className="text-xs text-neutral-400 truncate mt-0.5">
                    @{currentUser.username}
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
                  Your reading and watching progress, custom ratings, and community prediction votes are securely saved to your Kuro Shelf account.
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
                <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-2">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-white">Create Your Shelf Identity</h4>
                <p className="text-xs text-neutral-400">Set your name and handle to get started.</p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSetupProfile} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-neutral-400 font-medium block">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Shadow Ronin"
                      required
                      minLength={2}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-neutral-400 font-medium block">
                      Username
                    </label>
                    <span className="text-[10px] text-neutral-400">4 chars or fewer reserved for Admins</span>
                  </div>
                  <div className="relative">
                    <span className="text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                      placeholder="e.g. anime_curator"
                      required
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  {username.trim().toLowerCase() === 'kuro' && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-medium mt-1">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Admin Account: @Kuro will be granted full Administrator authority.</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-neutral-400 font-medium block">
                    Set a Password (Optional)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-10 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-md shadow-rose-950/50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{loading ? 'Saving Identity...' : 'Good to Go — Start Exploring'}</span>
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
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    tab === 'login'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-300'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setTab('register');
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    tab === 'register'
                      ? 'bg-neutral-800 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-300'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {tab === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 font-medium block">
                      Email or Username
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="e.g. Kuro or name@example.com"
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
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-md shadow-rose-950/50 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 font-medium block">
                      Display Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Otaku Master"
                        required
                        minLength={2}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-neutral-400 font-medium block">
                        Username
                      </label>
                      <span className="text-[10px] text-neutral-400">4 chars or fewer for Admins</span>
                    </div>
                    <div className="relative">
                      <span className="text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold">@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                        placeholder="e.g. otaku_master"
                        required
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    {username.trim().toLowerCase() === 'kuro' ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-medium mt-1">
                        <Shield className="w-3.5 h-3.5" />
                        <span>Admin Account: @Kuro will be created with Administrator authority.</span>
                      </div>
                    ) : (
                      <p className="text-[10px] text-neutral-400 mt-1">
                        Regular users must be 5+ characters. (Usernames ≤ 4 chars are admin exclusive).
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400 font-medium block">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-10 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-md shadow-rose-950/50 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{loading ? 'Creating Account...' : 'Join Kuro Shelf & Start Exploring'}</span>
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
                    setError(res.error || 'Google sign-in is available when Supabase is connected.');
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl transition-colors font-medium border border-neutral-800 text-xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
