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
  ThemeId,
} from '../types';
import { idbStorage } from './idbStorage';

export type { ThemeId };

export interface DayframeStore {
  // Theme Engine & Pro State
  activeTheme: ThemeId;
  isProUnlocked: boolean;
  isThemeModalOpen: boolean;
  previewTheme: ThemeId | null;
  previewSecondsRemaining: number;
  setTheme: (theme: ThemeId) => void;
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

  // Cloud Sync
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

export const applyDomTheme = (theme: ThemeId) => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
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
      },

      deleteHabit: (id: string) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
        }));
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
      },

      incrementTaskPomo: (id: string) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, pomosDone: task.pomosDone + 1 } : task
          ),
        }));
      },

      deleteTask: (id: string) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
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

      // --- CLOUD SYNC ---
      sync: {
        isGuest: true,
        isOnline: false,
        statusText: 'Guest / Offline Mode',
      },

      toggleGuestMode: () => {
        set((state) => {
          const nextGuest = !state.sync.isGuest;
          return {
            sync: {
              isGuest: nextGuest,
              isOnline: !nextGuest,
              statusText: nextGuest ? 'Guest / Offline Mode' : 'Connected to Supabase',
            },
          };
        });
      },

      // --- THEME ENGINE & PRO STATE ---
      activeTheme: 'midnight-mint',
      isProUnlocked: false,
      isThemeModalOpen: false,
      previewTheme: null,
      previewSecondsRemaining: 0,

      setTheme: (theme: ThemeId) => {
        if (previewTimer) {
          clearInterval(previewTimer);
          previewTimer = null;
        }
        applyDomTheme(theme);
        set({
          activeTheme: theme,
          previewTheme: null,
          previewSecondsRemaining: 0,
        });
      },

      unlockProMock: () => {
        if (previewTimer) {
          clearInterval(previewTimer);
          previewTimer = null;
        }
        const state = get();
        const permanentTheme = state.previewTheme || state.activeTheme;
        applyDomTheme(permanentTheme);
        set({
          isProUnlocked: true,
          activeTheme: permanentTheme,
          previewTheme: null,
          previewSecondsRemaining: 0,
        });
      },

      openThemeModal: () => set({ isThemeModalOpen: true }),

      closeThemeModal: () => {
        const state = get();
        if (state.previewTheme && !state.isProUnlocked) {
          if (previewTimer) {
            clearInterval(previewTimer);
            previewTimer = null;
          }
          applyDomTheme(state.activeTheme);
          set({
            isThemeModalOpen: false,
            previewTheme: null,
            previewSecondsRemaining: 0,
          });
        } else {
          set({ isThemeModalOpen: false });
        }
      },

      startPreviewTheme: (theme: ThemeId) => {
        if (previewTimer) {
          clearInterval(previewTimer);
          previewTimer = null;
        }
        applyDomTheme(theme);
        set({
          previewTheme: theme,
          previewSecondsRemaining: 10,
        });

        previewTimer = setInterval(() => {
          const currentRemaining = get().previewSecondsRemaining;
          if (currentRemaining <= 1) {
            clearInterval(previewTimer);
            previewTimer = null;
            applyDomTheme(get().activeTheme);
            set({
              previewTheme: null,
              previewSecondsRemaining: 0,
            });
          } else {
            set({ previewSecondsRemaining: currentRemaining - 1 });
          }
        }, 1000);
      },

      cancelPreviewTheme: () => {
        if (previewTimer) {
          clearInterval(previewTimer);
          previewTimer = null;
        }
        applyDomTheme(get().activeTheme);
        set({
          previewTheme: null,
          previewSecondsRemaining: 0,
        });
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
        activeTheme: state.activeTheme,
        isProUnlocked: state.isProUnlocked,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.activeTheme) {
          applyDomTheme(state.activeTheme);
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
