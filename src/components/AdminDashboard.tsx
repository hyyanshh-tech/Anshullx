import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  FlaskConical,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useCampusCrave } from '../context/CampusCraveContext';
import { GTM_TIMELINE, PILOT_PROGRESS_TARGETS } from '../data/mockData';
import type { AssumptionItem, ScenarioPreset, UnitEconomicsInputs } from '../types';
import {
  calculateUnitEconomics,
  formatInr,
  generateUnitEconomicsCurve,
  getScenarioPreset,
} from '../utils/campusCraveLogic';

interface AdminInsight {
  title: string;
  impact: string;
  action: string;
}

type GtmStatus = 'Completed' | 'In Progress' | 'Upcoming';

export function AdminDashboard() {
  const { state, updateAssumptionStatus, pushToast } = useCampusCrave();
  const [scenario, setScenario] = useState<ScenarioPreset>('base');
  const [inputs, setInputs] = useState<UnitEconomicsInputs>(() =>
    getScenarioPreset('base'),
  );
  const [insights, setInsights] = useState<AdminInsight[] | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const [simTrials, setSimTrials] = useState(0);
  const [simScans, setSimScans] = useState(0);
  const [gtmStatuses, setGtmStatuses] = useState<Record<string, GtmStatus>>(() =>
    Object.fromEntries(
      GTM_TIMELINE.map((step) => [step.week, step.status as GtmStatus]),
    ),
  );

  const econ = calculateUnitEconomics(inputs);
  const breakEvenCurve = useMemo(() => generateUnitEconomicsCurve(inputs), [inputs]);

  const handleScenarioSelect = (preset: ScenarioPreset) => {
    setScenario(preset);
    setInputs(getScenarioPreset(preset));
  };

  const kpis = [
    { label: 'Active Subscribers', value: String(inputs.customers), sub: 'Base pilot cohort' },
    { label: 'Trial -> Monthly', value: '43%', sub: 'Target: 40%+' },
    {
      label: 'Monthly Revenue',
      value: formatInr(econ.monthlyRevenue),
      sub: `${formatInr(inputs.sellingPrice)}/pass`,
    },
    {
      label: 'Contribution / Sale',
      value: formatInr(econ.contributionPerSale),
      sub: `${econ.contributionMarginPct}% margin`,
    },
    { label: 'Monthly Retention', value: '84%', sub: 'Semester renewal pace' },
    {
      label: 'Partner Vendors',
      value: String(state.eateries.length),
      sub: 'Selakui 1 km radius',
    },
    { label: 'Satisfaction', value: '91%', sub: '4.8★ avg meal rating' },
  ];

  const handleGenerateInsights = async () => {
    setLoadingInsights(true);
    try {
      const res = await fetch('/api/ai/admin-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          kpis: {
            activeSubscribers: inputs.customers,
            trialConversion: '43%',
            retention: '84%',
            vendors: state.eateries.length,
            totalRedemptionsLogged: state.redemptions.length + simScans,
          },
          unitEconomics: econ,
          pilotProgress: {
            studentsReached: 412,
            qrScans: 178 + Math.max(0, state.redemptions.length - 32) + simScans,
            trialsSold: 42 + simTrials,
          },
        }),
      });
      const data = await res.json();
      if (Array.isArray(data.insights)) {
        setInsights(data.insights);
        pushToast('Gemini AI Insights refreshed from live unit economics.', 'success');
      }
    } catch {
      pushToast('Could not fetch AI insights right now.', 'error');
    } finally {
      setLoadingInsights(false);
    }
  };

  const cycleStatus = (current: AssumptionItem['status']): AssumptionItem['status'] => {
    if (current === 'Untested') return 'Testing';
    if (current === 'Testing') return 'Validated';
    return 'Untested';
  };

  const cycleGtmStatus = (week: string) => {
    setGtmStatuses((prev) => {
      const current = prev[week] || 'Upcoming';
      const next: GtmStatus =
        current === 'Upcoming'
          ? 'In Progress'
          : current === 'In Progress'
          ? 'Completed'
          : 'Upcoming';
      return { ...prev, [week]: next };
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-xs">
        <div>
          <p className="text-xs font-semibold text-[#FF6B35]">
            Admin & Founder Console · DBS Global University Pilot
          </p>
          <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
            CampusCrave Unit Economics & GTM Control
          </h1>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={handleGenerateInsights}
          disabled={loadingInsights}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#ff7d4d] text-white text-xs font-bold shadow-md shadow-[#FF6B35]/20 hover:brightness-105 disabled:opacity-60 cursor-pointer min-h-[44px] whitespace-nowrap"
        >
          <Sparkles className="w-4 h-4" />
          {loadingInsights ? 'Analyzing Pilot Data...' : 'Generate AI Insights'}
        </motion.button>
      </div>

      {/* AI Insights Panel */}
      {insights && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-zinc-900 via-[#151822] to-zinc-950 text-white border border-white/10 shadow-xl space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold flex items-center gap-2 text-amber-300">
              <Sparkles className="w-4 h-4" />
              Gemini Strategic Growth Actions
            </h2>
            <button
              type="button"
              onClick={() => setInsights(null)}
              className="text-xs text-zinc-400 hover:text-white cursor-pointer"
            >
              Dismiss
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {insights.map((ins, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="p-4 rounded-xl bg-white/[0.05] border border-white/10 space-y-1.5"
              >
                <div className="text-[11px] font-semibold text-[#FF6B35]">{ins.impact}</div>
                <h3 className="text-sm font-bold text-white">{ins.title}</h3>
                <p className="text-xs text-zinc-300 leading-relaxed">{ins.action}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Executive KPIs */}
      <section
        aria-label="Executive KPIs"
        className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3"
      >
        {kpis.map((kpi) => (
          <motion.div
            key={kpi.label}
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="p-3.5 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08]"
          >
            <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
              {kpi.label}
            </div>
            <div className="text-lg sm:text-xl font-extrabold font-mono tabular-nums text-zinc-900 dark:text-zinc-50 mt-1">
              {kpi.value}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">{kpi.sub}</div>
          </motion.div>
        ))}
      </section>

      {/* Unit Economics Calculator + Pilot Progress Tracker */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Unit Economics Calculator */}
        <section className="lg:col-span-7 min-w-0 p-5 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#FF6B35]" />
                Interactive Unit Economics Calculator
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Adjust pricing, vendor meal payouts, subscriber volume & fixed overhead
              </p>
            </div>

            <div className="flex items-center p-1 rounded-xl bg-stone-100/90 dark:bg-zinc-900/90 border border-stone-200/70 dark:border-white/[0.06]">
              {(
                [
                  { id: 'conservative', label: 'Conservative' },
                  { id: 'base', label: 'Base' },
                  { id: 'ambitious', label: 'Ambitious' },
                ] as const
              ).map((s) => {
                const isSelected = scenario === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleScenarioSelect(s.id)}
                    className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                      isSelected
                        ? 'text-[#FF6B35]'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    {isSelected && (
                      <motion.span
                        layoutId="admin-scenario-pill"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        className="absolute inset-0 rounded-lg bg-white dark:bg-[#1C2029] shadow-sm border border-stone-200/70 dark:border-white/[0.08]"
                        aria-hidden="true"
                      />
                    )}
                    <span className="relative z-10">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sliders */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label htmlFor="ue-price" className="font-medium text-zinc-700 dark:text-zinc-300">
                  Selling Price / Pass
                </label>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {formatInr(inputs.sellingPrice)}
                </span>
              </div>
              <input
                id="ue-price"
                type="range"
                min={1499}
                max={2999}
                step={50}
                value={inputs.sellingPrice}
                onChange={(e) =>
                  setInputs((prev) => ({ ...prev, sellingPrice: Number(e.target.value) }))
                }
                className="w-full accent-[#FF6B35] cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label htmlFor="ue-var" className="font-medium text-zinc-700 dark:text-zinc-300">
                  Variable Cost (Vendor Meals)
                </label>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {formatInr(inputs.variableCost)}
                </span>
              </div>
              <input
                id="ue-var"
                type="range"
                min={1100}
                max={2100}
                step={50}
                value={inputs.variableCost}
                onChange={(e) =>
                  setInputs((prev) => ({ ...prev, variableCost: Number(e.target.value) }))
                }
                className="w-full accent-[#FF6B35] cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label htmlFor="ue-cust" className="font-medium text-zinc-700 dark:text-zinc-300">
                  Active Monthly Customers
                </label>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {inputs.customers}
                </span>
              </div>
              <input
                id="ue-cust"
                type="range"
                min={30}
                max={500}
                step={5}
                value={inputs.customers}
                onChange={(e) =>
                  setInputs((prev) => ({ ...prev, customers: Number(e.target.value) }))
                }
                className="w-full accent-[#FF6B35] cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label htmlFor="ue-fixed" className="font-medium text-zinc-700 dark:text-zinc-300">
                  Monthly Fixed Cost
                </label>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  {formatInr(inputs.fixedCost)}
                </span>
              </div>
              <input
                id="ue-fixed"
                type="range"
                min={5000}
                max={50000}
                step={1000}
                value={inputs.fixedCost}
                onChange={(e) =>
                  setInputs((prev) => ({ ...prev, fixedCost: Number(e.target.value) }))
                }
                className="w-full accent-[#FF6B35] cursor-pointer"
              />
            </div>
          </div>

          {/* Live Financial Outputs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-stone-100 dark:border-white/[0.06]">
            <div className="p-3 rounded-xl bg-stone-50/90 dark:bg-zinc-900/90 border border-stone-200/60 dark:border-white/[0.05]">
              <div className="text-[11px] text-zinc-500">Contribution / Sale</div>
              <div className="text-lg font-extrabold font-mono tabular-nums text-[#FF6B35]">
                {formatInr(econ.contributionPerSale)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-stone-50/90 dark:bg-zinc-900/90 border border-stone-200/60 dark:border-white/[0.05]">
              <div className="text-[11px] text-zinc-500">Monthly Revenue</div>
              <div className="text-lg font-extrabold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                {formatInr(econ.monthlyRevenue)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-stone-50/90 dark:bg-zinc-900/90 border border-stone-200/60 dark:border-white/[0.05]">
              <div className="text-[11px] text-zinc-500">Operating Surplus</div>
              <div
                className={`text-lg font-extrabold font-mono tabular-nums ${
                  econ.operatingSurplus >= 0
                    ? 'text-[#15803D] dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatInr(econ.operatingSurplus)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-stone-50/90 dark:bg-zinc-900/90 border border-stone-200/60 dark:border-white/[0.05]">
              <div className="text-[11px] text-zinc-500">Break-Even</div>
              <div className="text-lg font-extrabold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                {econ.breakEvenCustomers} users
              </div>
            </div>
          </div>

          {/* Break-Even & Profit Sensitivity Curve */}
          <div className="pt-3 border-t border-stone-100 dark:border-white/[0.06] space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                Break-Even & Profit Sensitivity Curve (0–400 Subscribers)
              </span>
              <span className="font-mono text-[11px] text-[#15803D] dark:text-emerald-400">
                Break-even: {econ.breakEvenCustomers} users · Current: {inputs.customers} users
              </span>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={breakEvenCurve}
                  margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.35} />
                  <XAxis dataKey="customers" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `₹${Math.round(Number(v) / 1000)}k`}
                  />
                  <Tooltip formatter={(val) => formatInr(Number(val ?? 0))} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Monthly Revenue"
                    stroke="#15803D"
                    fill="#15803D"
                    fillOpacity={0.18}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalCost"
                    name="Total Cost (Fixed + Var)"
                    stroke="#FF6B35"
                    fill="#FF6B35"
                    fillOpacity={0.14}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Pilot Progress Tracker */}
        <section className="lg:col-span-5 min-w-0 p-5 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Target className="w-4 h-4 text-[#15803D] dark:text-emerald-400" />
              Pilot Progress vs Targets
            </h2>
            {(simTrials > 0 || simScans > 0) && (
              <button
                type="button"
                onClick={() => {
                  setSimTrials(0);
                  setSimScans(0);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Sim
              </button>
            )}
          </div>

          <div className="space-y-3">
            {PILOT_PROGRESS_TARGETS.map((item) => {
              const dynamicCurrent = item.label.includes('QR Meal Scans')
                ? item.current + Math.max(0, state.redemptions.length - 32) + simScans
                : item.label.includes('Trial Passes')
                ? item.current + simTrials
                : item.label.includes('MOU')
                ? state.eateries.length
                : item.current;
              const pct = Math.min(100, Math.round((dynamicCurrent / item.target) * 100));
              const met = dynamicCurrent >= item.target;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {item.label}
                    </span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {dynamicCurrent} / {item.target} {item.unit === '%' ? '%' : ''}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        met
                          ? 'bg-gradient-to-r from-[#15803D] to-emerald-400'
                          : 'bg-gradient-to-r from-[#FF6B35] to-amber-400'
                      }`}
                      initial={false}
                      animate={{ width: `${pct}%` }}
                      transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pilot Activity Simulator */}
          <div className="pt-3 border-t border-stone-100 dark:border-white/[0.06] space-y-2">
            <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
              Simulate Hostel Outreach Sprint
            </div>
            <div className="flex flex-wrap gap-2">
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setSimTrials((n) => n + 10);
                  pushToast('+10 Trial Passes simulated for DBS Hostel Block B!', 'success');
                }}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#FF6B35]/10 text-[#FF6B35] text-xs font-bold hover:bg-[#FF6B35]/20 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                +10 Trial Passes
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setSimScans((n) => n + 15);
                  pushToast('+15 QR Meal Scans simulated across Selakui partners!', 'success');
                }}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#15803D]/10 text-[#15803D] dark:text-emerald-400 text-xs font-bold hover:bg-[#15803D]/20 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                +15 QR Scans
              </motion.button>
            </div>
          </div>
        </section>
      </div>

      {/* Market Size Cards (TAM / SAM / SOM) */}
      <section className="grid sm:grid-cols-3 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          className="p-5 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] space-y-1"
        >
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            TAM · India College Hostelers
          </p>
          <div className="text-2xl font-extrabold font-mono text-zinc-900 dark:text-zinc-50">
            1.8M+ Students
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            ~₹4,200 Cr annual off-mess student dining spend across Indian university towns.
          </p>
        </motion.div>
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          className="p-5 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] space-y-1"
        >
          <p className="text-xs font-semibold text-[#FF6B35]">
            SAM · Dehradun University Belt
          </p>
          <div className="text-2xl font-extrabold font-mono text-zinc-900 dark:text-zinc-50">
            8,000 Students
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Selakui & Premnagar hostel/PG clusters around DBS Global University & nearby campuses.
          </p>
        </motion.div>
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          className="p-5 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] space-y-1"
        >
          <p className="text-xs font-semibold text-[#15803D] dark:text-emerald-400">
            SOM · Year-1 Ambitious Target
          </p>
          <div className="text-2xl font-extrabold font-mono text-zinc-900 dark:text-zinc-50">
            300 Customers
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            3.75% SAM capture generating ~₹5.99L monthly revenue & ₹1.30L operating surplus.
          </p>
        </motion.div>
      </section>

      {/* 30-Day GTM Experiment Timeline + Top 3 Assumptions */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-7 min-w-0 p-5 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              30-Day Go-To-Market Experiment Timeline
            </h2>
            <span className="text-[11px] text-zinc-500">Click status to cycle</span>
          </div>
          <div className="divide-y divide-stone-100 dark:divide-white/[0.06]">
            {GTM_TIMELINE.map((step) => {
              const currentStatus = gtmStatuses[step.week] || step.status;
              return (
                <div key={step.week} className="py-3 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                      {step.week}: {step.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => cycleGtmStatus(step.week)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                        currentStatus === 'Completed'
                          ? 'bg-emerald-500/15 text-[#15803D] dark:text-emerald-400'
                          : currentStatus === 'In Progress'
                          ? 'bg-[#FF6B35]/15 text-[#FF6B35]'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      {currentStatus}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">{step.actions}</p>
                  <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                    Metric: {step.metric} · Target: {step.target}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-5 min-w-0 p-5 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-[#FF6B35]" />
              Top 3 Assumptions Tracker
            </h2>
            <span className="text-[11px] text-zinc-500">Click status to update</span>
          </div>
          <div className="space-y-3">
            {state.assumptions.map((a) => (
              <div
                key={a.id}
                className="p-3.5 rounded-xl bg-stone-50/90 dark:bg-zinc-900/90 border border-stone-200/70 dark:border-white/[0.06] space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {a.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => updateAssumptionStatus(a.id, cycleStatus(a.status))}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 cursor-pointer ${
                      a.status === 'Validated'
                        ? 'bg-emerald-500/15 text-[#15803D] dark:text-emerald-400'
                        : a.status === 'Testing'
                        ? 'bg-[#FF6B35]/15 text-[#FF6B35]'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {a.status === 'Validated' && (
                      <CheckCircle2 className="w-3 h-3 inline mr-1 -mt-0.5" />
                    )}
                    {a.status}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400">{a.hypothesis}</p>
                <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                  Evidence: {a.evidence}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}


