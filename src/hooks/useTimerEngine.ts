import { useEffect } from 'react';
import { useDayframeStore } from '../store/useDayframeStore';

/**
 * Global Pomodoro timer ticking hook.
 * Sets up a 1000ms interval whenever `isRunning` is true, invoking `tickTimer()`
 * to decrement the countdown and execute cycle completion logic.
 * Cleans up interval safely on pause or component unmount.
 */
export const useTimerEngine = (): void => {
  const isRunning = useDayframeStore((state) => state.pomodoro.isRunning);
  const tickTimer = useDayframeStore((state) => state.tickTimer);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        tickTimer();
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, tickTimer]);
};
