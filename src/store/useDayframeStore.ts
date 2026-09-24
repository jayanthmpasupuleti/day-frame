import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Habit,
  AgileTask,
  TaskStatus,
  PomodoroMode,
  PomodoroSettings,
  PomodoroState,
  AudioTrack,
  AudioState,
  SyncState,
  SyncStatus,
  ThemeId,
} from '../types';
import { supabase, type User } from '../lib/supabase';
import { idbStorage } from './idbStorage';

export type { ThemeId, SyncStatus };

export interface DayframeStore {
  // Theme Engine & Pro State
  activeTheme: ThemeId;
  unlockedThemeIds: ThemeId[];
  isProUnlocked: boolean;
  isThemeModalOpen: boolean;
  previewThemeId: ThemeId | null;
  previewSecondsRemaining: number;
  setTheme: (theme: ThemeId) => void;
  previewTheme: (theme: ThemeId) => void;
  previewThemeAction: (theme: ThemeId) => void;
  revertPreview: () => void;
  unlockSageChakra: () => void;
  unlockProMock: () => void;
  openThemeModal: () => void;
  closeThemeModal: () => void;
  startPreviewTheme: (theme: ThemeId) => void;
  cancelPreviewTheme: () => void;
  // Habits
  habits: Habit[];
  addHabit: (name: string, category?: Habit['category']) => void;
  toggleHabit: (id: string) => void;
  deleteHabit: (id: string) => void;

  // Agile Tasks
  tasks: AgileTask[];
  addTask: (title: string, tag?: string, pomosEst?: number, durationMinutes?: number) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  updateTaskDuration: (id: string, durationMinutes: number) => void;
  incrementTaskPomo: (id: string) => void;
  deleteTask: (id: string) => void;
  // UI helper aliases
  promoteToFocus: (id: string) => void;
  moveBackToBacklog: (id: string) => void;
  completeHeroTask: (id: string) => void;

  // Pomodoro Engine
  pomodoro: PomodoroState;
  setMode: (mode: PomodoroMode) => void;
  toggleTimer: () => void;
  tickTimer: () => void;
  resetTimer: () => void;
  updateSettings: (settings: Partial<PomodoroSettings>) => void;
  // UI helper aliases
  togglePomodoroRunning: () => void;
  tickPomodoro: () => void;
  resetPomodoro: () => void;
  setPomodoroMode: (mode: PomodoroMode) => void;

  // Focus Audio Sync
  audio: AudioState;
  setActiveTrack: (id: string) => void;
  toggleAudio: () => void;
  setIsPlayingAudio: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  addCustomTrack: (title: string, youtubeId: string) => void;
  // UI helper aliases
  toggleAudioPlaying: () => void;
  setAudioVolume: (volume: number) => void;

  // Cloud Sync & Supabase Auth
  user: User | null;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  isAuthModalOpen: boolean;
  setUser: (user: User | null) => void;
  setSyncStatus: (status: SyncStatus) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  syncToCloud: () => Promise<void>;
  pullFromCloud: () => Promise<void>;
  signOutUser: () => Promise<void>;
  sync: SyncState;
  toggleGuestMode: () => void;
}

// Helper to generate realistic mock history for the past 60 days
const generateMockHistory = (
  daysBack: number,
  completionRate: number,
  recentStreak: number
): Record<string, boolean> => {
  const history: Record<string, boolean> = {};
  const today = new Date();

  for (let i = 0; i < daysBack; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    if (i === 0) {
      history[dateStr] = recentStreak > 0;
    } else if (i <= recentStreak) {
      history[dateStr] = true;
    } else {
      const dayNum = d.getDate() + (d.getMonth() + 1) * 31;
      const pseudo = ((dayNum * 9301 + 49297) % 233280) / 233280;
      history[dateStr] = pseudo < completionRate;
    }
  }
  return history;
};

const DEFAULT_HABITS: Habit[] = [
  {
    id: 'h-1',
    name: 'Deep Work (90m)',
    completedToday: true,
    streak: 12,
    lastCompletedDate: new Date().toISOString().split('T')[0],
    category: 'focus',
    history: generateMockHistory(60, 0.85, 12),
  },
  {
    id: 'h-2',
    name: 'Read 20m',
    completedToday: true,
    streak: 5,
    lastCompletedDate: new Date().toISOString().split('T')[0],
    category: 'mindset',
    history: generateMockHistory(60, 0.78, 5),
  },
  {
    id: 'h-3',
    name: 'Hydrate (2L)',
    completedToday: false,
    streak: 0,
    category: 'health',
    history: generateMockHistory(60, 0.65, 0),
  },
  {
    id: 'h-4',
    name: 'Code / Build',
    completedToday: false,
    streak: 0,
    category: 'focus',
    history: generateMockHistory(60, 0.72, 0),
  },
];

const DEFAULT_TASKS: AgileTask[] = [
  {
    id: 't-1',
    title: 'Refactor SQLite schema & local indexes',
    status: 'backlog',
    pomosEst: 2,
    pomosDone: 0,
    durationMinutes: 45,
    tag: '#dev',
  },
  {
    id: 't-2',
    title: 'Draft Product Architecture & Spec notes',
    status: 'backlog',
    pomosEst: 3,
    pomosDone: 0,
    durationMinutes: 30,
    tag: '#writing',
  },
  {
    id: 't-3',
    title: 'Benchmark IPC memory overhead in Tauri v2',
    status: 'backlog',
    pomosEst: 1,
    pomosDone: 0,
    durationMinutes: 15,
    tag: '#dev',
  },
  {
    id: 't-4',
    title: 'Build Dayframe Core UI Architecture',
    status: 'in_focus',
    pomosEst: 4,
    pomosDone: 2,
    durationMinutes: 25,
    tag: '#dev',
    notes: [
      'Glassmorphic dock pill bar with YouTube presets',
      'Single-window 3-column personal Agile board',
      'Local-First SQLite offline data privacy',
    ],
  },
  {
    id: 't-5',
    title: 'Set up Tauri v2 macOS vibrancy blur overlay',
    status: 'done',
    pomosEst: 2,
    pomosDone: 2,
    durationMinutes: 25,
    tag: '#dev',
    completedAt: '10:15 AM',
  },
  {
    id: 't-6',
    title: 'Configure Tailwind CSS v4 & Lucide monochrome icons',
    status: 'done',
    pomosEst: 1,
    pomosDone: 1,
    durationMinutes: 20,
    tag: '#design',
    completedAt: '09:30 AM',
  },
  {
    id: 't-7',
    title: 'Scaffold Zustand local-first storage with persistence',
    status: 'done',
    pomosEst: 1,
    pomosDone: 1,
    durationMinutes: 25,
    tag: '#dev',
    completedAt: '09:00 AM',
  },
  {
    id: 't-8',
    title: 'Morning alignment & task prioritization',
    status: 'done',
    pomosEst: 1,
    pomosDone: 1,
    durationMinutes: 15,
    tag: '#routine',
    completedAt: '08:30 AM',
  },
  {
    id: 't-9',
    title: 'Grab Starbucks Iced Caramel Macchiato',
    status: 'backlog',
    pomosEst: 0,
    pomosDone: 0,
    durationMinutes: 0,
    tag: '#personal',
  },
];

const DEFAULT_AUDIO_TRACKS: AudioTrack[] = [
  { id: 'lofi', title: 'Lofi Chill Radio', youtubeId: '5qap5aO4i9A' },
  { id: 'synthwave', title: 'Synthwave Focus', youtubeId: '4xDzrJKXOOY' },
  { id: 'ambient', title: 'Deep Ambient Noise', youtubeId: 'WPni755-Krg' },
];

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusDuration: 1500, // 25 min
  shortBreakDuration: 300, // 5 min
  longBreakDuration: 900, // 15 min
  autoSyncAudio: true,
};

let previewTimer: any = null;
let syncDebounceTimer: any = null;

export const applyDomTheme = (theme: ThemeId) => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
};

export const queueBackgroundSync = (get: () => DayframeStore) => {
  const { user } = get();
  if (!user || !supabase) return;
  if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(() => {
    get().syncToCloud();
  }, 1200);
};

export const useDayframeStore = create<DayframeStore>()(
  persist(
    (set, get) => ({
      // --- HABITS ---
      habits: DEFAULT_HABITS,

      addHabit: (name: string, category: Habit['category'] = 'focus') => {
        if (!name.trim()) return;
        const newHabit: Habit = {
          id: `h-${Date.now()}`,
          name: name.trim(),
          completedToday: false,
          streak: 0,
          category,
          history: {},
        };
        set((state) => ({ habits: [...state.habits, newHabit] }));
        queueBackgroundSync(get);
      },

      toggleHabit: (id: string) => {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        set((state) => ({
          habits: state.habits.map((habit) => {
            if (habit.id !== id) return habit;
            const willComplete = !habit.completedToday;
            const prevHistory = habit.history || {};
            const nextHistory: Record<string, boolean> = {
              ...prevHistory,
              [today]: willComplete,
            };

            if (willComplete) {
              // Verifying consecutive days
              let nextStreak = 1;
              if (habit.lastCompletedDate === yesterday) {
                nextStreak = habit.streak + 1;
              } else if (habit.lastCompletedDate === today) {
                nextStreak = Math.max(1, habit.streak);
              }
              return {
                ...habit,
                completedToday: true,
                streak: nextStreak,
                lastCompletedDate: today,
                history: nextHistory,
              };
            } else {
              // Uncompleting habit
              return {
                ...habit,
                completedToday: false,
                streak: Math.max(0, habit.streak - 1),
                history: nextHistory,
              };
            }
          }),
        }));
        queueBackgroundSync(get);
      },

      deleteHabit: (id: string) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
        }));
        queueBackgroundSync(get);
      },

      // --- AGILE TASKS ---
      tasks: DEFAULT_TASKS,

      addTask: (
        title: string,
        tag: string = '#dev',
        pomosEst: number = 2,
        durationMinutes: number = 25
      ) => {
        if (!title.trim()) return;
        const isUntimed = durationMinutes === 0;
        const newTask: AgileTask = {
          id: `t-${Date.now()}`,
          title: title.trim(),
          status: 'backlog',
          pomosEst: isUntimed ? 0 : Math.max(1, pomosEst),
          pomosDone: 0,
          durationMinutes: isUntimed ? 0 : Math.max(1, durationMinutes),
          tag: tag.startsWith('#') ? tag : `#${tag}`,
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));
        queueBackgroundSync(get);
      },

      setTaskStatus: (id: string, status: TaskStatus) => {
        set((state) => {
          const target = state.tasks.find((t) => t.id === id);
          if (!target) return state;

          let updatedTasks = state.tasks;
          let nextPomodoro = state.pomodoro;

          if (status === 'in_focus') {
            // STRICT CONSTRAINT: Only ONE task can occupy 'in_focus'. Demote existing active task to 'backlog'.
            updatedTasks = state.tasks.map((task) => {
              if (task.id === id) {
                return { ...task, status: 'in_focus' };
              }
              if (task.status === 'in_focus') {
                return { ...task, status: 'backlog' };
              }
              return task;
            });

            // Initialize timer to this specific task's duration
            const isUntimed = target.durationMinutes === 0;
            const durationSec = isUntimed
              ? 0
              : (target.durationMinutes || 25) * 60;

            nextPomodoro = {
              ...state.pomodoro,
              mode: 'focus',
              timeLeft: durationSec,
              isRunning: false,
            };
          } else if (status === 'done') {
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            updatedTasks = state.tasks.map((task) =>
              task.id === id
                ? {
                    ...task,
                    status: 'done',
                    completedAt: timeStr,
                    pomosDone: task.pomosEst,
                  }
                : task
            );

            // Reset Pomodoro timer upon completion
            nextPomodoro = {
              ...state.pomodoro,
              timeLeft: state.pomodoro.settings.focusDuration,
              isRunning: false,
              currentCycle: Math.min(
                4,
                state.pomodoro.currentCycle + 1
              ),
            };
          } else {
            // Backlog
            updatedTasks = state.tasks.map((task) =>
              task.id === id ? { ...task, status: 'backlog' } : task
            );
            if (target.status === 'in_focus') {
              nextPomodoro = {
                ...state.pomodoro,
                timeLeft: state.pomodoro.settings.focusDuration,
                isRunning: false,
              };
            }
          }

          return {
            tasks: updatedTasks,
            pomodoro: nextPomodoro,
          };
        });
        queueBackgroundSync(get);
      },

      updateTaskDuration: (id: string, durationMinutes: number) => {
        const validated = Math.max(0, Math.min(180, durationMinutes));
        set((state) => {
          const updatedTasks = state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  durationMinutes: validated,
                  pomosEst: validated === 0 ? 0 : Math.max(1, task.pomosEst || 1),
                }
              : task
          );
          const target = updatedTasks.find((t) => t.id === id);
          const isInFocus = target?.status === 'in_focus';

          return {
            tasks: updatedTasks,
            pomodoro: isInFocus && !state.pomodoro.isRunning
              ? {
                  ...state.pomodoro,
                  timeLeft: validated * 60,
                }
              : state.pomodoro,
          };
        });
        queueBackgroundSync(get);
      },

      incrementTaskPomo: (id: string) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, pomosDone: task.pomosDone + 1 } : task
          ),
        }));
        queueBackgroundSync(get);
      },

      deleteTask: (id: string) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
        queueBackgroundSync(get);
      },

      promoteToFocus: (id: string) => {
        get().setTaskStatus(id, 'in_focus');
      },

      moveBackToBacklog: (id: string) => {
        get().setTaskStatus(id, 'backlog');
      },

      completeHeroTask: (id: string) => {
        get().setTaskStatus(id, 'done');
      },

      // --- POMODORO ENGINE ---
      pomodoro: {
        mode: 'focus',
        timeLeft: DEFAULT_SETTINGS.focusDuration,
        isRunning: false,
        currentCycle: 1,
        settings: DEFAULT_SETTINGS,
      },

      setMode: (mode: PomodoroMode) => {
        const { settings, currentCycle } = get().pomodoro;
        const duration =
          mode === 'focus'
            ? settings.focusDuration
            : mode === 'shortBreak'
            ? settings.shortBreakDuration
            : settings.longBreakDuration;

        set((state) => ({
          pomodoro: {
            ...state.pomodoro,
            mode,
            timeLeft: duration,
            isRunning: false,
            currentCycle,
          },
        }));

        // Pause audio on break transition if auto-sync is enabled
        if (mode !== 'focus' && settings.autoSyncAudio) {
          get().setIsPlayingAudio(false);
        }
      },

      toggleTimer: () => {
        const { isRunning, settings, mode } = get().pomodoro;
        const nextRunning = !isRunning;

        set((state) => ({
          pomodoro: {
            ...state.pomodoro,
            isRunning: nextRunning,
          },
        }));

        // Focus Audio Sync: auto-sync audio with timer state if enabled
        if (settings.autoSyncAudio) {
          if (nextRunning && mode === 'focus') {
            get().setIsPlayingAudio(true);
          } else {
            get().setIsPlayingAudio(false);
          }
        }
      },

      tickTimer: () => {
        const { pomodoro, tasks } = get();
        if (!pomodoro.isRunning) return;

        if (pomodoro.timeLeft > 1) {
          set({
            pomodoro: {
              ...pomodoro,
              timeLeft: pomodoro.timeLeft - 1,
            },
          });
        } else {
          // Timer reached 0
          if (pomodoro.mode === 'focus') {
            // Automatically increment pomosDone on currently active task in 'in_focus'
            const activeFocusTask = tasks.find((t) => t.status === 'in_focus');
            if (activeFocusTask) {
              get().incrementTaskPomo(activeFocusTask.id);
            }

            // Switch to break: longBreak every 4 cycles, else shortBreak
            const isFourCycle = pomodoro.currentCycle >= 4;
            const nextMode: PomodoroMode = isFourCycle ? 'longBreak' : 'shortBreak';
            const nextDuration = isFourCycle
              ? pomodoro.settings.longBreakDuration
              : pomodoro.settings.shortBreakDuration;
            const nextCycle = isFourCycle ? 1 : pomodoro.currentCycle + 1;

            set({
              pomodoro: {
                ...pomodoro,
                mode: nextMode,
                timeLeft: nextDuration,
                isRunning: false,
                currentCycle: nextCycle,
              },
            });

            // Pause audio on session completion if auto-sync enabled
            if (pomodoro.settings.autoSyncAudio) {
              get().setIsPlayingAudio(false);
            }
          } else {
            // Break completed -> reset to focus
            set({
              pomodoro: {
                ...pomodoro,
                mode: 'focus',
                timeLeft: pomodoro.settings.focusDuration,
                isRunning: false,
              },
            });

            if (pomodoro.settings.autoSyncAudio) {
              get().setIsPlayingAudio(false);
            }
          }
        }
      },

      resetTimer: () => {
        const { pomodoro, tasks } = get();
        const activeTask = tasks.find((t) => t.status === 'in_focus');
        const duration =
          pomodoro.mode === 'focus' && activeTask?.durationMinutes !== undefined
            ? activeTask.durationMinutes * 60
            : pomodoro.mode === 'focus'
            ? pomodoro.settings.focusDuration
            : pomodoro.mode === 'shortBreak'
            ? pomodoro.settings.shortBreakDuration
            : pomodoro.settings.longBreakDuration;

        set({
          pomodoro: {
            ...pomodoro,
            timeLeft: duration,
            isRunning: false,
          },
        });

        if (pomodoro.settings.autoSyncAudio) {
          get().setIsPlayingAudio(false);
        }
      },

      updateSettings: (partialSettings: Partial<PomodoroSettings>) => {
        set((state) => ({
          pomodoro: {
            ...state.pomodoro,
            settings: {
              ...state.pomodoro.settings,
              ...partialSettings,
            },
          },
        }));
        queueBackgroundSync(get);
      },

      // Pomodoro UI helper aliases
      togglePomodoroRunning: () => get().toggleTimer(),
      tickPomodoro: () => get().tickTimer(),
      resetPomodoro: () => get().resetTimer(),
      setPomodoroMode: (mode: PomodoroMode) => get().setMode(mode),

      // --- FOCUS AUDIO SYNC ---
      audio: {
        audioTracks: DEFAULT_AUDIO_TRACKS,
        activeTrackId: 'lofi',
        isPlayingAudio: false,
        volume: 0.7,
      },

      setActiveTrack: (id: string) => {
        set((state) => ({
          audio: {
            ...state.audio,
            activeTrackId: id,
          },
        }));
      },

      toggleAudio: () => {
        set((state) => ({
          audio: {
            ...state.audio,
            isPlayingAudio: !state.audio.isPlayingAudio,
          },
        }));
      },

      setIsPlayingAudio: (isPlaying: boolean) => {
        set((state) => ({
          audio: {
            ...state.audio,
            isPlayingAudio: isPlaying,
          },
        }));
      },

      setVolume: (volume: number) => {
        const clamped = Math.max(0, Math.min(1, volume));
        set((state) => ({
          audio: {
            ...state.audio,
            volume: clamped,
          },
        }));
      },

      addCustomTrack: (title: string, youtubeId: string) => {
        if (!title.trim() || !youtubeId.trim()) return;
        const newTrack: AudioTrack = {
          id: `custom-${Date.now()}`,
          title: title.trim(),
          youtubeId: youtubeId.trim(),
        };
        set((state) => ({
          audio: {
            ...state.audio,
            audioTracks: [...state.audio.audioTracks, newTrack],
            activeTrackId: newTrack.id,
          },
        }));
      },

      // Audio UI helper aliases
      toggleAudioPlaying: () => get().toggleAudio(),
      setAudioVolume: (vol: number) => get().setVolume(vol),

      // --- CLOUD SYNC & SUPABASE AUTH ---
      user: null,
      syncStatus: 'offline',
      lastSyncedAt: null,
      isAuthModalOpen: false,

      openAuthModal: () => set({ isAuthModalOpen: true }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),

      setUser: (user: User | null) => {
        set((state) => ({
          user,
          syncStatus: user ? (state.syncStatus === 'offline' ? 'synced' : state.syncStatus) : 'offline',
          sync: {
            isGuest: !user,
            isOnline: Boolean(user),
            statusText: user ? `Synced (${user.email || 'Cloud'})` : 'Guest / Offline Mode',
          },
        }));
      },

      setSyncStatus: (syncStatus: SyncStatus) => set({ syncStatus }),

      syncToCloud: async () => {
        const { user } = get();
        if (!supabase || !user) {
          set({ syncStatus: 'offline' });
          return;
        }

        set({ syncStatus: 'syncing' });
        try {
          const state = get();
          const payload = {
            user_id: user.id,
            habits: state.habits,
            tasks: state.tasks,
            settings: {
              pomodoroSettings: state.pomodoro.settings,
              activeTrackId: state.audio.activeTrackId,
              volume: state.audio.volume,
              activeTheme: state.activeTheme,
            },
            updated_at: new Date().toISOString(),
          };

          const { error: dataError } = await supabase
            .from('user_data')
            .upsert(payload, { onConflict: 'user_id' });

          if (dataError) throw dataError;

          // Update profiles table
          await supabase
            .from('profiles')
            .upsert(
              {
                id: user.id,
                unlocked_themes: state.unlockedThemeIds,
                is_pro: state.isProUnlocked,
              },
              { onConflict: 'id' }
            );

          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          set({
            syncStatus: 'synced',
            lastSyncedAt: timeStr,
            sync: {
              isGuest: false,
              isOnline: true,
              statusText: `Synced at ${timeStr}`,
            },
          });
        } catch (err) {
          console.warn('[Dayframe Sync] Push error:', err);
          set({ syncStatus: 'error' });
        }
      },

      pullFromCloud: async () => {
        const { user } = get();
        if (!supabase || !user) {
          set({ syncStatus: 'offline' });
          return;
        }

        set({ syncStatus: 'syncing' });
        try {
          const { data: remoteData, error: dataError } = await supabase
            .from('user_data')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (dataError) throw dataError;

          const { data: remoteProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          const state = get();
          let mergedHabits = state.habits;
          let mergedTasks = state.tasks;
          let mergedUnlockedThemes = state.unlockedThemeIds;
          let mergedIsPro = state.isProUnlocked;

          if (remoteProfile) {
            if (Array.isArray(remoteProfile.unlocked_themes) && remoteProfile.unlocked_themes.length > 0) {
              mergedUnlockedThemes = Array.from(
                new Set([...state.unlockedThemeIds, ...remoteProfile.unlocked_themes])
              ) as ThemeId[];
            }
            if (remoteProfile.is_pro) {
              mergedIsPro = true;
            }
          }

          if (remoteData) {
            // 1. Merge habits by ID
            const remoteHabits: Habit[] = Array.isArray(remoteData.habits) ? remoteData.habits : [];
            const localHabitMap = new Map(state.habits.map((h) => [h.id, h]));
            remoteHabits.forEach((rh) => {
              const local = localHabitMap.get(rh.id);
              if (local) {
                localHabitMap.set(rh.id, {
                  ...rh,
                  ...local,
                  streak: Math.max(rh.streak || 0, local.streak || 0),
                  completedToday: local.completedToday || rh.completedToday,
                  history: { ...(rh.history || {}), ...(local.history || {}) },
                });
              } else {
                localHabitMap.set(rh.id, rh);
              }
            });
            mergedHabits = Array.from(localHabitMap.values());

            // 2. Merge tasks by ID
            const remoteTasks: AgileTask[] = Array.isArray(remoteData.tasks) ? remoteData.tasks : [];
            const localTaskMap = new Map(state.tasks.map((t) => [t.id, t]));
            remoteTasks.forEach((rt) => {
              const local = localTaskMap.get(rt.id);
              if (local) {
                const isLocalDone = local.status === 'done';
                const isRemoteDone = rt.status === 'done';
                localTaskMap.set(rt.id, {
                  ...rt,
                  ...local,
                  status: isLocalDone ? 'done' : isRemoteDone ? 'done' : local.status,
                  pomosDone: Math.max(rt.pomosDone || 0, local.pomosDone || 0),
                });
              } else {
                localTaskMap.set(rt.id, rt);
              }
            });
            mergedTasks = Array.from(localTaskMap.values());

            if (remoteData.settings?.pomodoroSettings) {
              state.updateSettings(remoteData.settings.pomodoroSettings);
            }
          }

          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          set({
            habits: mergedHabits,
            tasks: mergedTasks,
            unlockedThemeIds: mergedUnlockedThemes,
            isProUnlocked: mergedIsPro,
            syncStatus: 'synced',
            lastSyncedAt: timeStr,
            sync: {
              isGuest: false,
              isOnline: true,
              statusText: `Synced at ${timeStr}`,
            },
          });

          // Sync back the combined result so cloud has any new local items
          await get().syncToCloud();
        } catch (err) {
          console.warn('[Dayframe Sync] Pull error:', err);
          set({ syncStatus: 'error' });
        }
      },

      signOutUser: async () => {
        if (supabase) {
          try {
            await supabase.auth.signOut();
          } catch {}
        }
        set({
          user: null,
          syncStatus: 'offline',
          sync: {
            isGuest: true,
            isOnline: false,
            statusText: 'Guest / Offline Mode',
          },
          isAuthModalOpen: false,
        });
      },

      sync: {
        isGuest: true,
        isOnline: false,
        statusText: 'Guest / Offline Mode',
      },

      toggleGuestMode: () => {
        const { user } = get();
        if (user) {
          get().syncToCloud();
        } else {
          get().openAuthModal();
        }
      },

      // --- THEME ENGINE & PRO STATE ---
      activeTheme: 'midnight-mint',
      unlockedThemeIds: ['midnight-mint'],
      isProUnlocked: false,
      isThemeModalOpen: false,
      previewThemeId: null,
      previewSecondsRemaining: 0,

      setTheme: (theme: ThemeId) => {
        if (previewTimer) {
          clearInterval(previewTimer);
          previewTimer = null;
        }
        applyDomTheme(theme);
        set({
          activeTheme: theme,
          previewThemeId: null,
          previewSecondsRemaining: 0,
        });
      },

      previewTheme: (theme: ThemeId) => {
        if (previewTimer) {
          clearInterval(previewTimer);
          previewTimer = null;
        }
        applyDomTheme(theme);
        set({
          previewThemeId: theme,
          previewSecondsRemaining: 15,
        });

        previewTimer = setInterval(() => {
          const currentRemaining = get().previewSecondsRemaining;
          if (currentRemaining <= 1) {
            clearInterval(previewTimer);
            previewTimer = null;
            applyDomTheme(get().activeTheme);
            set({
              previewThemeId: null,
              previewSecondsRemaining: 0,
            });
          } else {
            set({ previewSecondsRemaining: currentRemaining - 1 });
          }
        }, 1000);
      },

      previewThemeAction: (theme: ThemeId) => {
        get().previewTheme(theme);
      },

      startPreviewTheme: (theme: ThemeId) => {
        get().previewTheme(theme);
      },

      revertPreview: () => {
        if (previewTimer) {
          clearInterval(previewTimer);
          previewTimer = null;
        }
        applyDomTheme(get().activeTheme);
        set({
          previewThemeId: null,
          previewSecondsRemaining: 0,
        });
      },

      cancelPreviewTheme: () => {
        get().revertPreview();
      },

      unlockSageChakra: () => {
        if (previewTimer) {
          clearInterval(previewTimer);
          previewTimer = null;
        }
        const state = get();
        const updatedUnlocked = Array.from(new Set([...state.unlockedThemeIds, 'sage-chakra' as ThemeId]));
        applyDomTheme('sage-chakra');
        set({
          unlockedThemeIds: updatedUnlocked,
          activeTheme: 'sage-chakra',
          isProUnlocked: true,
          previewThemeId: null,
          previewSecondsRemaining: 0,
        });
        queueBackgroundSync(get);
      },

      unlockProMock: () => {
        if (previewTimer) {
          clearInterval(previewTimer);
          previewTimer = null;
        }
        const state = get();
        const permanentTheme = state.previewThemeId || state.activeTheme;
        const allThemes: ThemeId[] = [
          'midnight-mint',
          'sage-chakra',
          'cyber-tokyo',
          'nordic-frost',
          'kyoto-amber',
          'obsidian-sunset',
        ];
        applyDomTheme(permanentTheme);
        set({
          isProUnlocked: true,
          unlockedThemeIds: allThemes,
          activeTheme: permanentTheme,
          previewThemeId: null,
          previewSecondsRemaining: 0,
        });
        queueBackgroundSync(get);
      },

      openThemeModal: () => set({ isThemeModalOpen: true }),

      closeThemeModal: () => {
        const state = get();
        const activePreview = state.previewThemeId;
        if (activePreview && !state.unlockedThemeIds.includes(activePreview)) {
          if (previewTimer) {
            clearInterval(previewTimer);
            previewTimer = null;
          }
          applyDomTheme(state.activeTheme);
          set({
            isThemeModalOpen: false,
            previewThemeId: null,
            previewSecondsRemaining: 0,
          });
        } else {
          set({ isThemeModalOpen: false });
        }
      },
    }),
    {
      name: 'dayframe-local-store',
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        habits: state.habits,
        tasks: state.tasks,
        pomodoro: {
          settings: state.pomodoro.settings,
          currentCycle: state.pomodoro.currentCycle,
          mode: state.pomodoro.mode,
          // Exclude transient isRunning and volatile ticks
          timeLeft: state.pomodoro.settings.focusDuration,
          isRunning: false,
        },
        audio: {
          audioTracks: state.audio.audioTracks,
          activeTrackId: state.audio.activeTrackId,
          volume: state.audio.volume,
          isPlayingAudio: false,
        },
        sync: state.sync,
        lastSyncedAt: state.lastSyncedAt,
        activeTheme: state.activeTheme,
        unlockedThemeIds: state.unlockedThemeIds,
        isProUnlocked: state.isProUnlocked,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.activeTheme) {
          applyDomTheme(state.activeTheme);
        }
        if (state?.isProUnlocked && state?.unlockedThemeIds && !state.unlockedThemeIds.includes('sage-chakra')) {
          state.unlockedThemeIds.push('sage-chakra');
        }
        if (state?.audio?.audioTracks) {
          state.audio.audioTracks = state.audio.audioTracks.map((track) =>
            track.youtubeId === 'jfKfPfyJRdk'
              ? { ...track, youtubeId: '5qap5aO4i9A' }
              : track
          );
        }
      },
    }
  )
);

export type DayframeState = DayframeStore;
