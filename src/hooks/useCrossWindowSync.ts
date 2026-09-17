import { useEffect, useRef } from 'react';
import { useDayframeStore } from '../store/useDayframeStore';

type SyncMessage =
  | { type: 'REQUEST_SYNC' }
  | {
      type: 'FULL_STORE_SYNC';
      payload: {
        habits: ReturnType<typeof useDayframeStore.getState>['habits'];
        tasks: ReturnType<typeof useDayframeStore.getState>['tasks'];
        pomodoro: ReturnType<typeof useDayframeStore.getState>['pomodoro'];
        audio: ReturnType<typeof useDayframeStore.getState>['audio'];
      };
    }
  | {
      type: 'TIMER_TICK';
      payload: ReturnType<typeof useDayframeStore.getState>['pomodoro'];
    }
  | {
      type: 'INVOKE_ACTION';
      action: string;
      args: any[];
    };

/**
 * Cross-window realtime synchronization hook using BroadcastChannel.
 * Keeps the main dashboard window and the companion menu bar popover window
 * completely synchronized in real time.
 */
export const useCrossWindowSync = (isPopover: boolean) => {
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel('dayframe_cross_window_sync');
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<SyncMessage>) => {
      const msg = event.data;
      if (!msg || !msg.type) return;

      if (msg.type === 'REQUEST_SYNC') {
        if (!isPopover) {
          const state = useDayframeStore.getState();
          channel.postMessage({
            type: 'FULL_STORE_SYNC',
            payload: {
              habits: state.habits,
              tasks: state.tasks,
              pomodoro: state.pomodoro,
              audio: state.audio,
            },
          });
        }
      } else if (msg.type === 'FULL_STORE_SYNC') {
        useDayframeStore.setState({
          habits: msg.payload.habits,
          tasks: msg.payload.tasks,
          pomodoro: msg.payload.pomodoro,
          audio: msg.payload.audio,
        });
      } else if (msg.type === 'TIMER_TICK') {
        if (isPopover) {
          useDayframeStore.setState({ pomodoro: msg.payload });
        }
      } else if (msg.type === 'INVOKE_ACTION') {
        const store = useDayframeStore.getState() as any;
        if (typeof store[msg.action] === 'function') {
          store[msg.action](...(msg.args || []));
          // Broadcast the newly updated state
          const updated = useDayframeStore.getState();
          channel.postMessage({
            type: 'FULL_STORE_SYNC',
            payload: {
              habits: updated.habits,
              tasks: updated.tasks,
              pomodoro: updated.pomodoro,
              audio: updated.audio,
            },
          });
        }
      }
    };

    // If popover mounts, request the latest state from main window
    if (isPopover) {
      channel.postMessage({ type: 'REQUEST_SYNC' });
    }

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [isPopover]);

  // If in main window, broadcast timer changes to popover
  const pomodoro = useDayframeStore((state) => state.pomodoro);
  useEffect(() => {
    if (!isPopover && channelRef.current) {
      channelRef.current.postMessage({
        type: 'TIMER_TICK',
        payload: pomodoro,
      });
    }
  }, [pomodoro, isPopover]);

  const dispatchAction = (action: string, ...args: any[]) => {
    // Run locally
    const store = useDayframeStore.getState() as any;
    if (typeof store[action] === 'function') {
      store[action](...args);
    }
    // Broadcast to peer windows
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'INVOKE_ACTION',
        action,
        args,
      });
    }
  };

  return { dispatchAction };
};
