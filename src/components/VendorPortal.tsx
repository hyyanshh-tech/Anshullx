import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  IndianRupee,
  LogIn,
  Plus,
  QrCode,
  Sparkles,
  Store,
  Wallet,
  XCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
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
import { useCampusCrave } from '../context/CampusCraveContext';
import { VENDOR_HOURLY_FOOTFALL } from '../data/mockData';
import {
  formatInr,
  generateDynamicQrToken,
  validateQrRedemption,
} from '../utils/campusCraveLogic';

export function VendorPortal() {
  const {
    state,
    setSelectedVendorId,
    redeemMealAtEatery,
    toggleMenuItemStock,
    addVendorMenuItem,
    toggleVendorOffPeakPromo,
    settleVendorPayout,
    pushToast,
  } = useCampusCrave();

  const [vendorSignedIn, setVendorSignedIn] = useState(true);
  const [tokenInput, setTokenInput] = useState('');
  const [scanResult, setScanResult] = useState<{
    status: 'valid' | 'expired' | 'already_used' | 'no_credits';
    reason: string;
    studentName?: string;
    dish?: string;
  } | null>(null);

  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState(52);
  const [newDishVeg, setNewDishVeg] = useState(true);

  const vendor =
    state.eateries.find((e) => e.id === state.selectedVendorId) || state.eateries[0];

  const vendorRedemptions = state.redemptions.filter((r) => r.eateryId === vendor.id);
  const todayStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const todaysVendorRedemptions = vendorRedemptions.filter((r) => r.dateStr === todayStr);

  const grossPerMeal = vendor.avgPartnerPrice;
  const platformTechFee = 3;
  const netPayoutPerMeal = grossPerMeal - platformTechFee;
  const todayEarnings = Math.max(todaysVendorRedemptions.length, 4) * netPayoutPerMeal;
  const rawPending = vendorRedemptions.slice(0, 12).length * netPayoutPerMeal;
  const settledAmount = state.settledVendors[vendor.id] || 0;
  const pendingSettlement = Math.max(0, rawPending - settledAmount);

  const footfallData = useMemo(
    () =>
      VENDOR_HOURLY_FOOTFALL.map((row) => {
        if (!state.vendorOffPeakPromo) return row;
        if (row.hour === '2 PM') {
          return { ...row, campusCrave: row.campusCrave + 14 };
        }
        if (row.hour === '4 PM') {
          return { ...row, campusCrave: row.campusCrave + 11 };
        }
        return row;
      }),
    [state.vendorOffPeakPromo],
  );

  const runQrScanSimulation = (mode: 'valid' | 'expired' | 'already_used') => {
    const now = Date.now();
    if (mode === 'expired') {
      const res = validateQrRedemption({
        tokenWindow: 100,
        currentWindow: 105,
        creditsRemaining: state.subscription.creditsRemaining,
        recentRedemptions: [],
        nowMs: now,
      });
      setScanResult({ status: 'expired', reason: res.reason });
      pushToast('QR Rejected: 30s token expired', 'error');
      return;
    }

    if (mode === 'already_used') {
      const res = validateQrRedemption({
        tokenWindow: 105,
        currentWindow: 105,
        creditsRemaining: state.subscription.creditsRemaining,
        recentRedemptions: [
          {
            ...state.redemptions[0],
            timestamp: now - 18 * 60000,
          },
        ],
        nowMs: now,
      });
      setScanResult({ status: 'already_used', reason: res.reason });
      pushToast('QR Warning: Already redeemed 18 min ago', 'warning');
      return;
    }

    const dish = vendor.menu[0]?.name || vendor.todaySpecial;
    const outcome = redeemMealAtEatery(vendor.id, dish, true);
    if (outcome.ok) {
      setScanResult({
        status: 'valid',
        reason: `Verified! 1 credit settled (${formatInr(netPayoutPerMeal)} net payout queued).`,
        studentName: state.student.name,
        dish,
      });
    } else {
      setScanResult({ status: 'no_credits', reason: outcome.message });
    }
  };

  const handleAutoFillToken = () => {
    const token = generateDynamicQrToken(
      state.student.id,
      state.subscription.planId,
      Date.now(),
    );
    setTokenInput(token.code);
  };

  const handleVerifyCustomToken = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = tokenInput.trim().toUpperCase();
    if (!cleaned) return;
    const now = Date.now();
    const current = generateDynamicQrToken(
      state.student.id,
      state.subscription.planId,
      now,
    ).code;
    const prev = generateDynamicQrToken(
      state.student.id,
      state.subscription.planId,
      now - 30000,
    ).code;

    if (cleaned !== current && cleaned !== prev) {
      setScanResult({
        status: 'expired',
        reason: `Token "${cleaned}" does not match the active 30-second DBS student pass window.`,
      });
      pushToast('Invalid or expired student QR token.', 'error');
      return;
    }

    const dish = vendor.menu[0]?.name || vendor.todaySpecial;
    const outcome = redeemMealAtEatery(vendor.id, dish, true);
    if (outcome.ok) {
      setScanResult({
        status: 'valid',
        reason: `Live token ${cleaned} verified! ${formatInr(netPayoutPerMeal)} queued for ${vendor.name}.`,
        studentName: state.student.name,
        dish,
      });
      setTokenInput('');
    } else {
      setScanResult({ status: 'no_credits', reason: outcome.message });
    }
  };

  const handleAddDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishName.trim()) return;
    addVendorMenuItem(vendor.id, newDishName.trim(), Number(newDishPrice) || 52, newDishVeg);
    setNewDishName('');
  };

  if (!vendorSignedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-lg space-y-4"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
            Partner Kitchen Sign-In
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Select your Selakui eatery counter to scan student QR passes and track daily payouts.
          </p>
          <div>
            <label
              htmlFor="vendor-login-select"
              className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1"
            >
              Registered Partner Kitchen
            </label>
            <select
              id="vendor-login-select"
              value={vendor.id}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100"
            >
              {state.eateries.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => setVendorSignedIn(true)}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#ff7d4d] text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
          >
            <LogIn className="w-4 h-4" />
            Enter Vendor Counter
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Vendor Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-xs">
        <div>
          <p className="text-xs font-semibold text-[#15803D] dark:text-emerald-400">
            Vendor Partner Portal · Selakui Cluster
          </p>
          <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
            {vendor.name}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Hygiene {vendor.hygieneRating.toFixed(1)}★ Verified · {vendor.openHours}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <label htmlFor="active-vendor-switcher" className="sr-only">
            Switch partner kitchen
          </label>
          <select
            id="active-vendor-switcher"
            value={vendor.id}
            onChange={(e) => setSelectedVendorId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-200/80 dark:border-white/10 bg-stone-50 dark:bg-zinc-900 text-xs font-semibold text-zinc-900 dark:text-zinc-100 min-h-[40px]"
          >
            {state.eateries.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setVendorSignedIn(false)}
            className="px-3.5 py-2 rounded-xl border border-stone-200/80 dark:border-white/10 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-white/[0.05] cursor-pointer min-h-[40px]"
          >
            Switch Counter Login
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          className="p-4 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08]"
        >
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Today&apos;s Scans</div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-zinc-900 dark:text-zinc-50 mt-1">
            {Math.max(todaysVendorRedemptions.length, 4)}
          </div>
          <div className="text-[11px] text-[#15803D] dark:text-emerald-400">
            {todaysVendorRedemptions.length} live session scan(s)
          </div>
        </motion.div>
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          className="p-4 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08]"
        >
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Today&apos;s Net Earnings</div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-[#FF6B35] mt-1">
            {formatInr(todayEarnings)}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            ₹{netPayoutPerMeal}/meal after ₹{platformTechFee} fee
          </div>
        </motion.div>
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          className="p-4 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] flex flex-col justify-between gap-2"
        >
          <div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Pending Settlement</div>
            <div className="text-2xl font-extrabold font-mono tabular-nums text-zinc-900 dark:text-zinc-50 mt-1">
              {formatInr(pendingSettlement)}
            </div>
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            disabled={pendingSettlement <= 0}
            onClick={() => settleVendorPayout(vendor.id, pendingSettlement)}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#15803D] text-white text-[11px] font-bold hover:bg-[#166534] disabled:opacity-40 cursor-pointer whitespace-nowrap"
          >
            <Wallet className="w-3.5 h-3.5" />
            {pendingSettlement > 0 ? 'Settle Pending via UPI' : 'All Payouts Settled'}
          </motion.button>
        </motion.div>
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
          className="p-4 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08]"
        >
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Commission Rate</div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-[#15803D] dark:text-emerald-400 mt-1">
            5.7%
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            vs 25–30% on delivery apps
          </div>
        </motion.div>
      </div>

      {/* Main 2-Column Workspace */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left: QR Scanner Simulation & Today's Redemptions */}
        <div className="lg:col-span-6 space-y-6 min-w-0">
          <section className="p-5 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#FF6B35]" />
                Counter QR Scanner Simulation
              </h2>
              <span className="text-xs font-mono text-zinc-500">30s Anti-Fraud</span>
            </div>

            <div className="relative overflow-hidden p-4 rounded-xl bg-stone-50/90 dark:bg-zinc-900/90 border border-dashed border-stone-300 dark:border-zinc-700 text-center space-y-3">
              {/* Optical Scanner Sweep Bar */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-4 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#15803D] dark:via-emerald-400 to-transparent opacity-60 animate-cc-scanline"
              />
              <p className="relative z-10 text-xs text-zinc-600 dark:text-zinc-300">
                Simulate scanning a DBS Global University student&apos;s phone at your billing counter:
              </p>
              <div className="relative z-10 flex flex-wrap items-center justify-center gap-2">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => runQrScanSimulation('valid')}
                  className="px-4 py-2.5 rounded-xl bg-[#15803D] text-white text-xs font-bold hover:bg-[#166534] cursor-pointer min-h-[44px]"
                >
                  Scan Student QR (Valid)
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => runQrScanSimulation('expired')}
                  className="px-3.5 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer min-h-[44px]"
                >
                  Test Expired QR
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => runQrScanSimulation('already_used')}
                  className="px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer min-h-[44px]"
                >
                  Test Already Used
                </motion.button>
              </div>
            </div>

            {/* Live Token Input Verification */}
            <form
              onSubmit={handleVerifyCustomToken}
              className="p-3.5 rounded-xl bg-stone-50/90 dark:bg-zinc-900/90 border border-stone-200/80 dark:border-white/[0.06] space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="vendor-token-input"
                  className="text-xs font-bold text-zinc-800 dark:text-zinc-200"
                >
                  Or Verify Live 30s Student Token
                </label>
                <button
                  type="button"
                  onClick={handleAutoFillToken}
                  className="text-[11px] font-bold text-[#FF6B35] hover:underline cursor-pointer"
                >
                  Auto-Fill Live Student QR
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="vendor-token-input"
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="e.g. CC-DBS-123-ABCDEF"
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-[#151820] text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
                <button
                  type="submit"
                  disabled={!tokenInput.trim()}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold disabled:opacity-50 cursor-pointer min-h-[40px] whitespace-nowrap shrink-0"
                >
                  Verify Token
                </button>
              </div>
            </form>

            {scanResult && (
              <motion.div
                role="status"
                key={scanResult.status + scanResult.reason}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  scanResult.status === 'valid'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                    : scanResult.status === 'already_used'
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
                    : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100'
                }`}
              >
                {scanResult.status === 'valid' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                ) : scanResult.status === 'already_used' ? (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                )}
                <div className="space-y-0.5">
                  <div className="font-bold">
                    {scanResult.status === 'valid'
                      ? `✅ Valid Pass · ${scanResult.studentName}`
                      : scanResult.status === 'already_used'
                      ? '⚠️ Already Used Within Cooldown'
                      : '❌ Expired / Invalid QR'}
                  </div>
                  <p>{scanResult.reason}</p>
                  {scanResult.dish && (
                    <p className="font-mono text-[11px]">Served: {scanResult.dish}</p>
                  )}
                </div>
              </motion.div>
            )}
          </section>

          {/* Today's Redemptions & Commission Breakdown */}
          <section className="p-5 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Recent Counter Redemptions
              </h2>
              <span className="text-xs font-mono text-zinc-500">
                {vendorRedemptions.length} total
              </span>
            </div>

            <div className="divide-y divide-stone-100 dark:divide-white/[0.06] max-h-64 overflow-y-auto">
              {vendorRedemptions.slice(0, 8).map((r) => (
                <div key={r.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {r.studentName} · {r.dishName}
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono">
                      {r.dateStr} · {r.timeStr} · #{r.invoiceId}
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold text-[#15803D] dark:text-emerald-400 shrink-0">
                    +{formatInr(netPayoutPerMeal)}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50/90 dark:bg-zinc-900/90 border border-stone-200/60 dark:border-white/[0.05] text-xs space-y-1">
              <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-[#FF6B35]" />
                Per-Meal Settlement Breakdown
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400 font-mono">
                <span>Partner Meal Rate</span>
                <span>{formatInr(grossPerMeal)}</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400 font-mono">
                <span>CampusCrave Tech & Audit Fee</span>
                <span>-{formatInr(platformTechFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-zinc-900 dark:text-zinc-100 font-mono pt-1 border-t border-stone-200 dark:border-zinc-800">
                <span>Vendor Net Payout</span>
                <span className="text-[#15803D] dark:text-emerald-400">
                  {formatInr(netPayoutPerMeal)}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Right: Off-Peak Footfall Chart & Menu/Stock Editor */}
        <div className="lg:col-span-6 space-y-6 min-w-0">
          <section className="p-5 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FF6B35]" />
                  Footfall by Hour (Off-Peak Boost)
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  CampusCrave fills 2–4 PM & 9 PM quiet kitchen hours
                </p>
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={toggleVendorOffPeakPromo}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer min-h-[36px] whitespace-nowrap shrink-0 transition-colors ${
                  state.vendorOffPeakPromo
                    ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-sm shadow-[#FF6B35]/20'
                    : 'bg-stone-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-stone-200 dark:border-zinc-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                2–4 PM Chai Perk: {state.vendorOffPeakPromo ? 'ON (+25 scans)' : 'OFF'}
              </motion.button>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={footfallData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.35} />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar
                    dataKey="campusCrave"
                    name="CampusCrave Scans"
                    fill="#FF6B35"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="walkIn"
                    name="Regular Walk-Ins"
                    fill="#94A3B8"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="p-5 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] space-y-4">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Live Menu & Stock Editor
            </h2>

            <div className="divide-y divide-stone-100 dark:divide-white/[0.06]">
              {vendor.menu.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.name}
                    </div>
                    <div className="text-xs text-zinc-500 font-mono">
                      ₹{item.partnerValueInr} · {item.isVeg ? 'Veg' : 'Non-Veg'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleMenuItemStock(vendor.id, item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer min-h-[36px] ${
                      item.inStock
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-[#15803D] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {item.inStock ? 'In Stock' : 'Sold Out'}
                  </button>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleAddDish}
              className="pt-3 border-t border-stone-100 dark:border-white/[0.06] space-y-2.5"
            >
              <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                Add Today&apos;s Special Dish
              </div>
              <div className="grid sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  aria-label="New dish name"
                  value={newDishName}
                  onChange={(e) => setNewDishName(e.target.value)}
                  placeholder="e.g. Kadhai Paneer Box"
                  className="sm:col-span-2 px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100"
                />
                <input
                  type="number"
                  aria-label="Partner rate INR"
                  min={40}
                  max={70}
                  value={newDishPrice}
                  onChange={(e) => setNewDishPrice(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-900 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setNewDishVeg(!newDishVeg)}
                  className="px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  Type: {newDishVeg ? 'Pure Veg' : 'Non-Veg'}
                </button>
                <button
                  type="submit"
                  disabled={!newDishName.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF6B35] text-white text-xs font-bold disabled:opacity-50 cursor-pointer min-h-[40px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Publish to Student App
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}


