import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Laptop,
  Copy,
  Check,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const AuthBridgePage: React.FC = () => {
  const [status, setStatus] = useState<'verifying' | 'transferring' | 'success' | 'error'>(
    'verifying'
  );
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [rawToken, setRawToken] = useState<string>('');

  useEffect(() => {
    let isCancelled = false;

    const performHandoff = async () => {
      try {
        if (!isSupabaseConfigured || !supabase) {
          setStatus('error');
          setErrorMessage('Supabase is not configured on this Dayframe instance.');
          return;
        }

        const url = new URL(window.location.href);
        const searchParams = url.searchParams;
        const hashParams = new URLSearchParams(
          url.hash.startsWith('#') ? url.hash.slice(1) : url.hash
        );

        // Check for error parameters in URL
        const errorDesc =
          searchParams.get('error_description') ||
          hashParams.get('error_description') ||
          searchParams.get('error') ||
          hashParams.get('error');

        if (errorDesc) {
          setStatus('error');
          setErrorMessage(decodeURIComponent(errorDesc).replace(/\+/g, ' '));
          return;
        }

        const flowId = searchParams.get('auth_handoff') || hashParams.get('auth_handoff');
        const paramEmail = searchParams.get('email') || hashParams.get('email');
        const code = searchParams.get('code');
        const hashAccessToken = hashParams.get('access_token');
        const hashRefreshToken = hashParams.get('refresh_token');

        let activeSession: any = null;

        // 1. If PKCE code is present, exchange it
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.warn('[Dayframe AuthBridge] Code exchange error:', error.message);
          } else if (data.session) {
            activeSession = data.session;
          }
        }

        // 2. If access token is in the hash, set it directly
        if (!activeSession && hashAccessToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: hashAccessToken,
            refresh_token: hashRefreshToken || '',
          });
          if (error) {
            console.warn('[Dayframe AuthBridge] Hash session error:', error.message);
          } else if (data.session) {
            activeSession = data.session;
          }
        }

        // 3. Fallback: inspect Supabase's internal session
        if (!activeSession) {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            activeSession = data.session;
          }
        }

        // If after trying everything we still don't have a session, wait briefly for Supabase event
        if (!activeSession) {
          await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => resolve(), 2500);
            const client = supabase!;
            const { data: { subscription } } = client.auth.onAuthStateChange(
              (_event, session) => {
                if (session) {
                  activeSession = session;
                  clearTimeout(timeout);
                  subscription.unsubscribe();
                  resolve();
                }
              }
            );
          });
        }

        if (isCancelled) return;

        if (!activeSession) {
          setStatus('error');
          setErrorMessage(
            'Could not extract sign-in session from URL. The magic link may have expired or already been used.'
          );
          return;
        }

        setStatus('transferring');
        const email = activeSession.user?.email || paramEmail || null;
        setUserEmail(email);
        setRawToken(activeSession.access_token || '');

        const sessionPayload = {
          access_token: activeSession.access_token,
          refresh_token: activeSession.refresh_token,
          user: activeSession.user,
        };

        // Transfer Mechanism A: Broadcast via Supabase Realtime channel (Flow ID)
        if (flowId) {
          try {
            const flowChannel = supabase.channel(`auth_handoff_${flowId}`);
            flowChannel.subscribe((subStatus) => {
              if (subStatus === 'SUBSCRIBED') {
                flowChannel.send({
                  type: 'broadcast',
                  event: 'session_transfer',
                  payload: { session: sessionPayload, flowId, email },
                });
              }
            });
          } catch (e) {
            console.warn('[Dayframe AuthBridge] Flow broadcast error:', e);
          }
        }

        // Transfer Mechanism B: Broadcast via email-keyed channel (works even if flowId is lost)
        if (email) {
          try {
            const sanitizedEmailKey = btoa(email.toLowerCase().trim()).replace(/=/g, '');
            const emailChannel = supabase.channel(`auth_handoff_email_${sanitizedEmailKey}`);
            emailChannel.subscribe((subStatus) => {
              if (subStatus === 'SUBSCRIBED') {
                emailChannel.send({
                  type: 'broadcast',
                  event: 'session_transfer',
                  payload: { session: sessionPayload, flowId, email },
                });
              }
            });
          } catch (e) {
            console.warn('[Dayframe AuthBridge] Email broadcast error:', e);
          }
        }

        // Transfer Mechanism C: POST to Vite dev server local HTTP bridge
        try {
          await fetch('/api/auth-bridge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              flowId,
              email,
              session: sessionPayload,
            }),
          });
        } catch {
          // Dev server bridge might not be running in static production builds, ignore error
        }

        // Transfer Mechanism D: Try deep-link URL scheme (dayframe://)
        try {
          const deepLinkUrl = `dayframe://auth/callback#access_token=${activeSession.access_token}&refresh_token=${activeSession.refresh_token}`;
          window.location.href = deepLinkUrl;
        } catch {
          // Ignore if protocol is not registered
        }

        if (!isCancelled) {
          setStatus('success');
        }
      } catch (err: any) {
        if (!isCancelled) {
          setStatus('error');
          setErrorMessage(err?.message || 'Unexpected error completing authentication.');
        }
      }
    };

    performHandoff();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleOpenDayframe = () => {
    // Try opening via deep link
    window.location.href = 'dayframe://open';
  };

  const handleCopyToken = () => {
    if (rawToken) {
      navigator.clipboard.writeText(rawToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-4 bg-[#0B0E11] text-slate-200 antialiased font-sans relative selection:bg-emerald-500 selection:text-black">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.12),transparent_70%)] pointer-events-none" />

      {/* Main Card */}
      <div className="relative w-full max-w-md bg-[#12171E] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden backdrop-blur-xl z-10 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Dayframe Icon / Header */}
        <div className="flex flex-col items-center mb-5">
          <div className="relative mb-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              {status === 'verifying' || status === 'transferring' ? (
                <Loader2 className="w-7 h-7 animate-spin text-emerald-400" />
              ) : status === 'success' ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              ) : (
                <AlertCircle className="w-7 h-7 text-rose-400" />
              )}
            </div>
            {status === 'success' && (
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
              </span>
            )}
          </div>

          <h1 className="text-lg font-bold text-white tracking-tight">
            {status === 'verifying' && 'Verifying Magic Link...'}
            {status === 'transferring' && 'Connecting to Dayframe Desktop...'}
            {status === 'success' && 'Signed In to Dayframe!'}
            {status === 'error' && 'Sign In Failed'}
          </h1>

          <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
            {status === 'verifying' && 'Validating your one-time authentication token...'}
            {status === 'transferring' && 'Handoff in progress. Syncing with your Mac desktop app...'}
            {status === 'success' && (
              <>
                Authenticated as <strong className="text-slate-200">{userEmail}</strong>. Your session has been transferred to Dayframe Desktop.
              </>
            )}
            {status === 'error' && errorMessage}
          </p>
        </div>

        {/* Success Guidance Box */}
        {status === 'success' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-left flex items-start gap-3">
              <Laptop className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[12px] text-emerald-200 leading-relaxed">
                <span className="font-semibold text-white block mb-0.5">
                  Return to Dayframe on your Mac
                </span>
                The desktop app is now signed in and ready. You can safely close this browser window.
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleOpenDayframe}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <span>Switch to Dayframe Desktop</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => window.close()}
                className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Close This Tab
              </button>
            </div>

            {/* Token copy backup option */}
            {rawToken && (
              <div className="pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={handleCopyToken}
                  className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Token copied to clipboard</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy session token</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error Fallback */}
        {status === 'error' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs text-left leading-relaxed">
              {errorMessage || 'An error occurred during authentication.'}
            </div>
            <p className="text-[11px] text-slate-400">
              Please return to the Dayframe desktop app and request a new magic link or enter the 6-digit confirmation code from your email.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthBridgePage;
