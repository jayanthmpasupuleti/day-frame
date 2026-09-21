import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Check,
  X,
  Flame,
  LayoutGrid,
  ChevronDown,
  Zap,
  BookOpen,
  Droplets,
  Target,
  Coffee,
} from 'lucide-react';
import { useDayframeStore } from '../store/useDayframeStore';
import type { Habit } from '../types';

// Helper to get category icon for habits
const getCategoryIcon = (category?: Habit['category']) => {
  switch (category) {
    case 'focus':
      return <Target className="w-3.5 h-3.5 text-[#00E599]" />;
    case 'mindset':
      return <BookOpen className="w-3.5 h-3.5 text-[#A78BFA]" />;
    case 'health':
      return <Droplets className="w-3.5 h-3.5 text-[#38BDF8]" />;
    case 'routine':
      return <Coffee className="w-3.5 h-3.5 text-[#F59E0B]" />;
    default:
      return <Zap className="w-3.5 h-3.5 text-[#00E599]" />;
  }
};

// Generate 8 trailing weeks of days ending with the current week (7 rows Mon-Sun x 8 columns)
interface DayInfo {
  date: Date;
  dateStr: string;
  dayOfWeek: number; // 0 = Mon, 6 = Sun
}

const getTrailingWeeks = (numWeeks = 8): DayInfo[][] => {
  const weeks: DayInfo[][] = [];
  const today = new Date();
  const currentDayOfWeek = (today.getDay() + 6) % 7; // Monday = 0, Sunday = 6

  // Start date = today minus past weeks minus day offset
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - ((numWeeks - 1) * 7 + currentDayOfWeek));

  const iterDate = new Date(startDate);

  for (let w = 0; w < numWeeks; w++) {
    const week: DayInfo[] = [];
    for (let d = 0; d < 7; d++) {
      const dCopy = new Date(iterDate);
      week.push({
        date: dCopy,
        dateStr: dCopy.toISOString().split('T')[0],
        dayOfWeek: d,
      });
      iterDate.setDate(iterDate.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
};

// Calculate 30-day completion percentage
const get30DayCompletionRate = (habit: Habit): number => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  let completedCount = 0;

  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const isDone =
      dateStr === todayStr
        ? habit.completedToday
        : Boolean(habit.history?.[dateStr]);

    if (isDone) {
      completedCount++;
    }
  }

  return Math.round((completedCount / 30) * 100);
};

export const HabitPulse: React.FC = () => {
  const { habits, toggleHabit, addHabit } = useDayframeStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState<Habit['category']>('focus');
  const [isHeatmapExpanded, setIsHeatmapExpanded] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const completedCount = habits.filter((h) => h.completedToday).length;
  const trailingWeeks = getTrailingWeeks(8);
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    addHabit(newHabitName.trim(), newHabitCategory);
    setNewHabitName('');
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsAdding(false);
      setNewHabitName('');
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <section className="px-5 py-2.5 border-b border-[var(--border-card)] bg-[var(--bg-canvas)]/95 flex flex-col select-none relative z-20 transition-all duration-300 ease-in-out">
      {/* --------------------------------------------------------------------- */}
      {/* Header Row: Title, Counts, Toggle Pill, Completion Progress           */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] font-mono">
            HABIT PULSE
          </span>
          <span className="text-[10.5px] font-mono text-slate-500 tabular-nums">
            • {completedCount} of {habits.length} COMPLETED
          </span>
        </div>

        {/* Right: Expandable Grid Toggle Pill + Progress Bar */}
        <div className="flex items-center gap-3">
          {/* Heatmap Grid Toggle Pill Button */}
          <button
            onClick={() => setIsHeatmapExpanded((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border transition-all cursor-pointer ${
              isHeatmapExpanded
                ? 'bg-primary/15 text-primary border-primary/40 shadow-mint-glow'
                : 'bg-[var(--bg-inset)] text-[#94A3B8] hover:text-white border-[var(--border-card)] hover:border-white/20'
            }`}
            title={isHeatmapExpanded ? 'Collapse Habit History Grid' : 'Expand Habit History Grid'}
          >
            <LayoutGrid className="w-3 h-3 text-current" />
            <span>History / Grid</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 ${
                isHeatmapExpanded ? 'rotate-180 text-primary' : ''
              }`}
            />
          </button>

          {/* Completion Progress Indicator */}
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 rounded-full bg-[var(--bg-inset)] overflow-hidden p-0.2">
              <div
                className="h-full rounded-full bg-[var(--accent-secondary)] transition-all duration-300 shadow-mint-glow"
                style={{
                  width: `${habits.length > 0 ? (completedCount / habits.length) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-[10px] font-mono text-[var(--accent-secondary)] font-bold tabular-nums">
              {habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* Horizontal Habit Pills Row                                            */}
      {/* --------------------------------------------------------------------- */}
      <div
        ref={scrollContainerRef}
        onWheel={handleWheel}
        className="flex items-center gap-2 overflow-x-auto pt-2 pb-0.5 pr-6 no-scrollbar scroll-smooth"
      >
        {habits.map((habit) => (
          <button
            key={habit.id}
            onClick={() => toggleHabit(habit.id)}
            className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all cursor-pointer flex-shrink-0 group ${
              habit.completedToday
                ? 'bg-[var(--accent-secondary)]/15 border-[var(--accent-secondary)] shadow-[0_0_12px_var(--glow-primary)] text-white'
                : 'bg-[var(--bg-inset)] border-[var(--border-card)] hover:border-white/20 text-slate-300'
            }`}
          >
            {/* Circle State Indicator */}
            {habit.completedToday ? (
              <div className="w-4 h-4 rounded-full bg-[var(--accent-secondary)] flex items-center justify-center text-[var(--accent-primary-text)] shadow-mint-btn">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
            ) : (
              <div className="w-4 h-4 rounded-full border border-white/25 bg-[var(--bg-card)] group-hover:border-[var(--accent-secondary)]/60 transition-colors flex items-center justify-center" />
            )}

            {/* Habit Name */}
            <span
              className={`text-[11.5px] font-medium tracking-tight ${
                habit.completedToday ? 'text-white font-semibold' : 'text-slate-300 group-hover:text-white'
              }`}
            >
              {habit.name}
            </span>

            {/* Streak Indicator */}
            {habit.streak > 0 && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5 ${
                  habit.completedToday
                    ? 'bg-[var(--accent-secondary)]/20 text-[var(--accent-secondary)]'
                    : 'bg-white/[0.05] text-[#94A3B8]'
                }`}
              >
                <Flame className="w-2.5 h-2.5 fill-current" />
                <span className="tabular-nums">{habit.streak}d</span>
              </span>
            )}
          </button>
        ))}

        {/* + Add Habit Pill Button */}
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-dashed border-white/20 hover:border-primary/60 text-[#94A3B8] hover:text-primary text-[11px] font-medium transition-all cursor-pointer flex-shrink-0"
          title="Add a new daily habit"
        >
          <Plus className="w-3 h-3 stroke-[2.5]" />
          <span>Add Habit</span>
        </button>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* Collapsible Heatmap Drawer (Habitify / GitHub Inspired)               */}
      {/* --------------------------------------------------------------------- */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isHeatmapExpanded
            ? 'max-h-[420px] opacity-100 mt-2.5 pt-2.5 border-t border-white/[0.06]'
            : 'max-h-0 opacity-0 mt-0 pt-0 pointer-events-none'
        }`}
      >
        <div className="p-3.5 rounded-xl bg-[#0D1117] border border-white/[0.07] shadow-card">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/[0.05]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E599]" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] font-mono">
                Consistency Heatmap (Trailing 8 Weeks)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Hover cells for timestamps &amp; completion status
            </span>
          </div>

          {/* Cards Grid for Each Tracked Habit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[290px] overflow-y-auto pr-1">
            {habits.map((habit) => {
              const rate30d = get30DayCompletionRate(habit);

              return (
                <div
                  key={habit.id}
                  className="p-3 rounded-xl bg-[#161B22]/70 border border-white/[0.05] hover:border-white/[0.12] transition-all flex items-center justify-between gap-3 shadow-xs"
                >
                  {/* Left: Habit Meta Info */}
                  <div className="min-w-[130px] flex-1">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="p-1 rounded-md bg-white/[0.05] border border-white/[0.06]">
                        {getCategoryIcon(habit.category)}
                      </div>
                      <span className="text-[12.5px] font-semibold text-white truncate max-w-[140px]">
                        {habit.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10.5px] font-mono">
                      <span className="flex items-center gap-0.5 text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded-full border border-amber-500/20 font-bold">
                        <Flame className="w-2.5 h-2.5 fill-current" />
                        <span className="tabular-nums">{habit.streak}d</span>
                      </span>
                      <span className="text-slate-400">
                        <span className="text-[#00E599] font-bold tabular-nums">{rate30d}%</span>{' '}
                        <span className="text-[9.5px] text-slate-500">30d</span>
                      </span>
                    </div>
                  </div>

                  {/* Right: Multi-Week Heatmap Grid (7 rows Mon-Sun x 8 weeks) */}
                  <div className="flex flex-col items-end shrink-0">
                    <div className="flex items-center gap-1.5">
                      {/* Day of Week Row Labels (Mon, Wed, Fri, Sun) */}
                      <div className="flex flex-col justify-between text-[8px] font-mono text-slate-500 h-[88px] leading-none py-0.5 select-none text-right pr-0.5">
                        <span>M</span>
                        <span>W</span>
                        <span>F</span>
                        <span>S</span>
                      </div>

                      {/* 8 Week Columns of 10px Cells with 3px Gaps */}
                      <div className="flex items-center gap-[3px]">
                        {trailingWeeks.map((week, wIdx) => (
                          <div key={wIdx} className="flex flex-col gap-[3px]">
                            {week.map((day, dIdx) => {
                              const isFuture = day.date > today;
                              const isToday = day.dateStr === todayStr;
                              const isDone = isToday
                                ? habit.completedToday
                                : Boolean(habit.history?.[day.dateStr]);

                              const isHighTier = isDone && habit.category === 'focus';
                              const statusText = isFuture
                                ? 'Upcoming'
                                : isDone
                                ? 'Completed'
                                : 'Missed';
                              const dateFormatted = day.date.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              });

                              return (
                                <div
                                  key={dIdx}
                                  className={`w-[10px] h-[10px] rounded-[2px] transition-all cursor-pointer ${
                                    isFuture
                                      ? 'bg-[#161B22]/40 border border-white/[0.02] cursor-default'
                                      : isDone
                                      ? isHighTier
                                        ? 'bg-[#6DFFBA] shadow-[0_0_4px_rgba(109,255,186,0.6)] hover:brightness-125 hover:scale-125'
                                        : 'bg-[#00E599] shadow-[0_0_4px_rgba(0,229,153,0.4)] hover:brightness-125 hover:scale-125'
                                      : 'bg-[#161B22] border border-white/[0.04] hover:border-white/20 hover:scale-110'
                                  }`}
                                  title={`${dateFormatted} • ${statusText}`}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Compact Cell Legend */}
                    <div className="flex items-center gap-2 mt-1.5 text-[8.5px] font-mono text-slate-500">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-[1px] bg-[#161B22] border border-white/[0.06]" />
                        <span>Missed</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-[1px] bg-[#00E599]" />
                        <span>Done</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* Anchored Add Habit Bar (Slides in, zero right-overflow)               */}
      {/* --------------------------------------------------------------------- */}
      {isAdding && (
        <div
          className="absolute inset-x-0 top-0 bottom-0 z-30 px-5 bg-[var(--bg-card)]/95 backdrop-blur-xl flex items-center justify-between border-b border-primary/30 animate-in fade-in duration-150"
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            <span className="text-[11px] font-mono uppercase text-primary font-bold">
              New Ritual:
            </span>
            <form onSubmit={handleAdd} className="flex-1 flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="e.g. Read 20m, Hydrate (2L), Code / Build..."
                className="flex-1 h-8 px-3 rounded-full bg-[var(--bg-inset)] border border-white/20 text-[12px] text-white placeholder-slate-500 focus:outline-none focus:border-primary"
              />

              <select
                value={newHabitCategory}
                onChange={(e) => setNewHabitCategory(e.target.value as Habit['category'])}
                className="h-8 px-2 rounded-full bg-[var(--bg-inset)] border border-white/20 text-[10.5px] font-mono text-slate-300 focus:outline-none"
              >
                <option value="focus">Focus</option>
                <option value="mindset">Mindset</option>
                <option value="health">Health</option>
                <option value="routine">Routine</option>
              </select>

              <button
                type="submit"
                className="h-8 px-3.5 rounded-full bg-primary hover:brightness-110 text-primaryText text-[11px] font-bold shadow-mint-btn transition-all cursor-pointer shrink-0"
              >
                Save Habit
              </button>
            </form>
          </div>

          <button
            onClick={() => {
              setIsAdding(false);
              setNewHabitName('');
            }}
            className="w-7 h-7 rounded-full hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
            title="Cancel (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
};

export default HabitPulse;
