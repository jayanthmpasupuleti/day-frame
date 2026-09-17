import { useEffect, useRef } from 'react';
import { useDayframeStore } from '../store/useDayframeStore';

/**
 * Hook to keep the native macOS Menu Bar tray icon title and right-click actions
 * synchronized with Dayframe's Pomodoro state.
 */
export const useTraySync = (): void => {
  const pomodoro = useDayframeStore((state) => state.pomodoro);
  const toggleTimer = useDayframeStore((state) => state.toggleTimer);
  const setMode = useDayframeStore((state) => state.setMode);

  const lastTitleRef = useRef<string>('');

  // 1. Sync tray title with live Pomodoro countdown
  useEffect(() => {
    const minutes = Math.floor(pomodoro.timeLeft / 60);
    const seconds = pomodoro.timeLeft % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    let title = 'Dayframe';
    const isUntimed = pomodoro.timeLeft === 0;

    if (isUntimed) {
      title = '🍅 Untimed';
    } else if (pomodoro.isRunning) {
      if (pomodoro.mode === 'focus') {
        title = `🍅 ${timeStr}`;
      } else {
        title = `☕ ${timeStr}`;
      }
    } else if (
      (pomodoro.mode === 'focus' && pomodoro.timeLeft < pomodoro.settings.focusDuration) ||
      (pomodoro.mode === 'shortBreak' && pomodoro.timeLeft < pomodoro.settings.shortBreakDuration) ||
      (pomodoro.mode === 'longBreak' && pomodoro.timeLeft < pomodoro.settings.longBreakDuration)
    ) {
      // Paused mid-session
      title = pomodoro.mode === 'focus' ? `🍅 ${timeStr}` : `☕ ${timeStr}`;
    } else {
      title = 'Dayframe';
    }

    if (lastTitleRef.current !== title) {
      lastTitleRef.current = title;
      try {
        import('@tauri-apps/api/core')
          .then(({ invoke }) => {
            invoke('update_tray_title', { title }).catch(() => {});
          })
          .catch(() => {});
      } catch {
        // Ignored when running outside Tauri
      }
    }
  }, [pomodoro.timeLeft, pomodoro.isRunning, pomodoro.mode, pomodoro.settings]);

  // 2. Listen to native macOS tray context menu actions ("tray-action")
  useEffect(() => {
    let unlisten: (() => void) | null = null;

    try {
      import('@tauri-apps/api/event')
        .then(({ listen }) => {
          listen<string>('tray-action', (event) => {
            if (event.payload === 'toggle_timer') {
              toggleTimer();
            } else if (event.payload === 'skip_break') {
              setMode('focus');
            }
          })
            .then((unlistenFn) => {
              unlisten = unlistenFn;
            })
            .catch(() => {});
        })
        .catch(() => {});
    } catch {
      // Ignored when running outside Tauri
    }

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [toggleTimer, setMode]);
};
