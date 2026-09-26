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
import {
  PlasmaBadge,
  PlasmaButton,
  PlasmaProgress,
  PlasmaInput,
  PlasmaCard,
} from './plasma';

// Helper to get category icon for habits
const getCategoryIcon = (category?: Habit['category']) => {
  switch (category) {
    case 'focus':
      return <Target className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />;
    case 'mindset':
      return <BookOpen className="w-3.5 h-3.5 text-[#A78BFA]" />;
    case 'health':
      return <Droplets className="w-3.5 h-3.5 text-[#38BDF8]" />;
    case 'routine':
      return <Coffee className="w-3.5 h-3.5 text-[#F59E0B]" />;
    default:
      return <Zap className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />;
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
          <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 font-mono">
            HABIT PULSE
          </span>
          <PlasmaBadge variant="muted" mono size="sm">
            {completedCount} of {habits.length} COMPLETED
          </PlasmaBadge>
        </div>

        {/* Right: Expandable Grid Toggle Pill + Progress Bar */}
        <div className="flex items-center gap-3">
          {/* Heatmap Grid Toggle Pill Button */}
          <PlasmaButton
            size="sm"
            variant={isHeatmapExpanded ? 'primary' : 'subtle'}
            onClick={() => setIsHeatmapExpanded((prev) => !prev)}
            title={isHeatmapExpanded ? 'Collapse Habit History Grid' : 'Expand Habit History Grid'}
            className="font-mono text-[10px]"
          >
            <LayoutGrid className="w-3 h-3 text-current" />
            <span>History / Grid</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 ${
                isHeatmapExpanded ? 'rotate-180' : ''
              }`}
            />
          </PlasmaButton>

          {/* Completion Progress Indicator */}
          <div className="flex items-center gap-2">
            <PlasmaProgress
              value={completedCount}
              max={habits.length || 1}
              size="sm"
              showLabel
              className="w-24"
            />
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* Horizontal Habit Chips Row using Plasma Primitives                     */}
      {/* --------------------------------------------------------------------- */}
      <div
        ref={scrollContainerRef}
        onWheel={handleWheel}
        className="flex items-center gap-2 overflow-x-auto pt-2 pb-0.5 pr-6 no-scrollbar scroll-smooth"
      >
        {habits.map((habit) => (
          <PlasmaBadge
            key={habit.id}
            interactive
            active={habit.completedToday}
            variant={habit.completedToday ? 'primary' : 'outline'}
            size="md"
            onClick={() => toggleHabit(habit.id)}
            className="flex-shrink-0 gap-2 px-3 py-1 cursor-pointer"
          >
            {/* Circle State Indicator */}
            {habit.completedToday ? (
              <div className="w-4 h-4 rounded-full bg-[var(--accent-primary-text)] text-[var(--accent-primary)] flex items-center justify-center shadow-xs">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
            ) : (
              <div className="w-4 h-4 rounded-full border border-white/25 bg-[var(--bg-card)] flex items-center justify-center">
                {getCategoryIcon(habit.category)}
              </div>
            )}

            {/* Habit Name */}
            <span
              className={`text-[11.5px] font-medium tracking-tight ${
                habit.completedToday ? 'font-bold' : 'text-slate-300'
              }`}
            >
              {habit.name}
            </span>

            {/* Streak Indicator */}
            {habit.streak > 0 && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5 ${
                  habit.completedToday
                    ? 'bg-black/20 text-current'
                    : 'bg-white/[0.08] text-slate-300'
                }`}
              >
                <Flame className="w-2.5 h-2.5 fill-current text-amber-400" />
                <span className="tabular-nums">{habit.streak}d</span>
              </span>
            )}
          </PlasmaBadge>
        ))}

        {/* + Add Habit Pill Button */}
        <PlasmaButton
          size="sm"
          variant="secondary"
          onClick={() => setIsAdding(true)}
          className="flex-shrink-0 text-[11px]"
          title="Add a new daily habit"
        >
          <Plus className="w-3 h-3 stroke-[2.5]" />
          <span>Add Habit</span>
        </PlasmaButton>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* Collapsible Heatmap Drawer (PlasmaCard Surface)                       */}
      {/* --------------------------------------------------------------------- */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isHeatmapExpanded
            ? 'max-h-[420px] opacity-100 mt-2.5 pt-2.5 border-t border-white/[0.06]'
            : 'max-h-0 opacity-0 mt-0 pt-0 pointer-events-none'
        }`}
      >
        <PlasmaCard elevation={0.2} radius={14} className="p-3.5">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/[0.05]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_6px_var(--glow-primary)]" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
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
                <PlasmaCard
                  key={habit.id}
                  elevation={0.1}
                  radius={12}
                  className="p-3 flex items-center justify-between gap-3 shadow-xs"
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
                        <span className="text-[var(--accent-primary)] font-bold tabular-nums">
                          {rate30d}%
                        </span>{' '}
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
                                      ? 'bg-[var(--bg-inset)]/40 border border-white/[0.02] cursor-default'
                                      : isDone
                                      ? isHighTier
                                        ? 'bg-[var(--accent-primary)] brightness-110 shadow-[0_0_6px_var(--glow-primary)] hover:brightness-125 hover:scale-125'
                                        : 'bg-[var(--accent-primary)]/85 shadow-[0_0_4px_var(--glow-primary)] hover:brightness-125 hover:scale-125'
                                      : 'bg-[var(--bg-canvas)] border border-white/[0.04] hover:border-white/20 hover:scale-110'
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
                        <span className="w-1.5 h-1.5 rounded-[1px] bg-[var(--bg-canvas)] border border-white/[0.06]" />
                        <span>Missed</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-[1px] bg-[var(--accent-primary)] shadow-[0_0_4px_var(--glow-primary)]" />
                        <span>Done</span>
                      </div>
                    </div>
                  </div>
                </PlasmaCard>
              );
            })}
          </div>
        </PlasmaCard>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* Anchored Add Habit Bar using Plasma Primitives                        */}
      {/* --------------------------------------------------------------------- */}
      {isAdding && (
        <div
          className="absolute inset-x-0 top-0 bottom-0 z-30 px-5 bg-[var(--bg-card)]/95 backdrop-blur-xl flex items-center justify-between border-b border-[var(--accent-primary)]/30 animate-in fade-in duration-150"
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            <span className="text-[11px] font-mono uppercase text-[var(--accent-primary)] font-bold">
              New Ritual:
            </span>
            <form onSubmit={handleAdd} className="flex-1 flex items-center gap-2">
              <PlasmaInput
                ref={inputRef}
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="e.g. Read 20m, Hydrate (2L), Code / Build..."
                className="flex-1"
                autoFocus
              />

              <select
                value={newHabitCategory}
                onChange={(e) => setNewHabitCategory(e.target.value as Habit['category'])}
                className="h-8 px-2 rounded-xl bg-[var(--bg-inset)] border border-white/20 text-[10.5px] font-mono text-slate-300 focus:outline-none"
              >
                <option value="focus">Focus</option>
                <option value="mindset">Mindset</option>
                <option value="health">Health</option>
                <option value="routine">Routine</option>
              </select>

              <PlasmaButton
                type="submit"
                variant="primary"
                size="sm"
                className="shrink-0 font-bold"
              >
                Save Habit
              </PlasmaButton>
            </form>
          </div>

          <PlasmaButton
            size="icon"
            variant="ghost"
            onClick={() => {
              setIsAdding(false);
              setNewHabitName('');
            }}
            className="shrink-0 ml-2"
            title="Cancel (Esc)"
          >
            <X className="w-4 h-4" />
          </PlasmaButton>
        </div>
      )}
    </section>
  );
};

export default HabitPulse;
