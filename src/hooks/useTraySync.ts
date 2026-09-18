import { useEffect, useRef } from 'react';
import { useDayframeStore } from '../store/useDayframeStore';

/**
 * Hook to keep the native macOS Menu Bar tray icon title and right-click actions
 * synchronized with Dayframe's Pomodoro state.
 *
 * Dynamically updates:
 * 1. Title bar countdown (e.g. 🍅 24:18, ☕ 04:52, Dayframe)
 * 2. Menu action label: "Start Focus" / "Pause Focus" / "Resume Break" / "Pause Break"
 * 3. Skip break item: Enabled ONLY during active breaks, labeled "Skip Break"
 */
export const useTraySync = (): void => {
  const pomodoro = useDayframeStore((state) => state.pomodoro);

  const lastSyncPayloadRef = useRef<string>('');

  // 1. Sync tray title and menu item state with live Pomodoro countdown
  useEffect(() => {
    const minutes = Math.floor(pomodoro.timeLeft / 60);
    const seconds = pomodoro.timeLeft % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    let title = 'Dayframe';
    const isUntimed = pomodoro.timeLeft === 0;
    const isBreak = pomodoro.mode === 'shortBreak' || pomodoro.mode === 'longBreak';

    // Compute status bar title
    if (isUntimed) {
      title = '🍅 Untimed';
    } else if (pomodoro.isRunning) {
      title = isBreak ? `☕ ${timeStr}` : `🍅 ${timeStr}`;
    } else if (
      (pomodoro.mode === 'focus' && pomodoro.timeLeft < pomodoro.settings.focusDuration) ||
      (pomodoro.mode === 'shortBreak' && pomodoro.timeLeft < pomodoro.settings.shortBreakDuration) ||
      (pomodoro.mode === 'longBreak' && pomodoro.timeLeft < pomodoro.settings.longBreakDuration)
    ) {
      // Paused mid-session
      title = isBreak ? `☕ ${timeStr}` : `🍅 ${timeStr}`;
    } else {
      title = 'Dayframe';
    }

    // Compute context menu item labels & enabled states
    let timer_label = 'Start Focus';
    if (isBreak) {
      timer_label = pomodoro.isRunning ? 'Pause Break' : 'Resume Break';
    } else {
      timer_label = pomodoro.isRunning ? 'Pause Focus' : 'Start Focus';
    }

    const break_label = 'Skip Break';
    const break_enabled = isBreak;

    const payload = {
      title,
      timer_label,
      break_label,
      break_enabled,
    };

    const payloadKey = JSON.stringify(payload);
    if (lastSyncPayloadRef.current !== payloadKey) {
      lastSyncPayloadRef.current = payloadKey;
      try {
        import('@tauri-apps/api/core')
          .then(({ invoke }) => {
            invoke('update_tray_state', { payload }).catch(() => {});
          })
          .catch(() => {});
      } catch {
        // Ignored outside Tauri
      }
    }
  }, [pomodoro.timeLeft, pomodoro.isRunning, pomodoro.mode, pomodoro.settings]);

  // 2. Register global action handler for native tray menu items with debounce guard
  useEffect(() => {
    let lastTimestamp = 0;

    const handleAction = (action: string) => {
      const now = Date.now();
      if (now - lastTimestamp < 300) {
        return;
      }
      lastTimestamp = now;

      if (action === 'toggle_timer') {
        useDayframeStore.getState().toggleTimer();
      } else if (action === 'skip_break') {
        useDayframeStore.getState().setMode('focus');
      }
    };

    (window as any).__DAYFRAME_ACTION__ = handleAction;

    return () => {
      if ((window as any).__DAYFRAME_ACTION__ === handleAction) {
        delete (window as any).__DAYFRAME_ACTION__;
      }
    };
  }, []);
};
