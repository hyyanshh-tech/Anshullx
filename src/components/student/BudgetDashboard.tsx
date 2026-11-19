import React from 'react';
import { AlertTriangle, ArrowLeft, TrendingDown } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCampusCrave } from '../../context/CampusCraveContext';
import { calculateSavingsSummary, formatInr } from '../../utils/campusCraveLogic';

export function BudgetDashboard({ onBack }: { onBack: () => void }) {
  const { state, updateStudentProfile, getStudentRedemptions } = useCampusCrave();
  const redemptions = getStudentRedemptions();
  const savings = calculateSavingsSummary(redemptions);

  // Build weekly spend comparison chart data
  const weeklyData = [
    { week: 'Wk 1', campusCrave: 260, deliveryApp: 980 },
    { week: 'Wk 2', campusCrave: 315, deliveryApp: 1170 },
    { week: 'Wk 3', campusCrave: 210, deliveryApp: 790 },
    {
      week: 'Wk 4',
      campusCrave: Math.max(155, savings.totalCampusCraveSpend - 785),
      deliveryApp: Math.max(580, savings.totalDeliveryEquivalent - 2940),
    },
  ];

  // Favourite eateries count
  const countsByEatery: Record<string, { name: string; meals: number }> = {};
  for (const r of redemptions) {
    const shortName = r.eateryName.split(' ').slice(0, 2).join(' ');
    if (!countsByEatery[r.eateryId]) {
      countsByEatery[r.eateryId] = { name: shortName, meals: 0 };
    }
    countsByEatery[r.eateryId].meals += 1;
  }
  const eateryData = Object.values(countsByEatery).sort((a, b) => b.meals - a.meals);

  const budgetGoal = state.student.monthlyBudgetGoal;
  const budgetUsedPct = Math.round(
    (savings.totalCampusCraveSpend / Math.max(1, budgetGoal)) * 100,
  );
  const isOverBudget = savings.totalCampusCraveSpend > budgetGoal;

  return (
    <div className="space-y-5 pb-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-[#FF6B35] cursor-pointer min-h-[40px]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to More
      </button>

      <div>
        <h1 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
          Budget & Savings Dashboard
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Track monthly dining burn vs food delivery apps
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1A1C21] border border-stone-200 dark:border-zinc-800">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Saved This Cycle</div>
          <div className="text-xl font-extrabold font-mono tabular-nums text-[#15803D] dark:text-emerald-400 mt-0.5">
            {formatInr(savings.totalSaved)}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {savings.savingsPercent}% cheaper than apps
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1A1C21] border border-stone-200 dark:border-zinc-800">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Meals Redeemed</div>
          <div className="text-xl font-extrabold font-mono tabular-nums text-[#FF6B35] mt-0.5">
            {savings.mealsRedeemed}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Spent {formatInr(savings.totalCampusCraveSpend)}
          </div>
        </div>
      </div>

      {/* Monthly Budget Goal Slider */}
      <section className="p-4 rounded-2xl bg-white dark:bg-[#1A1C21] border border-stone-200 dark:border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <label
            htmlFor="budget-goal-slider"
            className="text-sm font-bold text-zinc-900 dark:text-zinc-50"
          >
            Monthly Food Budget Goal
          </label>
          <span className="text-sm font-extrabold font-mono tabular-nums text-[#FF6B35]">
            {formatInr(budgetGoal)}
          </span>
        </div>

        <input
          id="budget-goal-slider"
          type="range"
          min={1000}
          max={4000}
          step={100}
          value={budgetGoal}
          onChange={(e) =>
            updateStudentProfile({ monthlyBudgetGoal: Number(e.target.value) })
          }
          className="w-full accent-[#FF6B35] cursor-pointer"
        />

        <div className="w-full h-2.5 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isOverBudget ? 'bg-rose-500' : 'bg-[#15803D] dark:bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, budgetUsedPct)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-mono">
          <span>Used: {formatInr(savings.totalCampusCraveSpend)} ({budgetUsedPct}%)</span>
          <span>Goal: {formatInr(budgetGoal)}</span>
        </div>

        {isOverBudget ? (
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>You crossed your ₹{budgetGoal} monthly goal — stick to 1 credit/day!</span>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>On track! {formatInr(budgetGoal - savings.totalCampusCraveSpend)} buffer left.</span>
          </div>
        )}
      </section>

      {/* Weekly Spending vs Delivery Apps Chart */}
      <section className="p-4 rounded-2xl bg-white dark:bg-[#1A1C21] border border-stone-200 dark:border-zinc-800 space-y-3">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
          Weekly Spend: CampusCrave vs Delivery Apps
        </h2>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.4} />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="campusCrave" name="CampusCrave (₹)" fill="#FF6B35" radius={[4, 4, 0, 0]} />
              <Bar dataKey="deliveryApp" name="Zomato/Swiggy (₹)" fill="#71717A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Favourite Eateries Chart */}
      <section className="p-4 rounded-2xl bg-white dark:bg-[#1A1C21] border border-stone-200 dark:border-zinc-800 space-y-3">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
          Your Favourite Selakui Eateries
        </h2>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={eateryData} layout="vertical" margin={{ top: 4, right: 12, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.35} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={92} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="meals" name="Meals" fill="#15803D" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
