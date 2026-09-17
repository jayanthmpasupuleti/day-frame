export interface Habit {
  id: string;
  name: string;
  completedToday: boolean;
  streak: number;
  lastCompletedDate?: string; // YYYY-MM-DD format for date verification
  category?: 'focus' | 'mindset' | 'health' | 'routine';
  history?: Record<string, boolean>; // key: "YYYY-MM-DD", value: true if completed
}

export type TaskStatus = 'backlog' | 'in_focus' | 'done';

export interface AgileTask {
  id: string;
  title: string;
  status: TaskStatus;
  tag: string;
  pomosEst: number;
  pomosDone: number;
  durationMinutes?: number; // 0 indicates untimed / no pomodoro required
  notes?: string[];
  completedAt?: string;
}

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export interface PomodoroSettings {
  focusDuration: number; // in seconds (e.g. 1500 for 25m)
  shortBreakDuration: number; // in seconds (e.g. 300 for 5m)
  longBreakDuration: number; // in seconds (e.g. 900 for 15m)
  autoSyncAudio: boolean; // auto-play/pause audio on timer start/stop
}

export interface PomodoroState {
  mode: PomodoroMode;
  timeLeft: number;
  isRunning: boolean;
  currentCycle: number; // 1 to 4
  settings: PomodoroSettings;
}

export interface AudioTrack {
  id: string;
  title: string;
  youtubeId: string;
}

export interface AudioState {
  audioTracks: AudioTrack[];
  activeTrackId: string;
  isPlayingAudio: boolean;
  volume: number; // 0.0 to 1.0
}

export interface SyncState {
  isGuest: boolean;
  isOnline: boolean;
  statusText: string;
}
