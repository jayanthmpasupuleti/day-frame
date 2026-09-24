import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  Cloud,
  ShieldCheck,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { useDayframeStore } from '../store/useDayframeStore';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const AuthModal: React.FC = () => {
  const isAuthModalOpen = useDayframeStore((s) => s.isAuthModalOpen);
  const closeAuthModal = useDayframeStore((s) => s.closeAuthModal);
  const user = useDayframeStore((s) => s.user);

  const [authMode, setAuthMode] = useState<'magic-link' | 'password'>('magic-link');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAuthModal();
      }
    };
    if (isAuthModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  // Reset state when modal opens
  useEffect(() => {
    if (isAuthModalOpen) {
      setStatusMessage(null);
      setIsLoading(false);
    }
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    if (!isSupabaseConfigured || !supabase) {
      setStatusMessage({
        type: 'error',
        text: 'Supabase credentials are not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.',
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        setStatusMessage({ type: 'error', text: error.message });
      } else {
        setStatusMessage({
          type: 'success',
          text: `Magic link dispatched to ${email}! Check your inbox to complete sign in.`,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to send magic link. Please check your network connection.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    if (!isSupabaseConfigured || !supabase) {
      setStatusMessage({
        type: 'error',
        text: 'Supabase credentials are not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.',
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      if (isSignUp) {
        const { error, data } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          setStatusMessage({ type: 'error', text: error.message });
        } else if (data.session) {
          setStatusMessage({ type: 'success', text: 'Account created and signed in!' });
          setTimeout(() => closeAuthModal(), 1200);
        } else {
          setStatusMessage({
            type: 'success',
            text: 'Account created! Please check your email to verify your address.',
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setStatusMessage({ type: 'error', text: error.message });
        } else {
          setStatusMessage({ type: 'success', text: 'Welcome back! Syncing your data...' });
          setTimeout(() => closeAuthModal(), 1000);
        }
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Authentication error. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple') => {
    if (!isSupabaseConfigured || !supabase) {
      setStatusMessage({
        type: 'error',
        text: 'Supabase credentials are not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.',
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });

      if (error) {
        setStatusMessage({ type: 'error', text: error.message });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || `Failed to sign in with ${provider}.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={closeAuthModal}
    >
      {/* Dialog Card Container */}
      <div
        className="w-full max-w-md rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[var(--border-card)] flex items-center justify-between bg-[var(--bg-card)]/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
              <Cloud className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-base font-bold text-white tracking-tight">
                {user ? 'Account & Sync' : 'Dayframe Cloud Sync'}
              </h2>
              <p className="text-xs text-slate-400">
                {user ? 'Connected account details' : 'Encrypted multi-device backup'}
              </p>
            </div>
          </div>

          <button
            onClick={closeAuthModal}
            className="w-7 h-7 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close modal (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[calc(85vh-120px)] overflow-y-auto">
          {/* Unconfigured Supabase Notification Banner */}
          {!isSupabaseConfigured && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-2 font-semibold text-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Supabase Setup Required</span>
              </div>
              <p className="text-[11.5px] text-amber-300/90">
                To activate cloud multi-device sync, add your Supabase credentials to <code className="px-1 py-0.5 rounded bg-black/40 font-mono text-[10.5px]">.env</code>:
              </p>
              <pre className="p-2 rounded-lg bg-black/60 font-mono text-[10px] text-slate-300 overflow-x-auto select-all">
                VITE_SUPABASE_URL=https://your-project.supabase.co{'\n'}
                VITE_SUPABASE_ANON_KEY=your-anon-key
              </pre>
            </div>
          )}

          {/* Privacy & Local-First Callout */}
          <div className="p-3 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-card)] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-200">Local-First Priority:</span> Your tasks and habits are stored locally on this Mac. Signing in enables encrypted multi-device backup without losing offline access.
            </p>
          </div>

          {/* Status Message Alert */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 animate-in fade-in duration-150 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-primary/10 border-primary/30 text-primary'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-snug">{statusMessage.text}</span>
            </div>
          )}

          {/* Auth Mode Tabs (Magic Link vs Password) */}
          <div className="flex p-0.5 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-card)] text-xs">
            <button
              type="button"
              onClick={() => {
                setAuthMode('magic-link');
                setStatusMessage(null);
              }}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'magic-link'
                  ? 'bg-primary text-primaryText font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Magic Link</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('password');
                setStatusMessage(null);
              }}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'password'
                  ? 'bg-primary text-primaryText font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Email & Password</span>
            </button>
          </div>

          {/* Form: Magic Link */}
          {authMode === 'magic-link' && (
            <form onSubmit={handleMagicLink} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-card)] text-white text-[12px] placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-primary text-primaryText font-bold text-xs hover:brightness-110 shadow-mint-btn transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Magic Link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Passwordless Magic Link</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Form: Password Login / Sign Up */}
          {authMode === 'password' && (
            <form onSubmit={handlePasswordAuth} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-card)] text-white text-[12px] placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-medium text-slate-300">
                    Password
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setAuthMode('magic-link')}
                      className="text-[10px] text-primary hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-card)] text-white text-[12px] placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim() || !password}
                className="w-full py-2.5 px-4 rounded-xl bg-primary text-primaryText font-bold text-xs hover:brightness-110 shadow-mint-btn transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isSignUp ? 'Create Dayframe Account' : 'Sign In'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setStatusMessage(null);
                  }}
                  className="text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {isSignUp ? (
                    <span>Already have an account? <strong className="text-primary">Sign in</strong></span>
                  ) : (
                    <span>New to Dayframe Sync? <strong className="text-primary">Create account</strong></span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Social OAuth Providers Divider */}
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-card)]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
              <span className="px-2 bg-[var(--bg-card)] text-slate-500">Or continue with</span>
            </div>
          </div>

          {/* OAuth Buttons: Google & Apple */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleOAuthLogin('google')}
              className="py-2 px-3 rounded-xl bg-[var(--bg-inset)] hover:bg-[var(--bg-inset)]/80 border border-[var(--border-card)] hover:border-white/20 text-slate-200 text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleOAuthLogin('apple')}
              className="py-2 px-3 rounded-xl bg-[var(--bg-inset)] hover:bg-[var(--bg-inset)]/80 border border-[var(--border-card)] hover:border-white/20 text-slate-200 text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.56-7.71-11.61-14.01-6.19-9.59-11.05-20.65-14.58-33.19-3.53-12.54-5.3-24.32-5.3-35.34 0-14.59 3.53-26.69 10.6-36.29 7.07-9.6 15.93-14.48 26.58-14.65 4.58 0 9.87 1.25 15.87 3.75 6 2.5 10.3 3.79 12.91 3.87 2.39-.08 6.84-1.39 13.34-3.92 6.5-2.53 11.83-3.7 15.99-3.53 12.18.73 21.94 5.3 29.28 13.72-10.65 6.42-15.86 15.34-15.63 26.76.24 8.92 3.63 16.34 10.17 22.25 6.54 5.92 14.19 9.38 22.95 10.39-2.22 6.54-4.89 13.19-8.01 19.95zM119.22 31.84c0-7.39 2.68-14.47 8.04-21.25 5.36-6.78 11.96-10.59 19.8-11.43.11 1.09.16 2.07.16 2.94 0 7.28-2.88 14.45-8.64 21.51-5.76 7.07-12.44 10.97-20.04 11.71-.22-.98-.32-2.14-.32-3.48z" />
              </svg>
              <span>Apple</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
