import React, { useState } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  ShieldAlert,
  Star,
} from 'lucide-react';
import { useCampusCrave } from '../../context/CampusCraveContext';
import { formatInr } from '../../utils/campusCraveLogic';

export function HistoryAndProfile({ onBack }: { onBack: () => void }) {
  const {
    state,
    getStudentRedemptions,
    rateRedemption,
    submitHygieneReport,
    updateStudentProfile,
    toggleDarkMode,
    resetDemoData,
  } = useCampusCrave();

  const [section, setSection] = useState<'history' | 'invoices' | 'hygiene' | 'settings'>('history');
  const [reportEateryId, setReportEateryId] = useState(state.eateries[0]?.id || '');
  const [reportCategory, setReportCategory] = useState('Oil / Food Freshness');
  const [reportDetails, setReportDetails] = useState('');

  const studentRedemptions = getStudentRedemptions();

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDetails.trim()) return;
    submitHygieneReport(reportEateryId, reportCategory, reportDetails.trim());
    setReportDetails('');
  };

  return (
    <div className="space-y-4 pb-6">
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
          History, Hygiene & Profile
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {state.student.name} · {state.student.college}
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-stone-100 dark:bg-zinc-800">
        {(
          [
            { id: 'history', label: 'Meals' },
            { id: 'invoices', label: 'Invoices' },
            { id: 'hygiene', label: 'Hygiene' },
            { id: 'settings', label: 'Profile' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSection(t.id)}
            className={`py-2 px-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors min-h-[36px] ${
              section === t.id
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {section === 'history' && (
        <div className="space-y-2.5">
          {studentRedemptions.map((r) => (
            <div
              key={r.id}
              className="p-3.5 rounded-2xl bg-white dark:bg-[#1A1C21] border border-stone-200 dark:border-zinc-800 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    {r.dishName}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {r.eateryName} · {r.dateStr} at {r.timeStr}
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-[#15803D] dark:text-emerald-400 shrink-0">
                  Saved {formatInr(r.deliveryEquivalentCost - r.campusCraveCost)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-zinc-800">
                <span className="text-[11px] font-mono text-zinc-400">#{r.invoiceId}</span>
                <div className="flex items-center gap-1" aria-label="Rate this meal">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => rateRedemption(r.id, star)}
                      aria-label={`Rate ${star} stars`}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          (r.rating || 0) >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-zinc-300 dark:text-zinc-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {section === 'invoices' && (
        <div className="space-y-2.5">
          {state.invoices.map((inv) => (
            <div
              key={inv.id}
              className="p-3.5 rounded-2xl bg-white dark:bg-[#1A1C21] border border-stone-200 dark:border-zinc-800 flex items-center justify-between gap-3"
            >
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {inv.planName}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                  {inv.id} · {inv.upiApp} · {inv.dateStr}
                </div>
                <div className="text-[11px] text-zinc-400 font-mono">UTR: {inv.utrNumber}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-extrabold font-mono text-zinc-900 dark:text-zinc-50">
                  {formatInr(inv.amount)}
                </div>
                <div className="text-[11px] font-semibold text-[#15803D] dark:text-emerald-400">
                  {inv.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {section === 'hygiene' && (
        <div className="space-y-4">
          <form
            onSubmit={handleReportSubmit}
            className="p-4 rounded-2xl bg-white dark:bg-[#1A1C21] border border-stone-200 dark:border-zinc-800 space-y-3"
          >
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#FF6B35]" />
              Report a Vendor Hygiene Issue
            </h2>
            <div>
              <label htmlFor="hr-eatery" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Partner Eatery
              </label>
              <select
                id="hr-eatery"
                value={reportEateryId}
                onChange={(e) => setReportEateryId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100"
              >
                {state.eateries.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="hr-cat" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Issue Category
              </label>
              <select
                id="hr-cat"
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100"
              >
                <option>Oil / Food Freshness</option>
                <option>Drinking Water / RO</option>
                <option>Packaging / Serving Cleanliness</option>
                <option>Staff Gloves / Hairnet</option>
              </select>
            </div>
            <div>
              <label htmlFor="hr-details" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Details
              </label>
              <textarea
                id="hr-details"
                rows={3}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Describe what you observed so our Selakui audit team can inspect within 24h..."
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <button
              type="submit"
              disabled={!reportDetails.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-[#FF6B35] text-white text-xs font-bold disabled:opacity-50 cursor-pointer min-h-[44px]"
            >
              Submit Hygiene Feedback
            </button>
          </form>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
              Recent Hygiene Audit Tickets
            </h3>
            {state.hygieneReports.map((hr) => (
              <div
                key={hr.id}
                className="p-3 rounded-xl bg-white dark:bg-[#1A1C21] border border-stone-200 dark:border-zinc-800 text-xs space-y-1"
              >
                <div className="flex items-center justify-between font-bold text-zinc-900 dark:text-zinc-100">
                  <span>{hr.eateryName} · {hr.category}</span>
                  <span className="text-[#15803D] dark:text-emerald-400">{hr.status}</span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400">{hr.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === 'settings' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1A1C21] border border-stone-200 dark:border-zinc-800 space-y-3.5">
          <div>
            <label htmlFor="prof-hostel" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Hostel / PG
            </label>
            <input
              id="prof-hostel"
              type="text"
              value={state.student.hostelOrPg}
              onChange={(e) => updateStudentProfile({ hostelOrPg: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-t border-stone-100 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Pure Vegetarian Filter
            </span>
            <button
              type="button"
              onClick={() => updateStudentProfile({ vegOnly: !state.student.vegOnly })}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                state.student.vegOnly
                  ? 'bg-[#15803D] text-white'
                  : 'bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              {state.student.vegOnly ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-stone-100 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Dark Appearance
            </span>
            <button
              type="button"
              onClick={toggleDarkMode}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                state.darkMode
                  ? 'bg-[#FF6B35] text-white'
                  : 'bg-stone-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              {state.darkMode ? 'Dark' : 'Light'}
            </button>
          </div>

          <button
            type="button"
            onClick={resetDemoData}
            className="w-full py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer min-h-[44px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Data to Initial Seed
          </button>
        </div>
      )}
    </div>
  );
}
