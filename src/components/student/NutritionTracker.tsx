import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  Beef,
  Flame,
  QrCode,
  Target,
  Utensils,
} from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AnimatePresence, motion } from 'motion/react';
import { useCampusCrave } from '../../context/CampusCraveContext';
import { SUBSCRIPTION_PLANS } from '../../data/mockData';
import {
  buildWeeklyNutritionTrend,
  parseNutritionNumber,
} from '../../utils/campusCraveLogic';

type ChartMetricMode = 'dual' | 'calories' | 'protein';

const PLAN_SHORT_LABELS: Record<string, string> = {
  'trial-199': '3-Day Trial',
  'weekly-499': '7-Day Pass',
  'monthly-1999': 'Monthly ₹1,999',
  'ambitious-3799': 'Duo Bundle',
};

export function NutritionTracker({ onBack }: { onBack: () => void }) {
  const {
    state,
    getStudentRedemptions,
    setHubSubPage,
    jumpToQrRedeem,
  } = useCampusCrave();

  const [selectedPlanId, setSelectedPlanId] = useState<string>(state.subscription.planId);
  const [chartMode, setChartMode] = useState<ChartMetricMode>('dual');
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  useEffect(() => {
    setSelectedPlanId(state.subscription.planId);
  }, [state.subscription.planId]);

  const studentRedemptions = getStudentRedemptions();

  const summary = useMemo(
    () =>
      buildWeeklyNutritionTrend({
        redemptions: studentRedemptions,
        eateries: state.eateries,
        planId: selectedPlanId,
        plans: SUBSCRIPTION_PLANS,
        nowMs: Date.now(),
      }),
    [studentRedemptions, state.eateries, selectedPlanId],
  );

  const activeDay = useMemo(() => {
    if (selectedDateKey) {
      const found = summary.days.find((d) => d.dateKey === selectedDateKey);
      if (found) return found;
    }
    return summary.today;
  }, [summary, selectedDateKey]);

  const isPreviewingOtherPlan = selectedPlanId !== state.subscription.planId;
  const caloriePctOfPlan = Math.min(
    100,
    Math.round((summary.today.calories / Math.max(1, summary.target.targetCalories)) * 100),
  );
  const proteinPctOfPlan = Math.min(
    100,
    Math.round((summary.today.protein / Math.max(1, summary.target.targetProtein)) * 100),
  );
  const caloriePctOfRda = Math.round(
    (summary.today.calories / summary.target.dailyRdaCalories) * 100,
  );
  const proteinPctOfRda = Math.round(
    (summary.today.protein / summary.target.dailyRdaProtein) * 100,
  );

  const highProteinPicks = useMemo(() => {
    const items: {
      id: string;
      eateryId: string;
      eateryName: string;
      distanceKm: number;
      name: string;
      calories: number;
      protein: number;
      isVeg: boolean;
    }[] = [];

    for (const eatery of state.eateries) {
      if (!eatery.isOpen) continue;
      for (const dish of eatery.menu) {
        if (!dish.inStock) continue;
        if (state.student.vegOnly && !dish.isVeg) continue;
        items.push({
          id: dish.id,
          eateryId: eatery.id,
          eateryName: eatery.name,
          distanceKm: eatery.distanceKm,
          name: dish.name,
          calories: parseNutritionNumber(dish.calories, 550),
          protein: parseNutritionNumber(dish.protein, 18),
          isVeg: dish.isVeg,
        });
      }
    }

    return items.sort((a, b) => b.protein - a.protein).slice(0, 4);
  }, [state.eateries, state.student.vegOnly]);

  return (
    <div className="space-y-4 pb-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-[#FF6B35] cursor-pointer min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to More
      </button>

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Nutrition &amp; Macro Tracker
          </h1>
          <span className="text-xs font-mono font-semibold text-[#15803D] dark:text-emerald-400 shrink-0">
            {summary.totalWeeklyMeals} meals / 7d
          </span>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {state.subscription.planName} · {state.subscription.creditsRemaining} credits left ·{' '}
          {state.student.vegOnly ? 'Pure Veg filter on' : 'All Selakui kitchens'}
        </p>
      </div>

      {/* Subscription Plan Nutrition Target Switcher */}
      <section
        aria-label="Subscription plan nutrition targets"
        className="p-3.5 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] space-y-2.5"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
            <Target className="w-3.5 h-3.5 text-[#FF6B35] shrink-0" />
            <span>Plan Macro Budget</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 whitespace-nowrap shrink-0">
            {summary.target.mealsPerDayTarget} meals/d · ₹{summary.target.dailyPlanCostInr}/d
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const isCurrent = state.subscription.planId === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
                className={`relative px-3 py-2 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer min-h-[46px] flex flex-col items-start justify-center text-left border ${
                  isSelected
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-xs'
                    : 'bg-stone-50/90 dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 border-stone-200/70 dark:border-white/[0.06] hover:border-[#FF6B35]/60'
                }`}
              >
                <span className="truncate w-full whitespace-nowrap">
                  {PLAN_SHORT_LABELS[plan.id] || plan.name}
                </span>
                <span
                  className={`text-[10px] font-mono whitespace-nowrap ${
                    isSelected
                      ? 'text-amber-300 dark:text-[#FF6B35]'
                      : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                >
                  {isCurrent ? 'Active pass' : `${plan.credits} cr · ${plan.validityDays}d`}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
          <span>
            Target: <strong className="font-mono text-zinc-800 dark:text-zinc-200">{summary.target.targetCalories} kcal</strong> &amp;{' '}
            <strong className="font-mono text-zinc-800 dark:text-zinc-200">{summary.target.targetProtein}g protein</strong> / day
          </span>
          {isPreviewingOtherPlan && (
            <button
              type="button"
              onClick={() => setHubSubPage('plans')}
              className="inline-flex items-center gap-0.5 font-bold text-[#FF6B35] hover:underline cursor-pointer shrink-0"
            >
              Switch plan
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </section>

      {/* Today's Calorie & Protein Intake Summary Rings */}
      <section aria-label="Today's calorie and protein intake" className="grid grid-cols-2 gap-3">
        {(() => {
          const ringRadius = 37;
          const ringCircumference = 2 * Math.PI * ringRadius;
          const calorieOffset = ringCircumference * (1 - caloriePctOfPlan / 100);
          const proteinOffset = ringCircumference * (1 - proteinPctOfPlan / 100);

          return (
            <>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="p-3.5 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] flex flex-col items-center text-center space-y-2.5"
              >
                <div className="w-full flex items-center justify-between gap-1">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Calories Goal
                  </span>
                  <Flame className="w-4 h-4 text-[#FF6B35] shrink-0" />
                </div>

                <div
                  className="relative w-24 h-24 flex items-center justify-center"
                  data-testid="calories-progress-ring"
                >
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96" aria-hidden="true">
                    <defs>
                      <linearGradient id="cc-cal-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FF6B35" />
                        <stop offset="100%" stopColor="#FBBF24" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="48"
                      cy="48"
                      r="44"
                      stroke="currentColor"
                      className="text-stone-300/60 dark:text-zinc-700/60"
                      strokeWidth="1.25"
                      strokeDasharray="2 6"
                      fill="none"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r={ringRadius}
                      stroke="currentColor"
                      className="text-stone-100 dark:text-zinc-800/90"
                      strokeWidth="7"
                      fill="none"
                    />
                    <motion.circle
                      cx="48"
                      cy="48"
                      r={ringRadius}
                      stroke="url(#cc-cal-ring-grad)"
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      initial={{ strokeDashoffset: ringCircumference }}
                      animate={{ strokeDashoffset: calorieOffset }}
                      transition={{ type: 'spring', stiffness: 70, damping: 15, delay: 0.06 }}
                      style={{ filter: 'drop-shadow(0 0 6px rgba(255, 107, 53, 0.35))' }}
                      fill="none"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-extrabold font-mono tabular-nums text-zinc-900 dark:text-zinc-50 leading-none">
                      {caloriePctOfPlan}%
                    </span>
                    <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mt-1">
                      of pass
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-baseline justify-center gap-1">
                    <span
                      data-testid="today-calories-value"
                      className="text-base font-extrabold font-mono tabular-nums text-zinc-900 dark:text-zinc-50"
                    >
                      {summary.today.calories}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                      / {summary.target.targetCalories} kcal
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
                    {caloriePctOfRda}% of daily RDA
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="p-3.5 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] flex flex-col items-center text-center space-y-2.5"
              >
                <div className="w-full flex items-center justify-between gap-1">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Protein Goal
                  </span>
                  <Beef className="w-4 h-4 text-[#15803D] dark:text-emerald-400 shrink-0" />
                </div>

                <div
                  className="relative w-24 h-24 flex items-center justify-center"
                  data-testid="protein-progress-ring"
                >
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96" aria-hidden="true">
                    <defs>
                      <linearGradient id="cc-prot-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#15803D" />
                        <stop offset="100%" stopColor="#34D399" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="48"
                      cy="48"
                      r="44"
                      stroke="currentColor"
                      className="text-stone-300/60 dark:text-zinc-700/60"
                      strokeWidth="1.25"
                      strokeDasharray="2 6"
                      fill="none"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r={ringRadius}
                      stroke="currentColor"
                      className="text-stone-100 dark:text-zinc-800/90"
                      strokeWidth="7"
                      fill="none"
                    />
                    <motion.circle
                      cx="48"
                      cy="48"
                      r={ringRadius}
                      stroke="url(#cc-prot-ring-grad)"
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      initial={{ strokeDashoffset: ringCircumference }}
                      animate={{ strokeDashoffset: proteinOffset }}
                      transition={{ type: 'spring', stiffness: 70, damping: 15, delay: 0.14 }}
                      style={{ filter: 'drop-shadow(0 0 6px rgba(21, 128, 61, 0.35))' }}
                      fill="none"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-extrabold font-mono tabular-nums text-[#15803D] dark:text-emerald-400 leading-none">
                      {proteinPctOfPlan}%
                    </span>
                    <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mt-1">
                      of pass
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-baseline justify-center gap-1">
                    <span
                      data-testid="today-protein-value"
                      className="text-base font-extrabold font-mono tabular-nums text-[#15803D] dark:text-emerald-400"
                    >
                      {summary.today.protein}g
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                      / {summary.target.targetProtein}g
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
                    {proteinPctOfRda}% of daily RDA
                  </div>
                </div>
              </motion.div>
            </>
          );
        })()}
      </section>

      {/* Weekly Calorie & Protein Trend Chart */}
      <section className="p-4 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              7-Day Calorie &amp; Protein Trend
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
              Avg {summary.weeklyAvgCalories} kcal/d · {summary.weeklyAvgProtein}g protein/d ·{' '}
              {summary.proteinGoalDaysMet}/7 days hit target
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Chart metric view"
            className="inline-flex items-center gap-0.5 p-1 rounded-xl bg-stone-100 dark:bg-zinc-900 border border-stone-200/70 dark:border-white/[0.06]"
          >
            {(
              [
                { id: 'dual', label: 'Dual' },
                { id: 'calories', label: 'Calories' },
                { id: 'protein', label: 'Protein' },
              ] as const
            ).map((tab) => {
              const active = chartMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setChartMode(tab.id)}
                  className={`relative px-2.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'text-zinc-900 dark:text-zinc-50'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nutrition-chart-mode"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className="absolute inset-0 rounded-lg bg-white dark:bg-[#1E222C] shadow-xs border border-stone-200/60 dark:border-white/[0.08]"
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-56 w-full" data-testid="nutrition-weekly-chart">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={summary.days}
              margin={{ top: 10, right: chartMode === 'dual' ? 4 : 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#A1A1AA" opacity={0.22} />
              <XAxis
                dataKey="dayLabel"
                tick={{ fontSize: 11, fill: '#71717A' }}
                axisLine={false}
                tickLine={false}
              />
              {chartMode !== 'protein' && (
                <YAxis
                  yAxisId="cal"
                  tick={{ fontSize: 10, fill: '#71717A' }}
                  axisLine={false}
                  tickLine={false}
                />
              )}
              {chartMode !== 'calories' && (
                <YAxis
                  yAxisId="prot"
                  orientation={chartMode === 'dual' ? 'right' : 'left'}
                  tick={{ fontSize: 10, fill: '#15803D' }}
                  axisLine={false}
                  tickLine={false}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: state.darkMode ? '#181B24' : '#FFFFFF',
                  color: state.darkMode ? '#F4F4F5' : '#18181B',
                  borderRadius: '12px',
                  border: state.darkMode
                    ? '1px solid rgba(255,255,255,0.12)'
                    : '1px solid rgba(161,161,170,0.25)',
                  fontSize: '12px',
                }}
                formatter={(val, name) => {
                  const num = Number(val ?? 0);
                  if (String(name).toLowerCase().includes('protein')) {
                    return [`${num} g`, 'Protein'];
                  }
                  return [`${num} kcal`, 'Calories'];
                }}
              />

              {chartMode !== 'protein' && (
                <ReferenceLine
                  yAxisId="cal"
                  y={summary.target.targetCalories}
                  stroke="#FF6B35"
                  strokeDasharray="4 4"
                  strokeOpacity={0.75}
                />
              )}
              {chartMode === 'protein' && (
                <ReferenceLine
                  yAxisId="prot"
                  y={summary.target.targetProtein}
                  stroke="#15803D"
                  strokeDasharray="4 4"
                  strokeOpacity={0.85}
                />
              )}

              {chartMode !== 'protein' && (
                <Bar
                  yAxisId="cal"
                  dataKey="calories"
                  name="Calories (kcal)"
                  fill="#FF6B35"
                  radius={[6, 6, 0, 0]}
                  barSize={chartMode === 'dual' ? 18 : 24}
                />
              )}

              {chartMode === 'protein' && (
                <Bar
                  yAxisId="prot"
                  dataKey="protein"
                  name="Protein (g)"
                  fill="#15803D"
                  radius={[6, 6, 0, 0]}
                  barSize={24}
                />
              )}

              {chartMode === 'dual' && (
                <Line
                  yAxisId="prot"
                  type="monotone"
                  dataKey="protein"
                  name="Protein (g)"
                  stroke="#15803D"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#15803D', strokeWidth: 2, stroke: '#FFFFFF' }}
                  activeDot={{ r: 6 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-100 dark:border-white/[0.06] text-[11px] text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-3">
            {chartMode !== 'protein' && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#FF6B35]" aria-hidden="true" />
                Calories (kcal)
              </span>
            )}
            {chartMode !== 'calories' && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]" aria-hidden="true" />
                Protein (g)
              </span>
            )}
          </div>
          <span className="font-mono">
            Dashed line = {PLAN_SHORT_LABELS[selectedPlanId] || summary.target.planName} goal
          </span>
        </div>
      </section>

      {/* Interactive 7-Day Scroller & Logged Meals Inspector */}
      <section className="p-4 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#FF6B35]" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Daily Meal Log Breakdown
            </h2>
          </div>
          <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
            {activeDay.shortDate}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {summary.days.map((day) => {
            const isSelected = activeDay.dateKey === day.dateKey;
            return (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => setSelectedDateKey(day.dateKey)}
                aria-label={`Inspect ${day.dayLabel} ${day.shortDate}`}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 text-center transition-colors cursor-pointer min-h-[54px] border ${
                  isSelected
                    ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-xs'
                    : 'bg-stone-50 dark:bg-white/[0.03] text-zinc-700 dark:text-zinc-300 border-stone-200/60 dark:border-white/[0.06] hover:border-[#FF6B35]/50'
                }`}
              >
                <span className="text-[10px] font-semibold">
                  {day.isToday ? 'Now' : day.dayLabel}
                </span>
                <span className="text-xs font-extrabold font-mono tabular-nums">
                  {day.protein}g
                </span>
                <span
                  className={`text-[9px] font-mono ${
                    isSelected ? 'text-white/90' : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                >
                  {day.mealsCount}m
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeDay.dateKey}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
            className="space-y-2 pt-1"
          >
            <div className="flex items-center justify-between text-xs font-mono tabular-nums text-zinc-600 dark:text-zinc-300 pb-1 border-b border-stone-100 dark:border-white/[0.06]">
              <span>
                {activeDay.dayLabel} ({activeDay.shortDate})
              </span>
              <span>
                {activeDay.calories} kcal · {activeDay.protein}g protein
              </span>
            </div>

            {activeDay.dishes.length === 0 ? (
              <div className="py-4 text-center space-y-2">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  No CampusCrave meals logged on {activeDay.shortDate}.
                </p>
                <button
                  type="button"
                  onClick={() => jumpToQrRedeem('healthy-bowl', 'Roasted Paneer & Chickpea Bowl')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FF6B35]/10 text-[#FF6B35] text-xs font-bold hover:bg-[#FF6B35]/20 cursor-pointer min-h-[40px]"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Redeem a High-Protein Bowl
                </button>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 dark:divide-white/[0.06]">
                {activeDay.dishes.map((meal) => (
                  <div
                    key={meal.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {meal.dishName}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        {meal.eateryName} · {meal.timeStr}
                      </div>
                    </div>
                    <div className="text-right font-mono tabular-nums shrink-0">
                      <div className="font-bold text-[#15803D] dark:text-emerald-400">
                        {meal.protein}g protein
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {meal.calories} kcal
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* High-Protein Selakui Picks */}
      <section className="p-4 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Utensils className="w-4 h-4 text-[#15803D] dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Top Protein Picks (1 Credit)
            </h2>
          </div>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Instant macro boost
          </span>
        </div>

        <div className="divide-y divide-stone-100 dark:divide-white/[0.06]">
          {highProteinPicks.map((dish) => (
            <div
              key={dish.id}
              className="py-2.5 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {dish.name}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  {dish.eateryName} · {dish.distanceKm} km · {dish.calories} kcal ·{' '}
                  <span className="font-semibold text-[#15803D] dark:text-emerald-400">
                    {dish.protein}g protein
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => jumpToQrRedeem(dish.eateryId, dish.name)}
                className="px-3 py-2 rounded-xl bg-[#FF6B35] text-white text-xs font-bold hover:brightness-105 cursor-pointer shrink-0 min-h-[40px]"
              >
                Redeem QR
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
