/**
 * Platform and environment utilities for Dayframe.
 */

/**
 * Detects whether the current frontend is running inside the native Tauri desktop webview.
 */
export const isTauriApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).__TAURI_INTERNALS__ ||
    (window as any).__TAURI__ ||
    (window as any).__TAURI_METADATA__
  );
};

/**
 * Attempts to focus and unminimize the native desktop window.
 */
export const focusDesktopApp = async (): Promise<boolean> => {
  if (!isTauriApp()) return false;
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const win = getCurrentWindow();
    await win.unminimize();
    await win.show();
    await win.setFocus();
    return true;
  } catch {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('open_full_dashboard');
      return true;
    } catch {
      return false;
    }
  }
};
