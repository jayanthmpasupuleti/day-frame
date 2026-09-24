import { useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useDayframeStore } from '../store/useDayframeStore';

/**
 * Background synchronization engine for Supabase authentication and cloud sync.
 * Strictly maintains local-first priority:
 * - Boots immediately from IndexedDB without waiting for network.
 * - Restores cloud session silently in background if user was previously signed in.
 * - Merges remote cloud changes on sign-in.
 * - Handles online/offline network transitions seamlessly.
 */
export const useSyncEngine = () => {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // 1. If Supabase is not configured with valid keys, stay in guest/local mode
    if (!isSupabaseConfigured || !supabase) {
      useDayframeStore.getState().setSyncStatus('offline');
      return;
    }

    const { setUser, setSyncStatus, pullFromCloud } = useDayframeStore.getState();

    // 2. Check for an existing session on mount
    supabase.auth
      .getSession()
      .then(async ({ data: { session }, error }) => {
        if (error) {
          console.warn('[Dayframe SyncEngine] Session check error:', error.message);
          setSyncStatus('offline');
          return;
        }

        if (session?.user) {
          setUser(session.user);
          // Silently pull and merge latest cloud changes
          await pullFromCloud();
        } else {
          setUser(null);
          setSyncStatus('offline');
        }
      })
      .catch((err) => {
        console.warn('[Dayframe SyncEngine] Init error:', err);
        setSyncStatus('offline');
      });

    // 3. Subscribe to auth state changes (Magic link, OAuth callback, sign in, sign out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = useDayframeStore.getState().user;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          setUser(session.user);
          if (event === 'SIGNED_IN' || !currentUser) {
            await pullFromCloud();
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSyncStatus('offline');
      }
    });

    // 4. Handle Online / Offline network status changes
    const handleOnline = () => {
      const state = useDayframeStore.getState();
      if (state.user) {
        state.syncToCloud();
      }
    };

    const handleOffline = () => {
      useDayframeStore.getState().setSyncStatus('offline');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      subscription.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);
};

export default useSyncEngine;
