import React, { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  RotateCw,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCampusCrave } from '../../context/CampusCraveContext';
import {
  DUPLICATE_REDEMPTION_COOLDOWN_MINUTES,
  generateDynamicQrToken,
} from '../../utils/campusCraveLogic';

function buildDeterministicQrMatrix(seed: string): boolean[][] {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  );

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[r0 + r][c0 + c] = isBorder || isInner;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inFinder =
        (r < 8 && c < 8) ||
        (r < 8 && c >= size - 8) ||
        (r >= size - 8 && c < 8);
      if (inFinder) continue;
      hash ^= r * 31 + c * 17;
      hash = Math.imul(hash, 16777619);
      grid[r][c] = (Math.abs(hash) % 10) < 5;
    }
  }
  return grid;
}

export function QrPassScreen() {
  const {
    state,
    redeemMealAtEatery,
    getStudentRedemptions,
    setActiveTab,
    setHubSubPage,
    qrPreselect,
    setQrPreselect,
    clearDuplicateCooldownForDemo,
  } = useCampusCrave();

  const [nowMs, setNowMs] = useState(() => Date.now());
  const [selectedEateryId, setSelectedEateryId] = useState(
    qrPreselect?.eateryId || state.eateries[0]?.id || 'pahadi-rasoi',
  );
  const [selectedDish, setSelectedDish] = useState('');
  const [flippedPass, setFlippedPass] = useState(false);
  const [redemptionFeedback, setRedemptionFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (qrPreselect) {
      setSelectedEateryId(qrPreselect.eateryId);
      if (qrPreselect.dishName) {
        setSelectedDish(qrPreselect.dishName);
      }
      setQrPreselect(null);
    }
  }, [qrPreselect]);

  const selectedEatery =
    state.eateries.find((e) => e.id === selectedEateryId) || state.eateries[0];

  useEffect(() => {
    if (selectedEatery && (!selectedDish || !selectedEatery.menu.some((m) => m.name === selectedDish))) {
      setSelectedDish(selectedEatery.menu[0]?.name || selectedEatery.todaySpecial);
    }
  }, [selectedEateryId]);

  const token = generateDynamicQrToken(
    state.student.id,
    state.subscription.planId,
    nowMs,
  );
  const qrMatrix = useMemo(
    () => buildDeterministicQrMatrix(token.code),
    [token.code],
  );

  const studentRedemptions = getStudentRedemptions().filter(
    (r) => r.timestamp > state.cooldownClearedAt,
  );
  const latestRedemption = studentRedemptions[0];
  const minsSinceLast = latestRedemption
    ? Math.max(0, Math.floor((nowMs - latestRedemption.timestamp) / 60000))
    : 999;
  const isDuplicateCooldownActive =
    Boolean(latestRedemption) &&
    minsSinceLast < DUPLICATE_REDEMPTION_COOLDOWN_MINUTES;

  const handleRedeem = () => {
    const res = redeemMealAtEatery(selectedEatery.id, selectedDish);
    setNowMs(Date.now());
    setRedemptionFeedback(res);
    if (res.ok) {
      try {
        confetti({
          particleCount: 65,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore in headless mode if canvas unavailable
      }
    }
  };

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
            Digital Meal QR Pass
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Auto-refreshes every 30s to prevent screenshots
          </p>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => setFlippedPass(!flippedPass)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-stone-200/80 dark:border-white/10 bg-white/85 dark:bg-[#151820]/85 backdrop-blur-md text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:border-[#FF6B35] cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5 text-[#FF6B35]" />
          {flippedPass ? 'Show QR' : 'Flip ID'}
        </motion.button>
      </div>

      {/* Main Interactive Pass Card (Front: QR Code / Back: Student Verification ID) */}
      <div style={{ perspective: 1200 }}>
        <motion.div
          key={flippedPass ? 'back' : 'front'}
          initial={{ opacity: 0.2, rotateY: flippedPass ? -18 : 18, scale: 0.98 }}
          animate={{ opacity: 1, rotateY: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="relative overflow-hidden p-5 rounded-3xl bg-white/90 dark:bg-[#151820]/90 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.1] shadow-[0_16px_40px_-16px_rgba(0,0,0,0.14)] dark:shadow-[0_16px_40px_-14px_rgba(255,107,53,0.18)] space-y-4"
        >
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-white/[0.06] pb-3">
            <div>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                {state.student.name}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {state.subscription.planName} · {state.student.hostelOrPg}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-extrabold font-mono tabular-nums text-[#FF6B35]">
                {state.subscription.creditsRemaining}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                credits left
              </div>
            </div>
          </div>

          {!flippedPass ? (
            <div className="flex flex-col items-center justify-center py-2 space-y-3">
              {/* Optical QR Viewfinder Frame with Laser Scanline */}
              <div className="relative p-4 rounded-2xl bg-white border border-stone-200 shadow-inner overflow-hidden">
                {/* Corner Optical Brackets */}
                <span aria-hidden="true" className="pointer-events-none absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-[#FF6B35] rounded-tl" />
                <span aria-hidden="true" className="pointer-events-none absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-[#FF6B35] rounded-tr" />
                <span aria-hidden="true" className="pointer-events-none absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-[#FF6B35] rounded-bl" />
                <span aria-hidden="true" className="pointer-events-none absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-[#FF6B35] rounded-br" />

                {/* Animated Laser Scanline */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 right-3 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#FF6B35] to-transparent shadow-[0_0_12px_2px_rgba(255,107,53,0.65)] animate-cc-scanline z-10"
                />

                <svg
                  viewBox="0 0 21 21"
                  className="w-44 h-44 relative z-0"
                  role="img"
                  aria-label={`Dynamic QR pass token ${token.code}`}
                >
                  {qrMatrix.map((row, r) =>
                    row.map((filled, c) =>
                      filled ? (
                        <rect
                          key={`${r}-${c}`}
                          x={c}
                          y={r}
                          width="1"
                          height="1"
                          fill="#18181B"
                        />
                      ) : null,
                    ),
                  )}
                </svg>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                  {token.code}
                </span>
                <span aria-hidden="true" className="text-zinc-400">·</span>
                <span className="inline-flex items-center gap-1 font-semibold text-[#FF6B35] tabular-nums">
                  <RefreshCw className={`w-3.5 h-3.5 ${token.secondsLeft >= 29 ? 'animate-spin' : ''}`} />
                  {token.secondsLeft}s
                </span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FF6B35] to-amber-400 transition-all duration-700 rounded-full"
                  style={{ width: `${(token.secondsLeft / 30) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="py-3 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-emerald-900 dark:text-emerald-100">
                <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Verified DBS Global University Hosteller ID</span>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-900/90 border border-stone-200/60 dark:border-white/[0.05]">
                  <div className="text-[10px] text-zinc-500">Student ID</div>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">{state.student.id}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-900/90 border border-stone-200/60 dark:border-white/[0.05]">
                  <div className="text-[10px] text-zinc-500">Phone</div>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">{state.student.phone}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-900/90 border border-stone-200/60 dark:border-white/[0.05]">
                  <div className="text-[10px] text-zinc-500">Daily Allowance</div>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">{state.subscription.dailyLimit} meals/day</div>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-900/90 border border-stone-200/60 dark:border-white/[0.05]">
                  <div className="text-[10px] text-zinc-500">Plan Expires</div>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">{state.subscription.expiresAtLabel}</div>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" />
                Zero delivery, zero packaging, zero surge fee guarantee at 6 Selakui counters.
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Duplicate Prevention Warning with Demo Reset */}
      {isDuplicateCooldownActive && (
        <motion.div
          role="alert"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/60 backdrop-blur-md border border-amber-200 dark:border-amber-800 space-y-2 text-xs text-amber-900 dark:text-amber-100"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-bold">Duplicate Scan Guard Active</p>
              <p className="mt-0.5">
                Redeemed at {latestRedemption.eateryName} {minsSinceLast} min ago. Next counter
                redemption unlocks in {DUPLICATE_REDEMPTION_COOLDOWN_MINUTES - minsSinceLast} min.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearDuplicateCooldownForDemo}
            className="w-full py-2 px-3 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 cursor-pointer"
          >
            Simulate +2 Hours Elapsed (Demo: Unlock Next Scan)
          </button>
        </motion.div>
      )}

      {/* Redeem at Eatery Flow */}
      <section className="p-4 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] space-y-3">
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <Store className="w-4 h-4 text-[#FF6B35]" />
          Redeem at Partner Counter
        </h2>

        <div>
          <label
            htmlFor="qr-eatery-select"
            className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1"
          >
            Select Selakui Partner Eatery
          </label>
          <select
            id="qr-eatery-select"
            value={selectedEateryId}
            onChange={(e) => setSelectedEateryId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
          >
            {state.eateries.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.distanceKm} km · ₹{e.avgPartnerPrice})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="qr-dish-select"
            className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1"
          >
            Select Meal Item (1 Credit)
          </label>
          <select
            id="qr-dish-select"
            value={selectedDish}
            onChange={(e) => setSelectedDish(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
          >
            {selectedEatery.menu.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name} {m.inStock ? '' : '(Sold Out)'}
              </option>
            ))}
          </select>
        </div>

        {state.subscription.creditsRemaining <= 0 ? (
          <button
            type="button"
            onClick={() => {
              setHubSubPage('plans');
              setActiveTab('hub');
            }}
            className="w-full py-3 px-4 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold cursor-pointer min-h-[48px]"
          >
            0 Credits Left — Renew Pass
          </button>
        ) : (
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={handleRedeem}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#ff7d4d] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-[#FF6B35]/20 hover:brightness-105 transition-all cursor-pointer min-h-[48px]"
          >
            <CheckCircle2 className="w-4 h-4" />
            Redeem 1 Credit at Counter
          </motion.button>
        )}

        {redemptionFeedback && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
              redemptionFeedback.ok
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-100 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {redemptionFeedback.ok ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <Clock className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            )}
            <span>{redemptionFeedback.message}</span>
          </motion.div>
        )}
      </section>
    </div>
  );
}

