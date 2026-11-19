import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Compass,
  CreditCard,
  Gift,
  QrCode,
  SlidersHorizontal,
  Sparkles,
  TrendingDown,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCampusCrave } from '../../context/CampusCraveContext';
import {
  buildWeeklyNutritionTrend,
  calculateProjectedSemesterSavings,
  calculateSavingsSummary,
  formatInr,
} from '../../utils/campusCraveLogic';

type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'latenight';

const SLOT_RECOMMENDATIONS: Record<
  MealSlot,
  { label: string; eateryId: string; note: string }
> = {
  breakfast: {
    label: 'Breakfast (7:30–10 AM)',
    eateryId: 'south-spice',
    note: 'Light, crisp & fast before 9 AM lectures',
  },
  lunch: {
    label: 'Lunch (12–3 PM)',
    eateryId: 'pahadi-rasoi',
    note: 'Hearty homestyle Rajma Chawal & 2 rotis',
  },
  dinner: {
    label: 'Dinner (7–10 PM)',
    eateryId: 'healthy-bowl',
    note: '32g clean protein recovery bowl',
  },
  latenight: {
    label: 'Late Night (Till 11:30 PM)',
    eateryId: 'chai-parantha',
    note: '2-min walk from DBS gate for study nights',
  },
};

export function StudentHome() {
  const {
    state,
    setActiveTab,
    setHubSubPage,
    setSelectedEateryId,
    jumpToQrRedeem,
    getStudentRedemptions,
  } = useCampusCrave();

  const [activeSlot, setActiveSlot] = useState<MealSlot>('lunch');
  const [showSimulator, setShowSimulator] = useState(false);
  const [simMealsPerMonth, setSimMealsPerMonth] = useState(36);

  const studentRedemptions = getStudentRedemptions();
  const savings = calculateSavingsSummary(studentRedemptions);
  const projected = calculateProjectedSemesterSavings(simMealsPerMonth);
  const nutritionSummary = buildWeeklyNutritionTrend({
    redemptions: studentRedemptions,
    eateries: state.eateries,
    planId: state.subscription.planId,
    nowMs: Date.now(),
  });

  // Animated savings counter
  const [displayedSaved, setDisplayedSaved] = useState(0);
  useEffect(() => {
    const target = savings.totalSaved;
    const duration = 550;
    const start = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayedSaved(Math.round(target * eased));
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [savings.totalSaved]);

  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const mealsToday = studentRedemptions.filter((r) => r.dateStr === todayStr).length;
  const dailyLimit = state.subscription.dailyLimit;
  const ringProgress = Math.min(1, mealsToday / dailyLimit);
  const ringCircumference = 2 * Math.PI * 24;
  const ringOffset = ringCircumference * (1 - ringProgress);

  const firstName = state.student.name.split(' ')[0] || 'Student';
  const openEateries = state.eateries.filter((e) =>
    state.student.vegOnly ? e.isPureVeg : true,
  );

  const slotInfo = SLOT_RECOMMENDATIONS[activeSlot];
  const slotEatery =
    state.eateries.find((e) => e.id === slotInfo.eateryId) || state.eateries[0];

  return (
    <div className="space-y-5 pb-6">
      {/* Greeting Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {state.student.hostelOrPg} · {state.student.streakDays}-day streak
          </p>
          <h1 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mt-0.5">
            Hey {firstName}, hungry?
          </h1>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => setActiveTab('buddy')}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-md border border-stone-200/80 dark:border-white/10 text-xs font-semibold text-zinc-800 dark:text-zinc-100 hover:border-[#FF6B35] transition-colors cursor-pointer min-h-[40px] shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#FF6B35]" />
          Ask AI Buddy
        </motion.button>
      </div>

      {/* Active Plan Hero Card */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-br from-zinc-900 via-[#151822] to-zinc-950 text-white border border-white/10 shadow-[0_18px_40px_-14px_rgba(255,107,53,0.22)] space-y-4"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent animate-cc-shimmer"
        />
        <div className="relative flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs text-amber-300 font-medium">
              {state.subscription.planName} · Active
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono tabular-nums">
                {state.subscription.creditsRemaining}
              </span>
              <span className="text-xs text-zinc-400 font-mono tabular-nums">
                / {state.subscription.creditsTotal} meals left
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {state.subscription.daysLeft} days left · Renews {state.subscription.expiresAtLabel}
            </p>
          </div>

          <div className="flex flex-col items-center shrink-0">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 60 60" aria-hidden="true">
                <circle
                  cx="30"
                  cy="30"
                  r="24"
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth="5"
                  fill="none"
                />
                <motion.circle
                  cx="30"
                  cy="30"
                  r="24"
                  stroke="#FF6B35"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  initial={{ strokeDashoffset: ringCircumference }}
                  animate={{ strokeDashoffset: ringOffset }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                  fill="none"
                />
              </svg>
              <span className="absolute text-xs font-bold font-mono tabular-nums">
                {mealsToday}/{dailyLimit}
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 mt-1">Today&apos;s credit</span>
          </div>
        </div>

        <div className="relative pt-2 border-t border-white/10 flex items-center justify-between gap-3">
          <span className="text-xs text-zinc-300">Zero delivery · Zero platform fees</span>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => setActiveTab('qr')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#ff7d4d] text-white text-xs font-bold shadow-md shadow-[#FF6B35]/25 hover:brightness-105 transition-all cursor-pointer min-h-[40px]"
          >
            <QrCode className="w-3.5 h-3.5" />
            Show QR Pass
          </motion.button>
        </div>
      </motion.section>

      {/* Quick Actions */}
      <section aria-label="Quick actions" className="grid grid-cols-4 gap-2">
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setActiveTab('qr')}
          className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] hover:border-[#FF6B35] transition-colors cursor-pointer min-h-[72px]"
        >
          <QrCode className="w-5 h-5 text-[#FF6B35]" />
          <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
            QR Pass
          </span>
        </motion.button>
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setActiveTab('explore')}
          className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] hover:border-[#FF6B35] transition-colors cursor-pointer min-h-[72px]"
        >
          <Compass className="w-5 h-5 text-[#15803D] dark:text-emerald-400" />
          <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
            Find Food
          </span>
        </motion.button>
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            setHubSubPage('plans');
            setActiveTab('hub');
          }}
          className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] hover:border-[#FF6B35] transition-colors cursor-pointer min-h-[72px]"
        >
          <CreditCard className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
          <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
            Buy Pass
          </span>
        </motion.button>
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            setHubSubPage('rewards');
            setActiveTab('hub');
          }}
          className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] hover:border-[#FF6B35] transition-colors cursor-pointer min-h-[72px]"
        >
          <Gift className="w-5 h-5 text-[#FF6B35]" />
          <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
            Refer
          </span>
        </motion.button>
      </section>

      {/* Interactive Meal Slot Matcher */}
      <section className="p-4 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            What&apos;s your meal slot?
          </h2>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {slotInfo.label}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-stone-100/90 dark:bg-zinc-900/90 border border-stone-200/60 dark:border-white/[0.05]">
          {(
            [
              { id: 'breakfast', label: 'Breakfast' },
              { id: 'lunch', label: 'Lunch' },
              { id: 'dinner', label: 'Dinner' },
              { id: 'latenight', label: 'Night' },
            ] as const
          ).map((slot) => {
            const isSelected = activeSlot === slot.id;
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => setActiveSlot(slot.id)}
                className={`relative py-1.5 px-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                  isSelected
                    ? 'text-[#FF6B35]'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {isSelected && (
                  <motion.span
                    layoutId="meal-slot-pill"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-lg bg-white dark:bg-[#1C2029] shadow-sm border border-stone-200/70 dark:border-white/[0.08]"
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10">{slot.label}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {slotEatery && (
            <motion.div
              key={slotEatery.id + activeSlot}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
              className="flex items-center justify-between gap-3 pt-1"
            >
              <div className="min-w-0">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {slotEatery.name} · {slotEatery.distanceKm} km
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  {slotInfo.note}
                </div>
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => jumpToQrRedeem(slotEatery.id, slotEatery.menu[0]?.name)}
                className="px-3 py-2 rounded-xl bg-[#FF6B35] text-white text-xs font-bold shrink-0 cursor-pointer min-h-[38px] shadow-sm shadow-[#FF6B35]/20"
              >
                Redeem
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Savings Tracker Card + Interactive Semester Projection */}
      <section className="p-4 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-[#15803D] dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Savings vs Zomato & Swiggy
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSimulator(!showSimulator)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-[#FF6B35] cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {showSimulator ? 'Hide Calc' : 'Project'}
            </button>
            <button
              type="button"
              onClick={() => {
                setHubSubPage('budget');
                setActiveTab('hub');
              }}
              className="text-xs font-semibold text-[#FF6B35] hover:underline cursor-pointer"
            >
              Charts
            </button>
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <div>
            <div className="text-2xl font-extrabold font-mono tabular-nums text-[#15803D] dark:text-emerald-400">
              {formatInr(displayedSaved)}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Saved across {savings.mealsRedeemed} meals this cycle
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-mono tabular-nums text-zinc-700 dark:text-zinc-300">
              {formatInr(savings.totalCampusCraveSpend)} vs {formatInr(savings.totalDeliveryEquivalent)}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
              ~₹52/meal vs ~₹195/delivery
            </div>
          </div>
        </div>

        <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#15803D] to-emerald-400 transition-all duration-500"
            style={{ width: `${Math.min(100, savings.savingsPercent)}%` }}
          />
        </div>

        {showSimulator && (
          <div className="pt-3 border-t border-stone-100 dark:border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="sem-meals-slider" className="font-medium text-zinc-700 dark:text-zinc-300">
                Meals/month simulator: <strong className="font-mono">{simMealsPerMonth}</strong>
              </label>
              <span className="font-mono font-bold text-[#15803D] dark:text-emerald-400">
                {formatInr(projected.semesterSaved)} / semester saved
              </span>
            </div>
            <input
              id="sem-meals-slider"
              type="range"
              min={10}
              max={60}
              step={2}
              value={simMealsPerMonth}
              onChange={(e) => setSimMealsPerMonth(Number(e.target.value))}
              className="w-full accent-[#FF6B35] cursor-pointer"
            />
          </div>
        )}
      </section>

      {/* Today's Nutrition Snapshot */}
      <section className="p-4 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#FF6B35]" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Daily Nutrition &amp; Macros
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setHubSubPage('nutrition');
              setActiveTab('hub');
            }}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6B35] hover:underline cursor-pointer"
          >
            Weekly Trend
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-baseline justify-between font-mono tabular-nums">
              <span className="text-zinc-500 dark:text-zinc-400">Calories</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                {nutritionSummary.today.calories} / {nutritionSummary.target.targetCalories} kcal
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#FF6B35] transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (nutritionSummary.today.calories /
                        Math.max(1, nutritionSummary.target.targetCalories)) *
                        100,
                    ),
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between font-mono tabular-nums">
              <span className="text-zinc-500 dark:text-zinc-400">Protein</span>
              <span className="font-bold text-[#15803D] dark:text-emerald-400">
                {nutritionSummary.today.protein}g / {nutritionSummary.target.targetProtein}g
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#15803D] dark:bg-emerald-500 transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (nutritionSummary.today.protein /
                        Math.max(1, nutritionSummary.target.targetProtein)) *
                        100,
                    ),
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Today's Specials Near Selakui */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            Today&apos;s Specials Near Campus
          </h2>
          <button
            type="button"
            onClick={() => setActiveTab('explore')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF6B35] hover:underline cursor-pointer"
          >
            All 6 spots
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {openEateries.slice(0, 4).map((eatery) => (
            <motion.div
              key={eatery.id}
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              className="group rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] overflow-hidden flex items-stretch shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="w-24 sm:w-28 shrink-0 bg-stone-100 dark:bg-zinc-800 relative overflow-hidden">
                <img
                  src={eatery.image}
                  alt={eatery.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover min-h-[96px] group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 truncate">
                      {eatery.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#15803D] dark:text-emerald-400 shrink-0">
                      <BadgeCheck className="w-3.5 h-3.5" />
                      {eatery.hygieneRating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                    {eatery.distanceKm} km · {eatery.isPureVeg ? 'Pure Veg' : 'Veg & Non-Veg'} · {eatery.rushLevel} rush
                  </p>
                  <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 mt-1.5 line-clamp-1">
                    {eatery.todaySpecial}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-stone-100 dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEateryId(eatery.id);
                      setActiveTab('explore');
                    }}
                    className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-[#FF6B35] cursor-pointer"
                  >
                    View Menu
                  </button>
                  <button
                    type="button"
                    onClick={() => jumpToQrRedeem(eatery.id, eatery.menu[0]?.name)}
                    className="text-xs font-bold text-[#FF6B35] hover:underline cursor-pointer"
                  >
                    Quick Redeem →
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

