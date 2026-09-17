import { get, set, del } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

/**
 * Asynchronous StateStorage implementation for Zustand backed by IndexedDB (via idb-keyval).
 * Ensures robust, non-blocking local-first persistence for desktop sessions.
 */
export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const val = await get<string>(name);
      return val ?? null;
    } catch (err) {
      console.error(`[idbStorage] Error reading "${name}" from IndexedDB:`, err);
      return null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await set(name, value);
    } catch (err) {
      console.error(`[idbStorage] Error writing "${name}" to IndexedDB:`, err);
    }
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      await del(name);
    } catch (err) {
      console.error(`[idbStorage] Error removing "${name}" from IndexedDB:`, err);
    }
  },
};
