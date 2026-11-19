import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Clock,
  List,
  MapPin,
  QrCode,
  Search,
  Send,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCampusCrave } from '../../context/CampusCraveContext';
import { filterEateries } from '../../utils/campusCraveLogic';
import type { PartnerEatery } from '../../types';

export function ExploreEateries() {
  const {
    state,
    selectedEateryId,
    setSelectedEateryId,
    jumpToQrRedeem,
    addEateryReview,
    markMilestone,
  } = useCampusCrave();

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(state.student.vegOnly);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(2);
  const [minHygiene, setMinHygiene] = useState<number>(4.0);
  const [maxBudget, setMaxBudget] = useState<number>(60);
  const [mapActiveId, setMapActiveId] = useState<string>(state.eateries[0]?.id || '');

  const [pickupSlot, setPickupSlot] = useState('Walk-in Now');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    markMilestone('exploredEatery');
  }, []);

  const filtered = filterEateries(state.eateries, {
    vegOnly,
    maxDistanceKm,
    minHygiene,
    maxBudget,
    searchQuery,
  });

  const detailEatery: PartnerEatery | undefined = selectedEateryId
    ? state.eateries.find((e) => e.id === selectedEateryId)
    : undefined;

  if (detailEatery) {
    const handleReviewSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!reviewComment.trim()) return;
      addEateryReview(detailEatery.id, reviewRating, reviewComment.trim());
      setReviewComment('');
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-4 pb-6"
      >
        <button
          type="button"
          onClick={() => setSelectedEateryId(null)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-[#FF6B35] cursor-pointer min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Selakui Eateries
        </button>

        <div className="rounded-3xl overflow-hidden bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm">
          <div className="relative h-44 bg-stone-100 dark:bg-zinc-800 overflow-hidden">
            <img
              src={detailEatery.image}
              alt={detailEatery.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex items-end p-4">
              <div className="text-white">
                <p className="text-xs text-emerald-300 font-medium flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Verified Partner · {detailEatery.hygieneRating.toFixed(1)} Hygiene Score
                </p>
                <h2 className="text-xl font-extrabold">{detailEatery.name}</h2>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
              <span>{detailEatery.distanceKm} km ({detailEatery.walkMinutes} min walk)</span>
              <span aria-hidden="true">·</span>
              <span>{detailEatery.cuisine}</span>
              <span aria-hidden="true">·</span>
              <span>{detailEatery.isPureVeg ? 'Pure Veg' : 'Veg & Non-Veg'}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-[#15803D] dark:text-emerald-400">
                {detailEatery.isOpen ? 'Open Now' : 'Closed'} ({detailEatery.openHours})
              </span>
            </div>

            {/* Interactive Pickup / Off-Peak Slot Selector */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Choose Counter Slot
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  'Walk-in Now',
                  '1:45 PM (+Free Chai)',
                  '8:30 PM Dinner',
                ].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setPickupSlot(slot)}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-semibold cursor-pointer transition-colors ${
                      pickupSlot === slot
                        ? 'border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]'
                        : 'border-stone-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() =>
                jumpToQrRedeem(detailEatery.id, detailEatery.menu[0]?.name)
              }
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#ff7d4d] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-[#FF6B35]/20 hover:brightness-105 transition-all cursor-pointer min-h-[48px]"
            >
              <QrCode className="w-4 h-4" />
              Redeem 1 Credit ({pickupSlot})
            </motion.button>
          </div>
        </div>

        {/* Today's Menu with 1-tap dish redeem */}
        <section className="p-4 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] space-y-3">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            Today&apos;s Counter Menu
          </h3>
          <div className="divide-y divide-stone-100 dark:divide-white/[0.06]">
            {detailEatery.menu.map((item) => (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-sm border ${
                        item.isVeg ? 'border-emerald-600 bg-emerald-500/20' : 'border-rose-600 bg-rose-500/20'
                      }`}
                      title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                    />
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.name}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.description}</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                    {item.calories} · {item.protein} · {item.inStock ? 'Available' : 'Sold Out'}
                  </p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <div className="text-xs font-bold font-mono text-[#FF6B35]">
                    {item.priceCredits} credit
                  </div>
                  <button
                    type="button"
                    disabled={!item.inStock}
                    onClick={() => jumpToQrRedeem(detailEatery.id, item.name)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11px] font-bold disabled:opacity-40 cursor-pointer"
                  >
                    Select
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Rotating Daily Menu */}
        <section className="p-4 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] space-y-2.5">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            Rotating 7-Day Daily Specials
          </h3>
          <div className="grid grid-cols-1 gap-1.5 text-xs">
            {detailEatery.rotatingDailyMenu.map((d) => (
              <div
                key={d.day}
                className="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-white/[0.06] last:border-0"
              >
                <span className="font-mono font-semibold text-zinc-500 dark:text-zinc-400 w-10">
                  {d.day}
                </span>
                <span className="text-zinc-800 dark:text-zinc-200 text-right">{d.special}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Hygiene Report Card */}
        <section className="p-4 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#15803D] dark:text-emerald-400" />
              Hygiene Audit Card
            </h3>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Audited {detailEatery.hygieneCard.lastAudited}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-900/90 border border-stone-200/60 dark:border-white/[0.05]">
              <div className="text-zinc-500 dark:text-zinc-400">Kitchen Surface</div>
              <div className="font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {detailEatery.hygieneCard.kitchenSurface.toFixed(1)} / 5.0
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-900/90 border border-stone-200/60 dark:border-white/[0.05]">
              <div className="text-zinc-500 dark:text-zinc-400">RO Water Purity</div>
              <div className="font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {detailEatery.hygieneCard.waterRoPurity.toFixed(1)} / 5.0
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-900/90 border border-stone-200/60 dark:border-white/[0.05]">
              <div className="text-zinc-500 dark:text-zinc-400">Oil Freshness</div>
              <div className="font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {detailEatery.hygieneCard.oilFreshness.toFixed(1)} / 5.0
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-zinc-900/90 border border-stone-200/60 dark:border-white/[0.05]">
              <div className="text-zinc-500 dark:text-zinc-400">FSSAI & Staff Gear</div>
              <div className="font-bold font-mono text-[#15803D] dark:text-emerald-400">
                {detailEatery.hygieneCard.fssaiVerified ? 'Verified' : 'Pending'} · {detailEatery.hygieneCard.staffGear.toFixed(1)}
              </div>
            </div>
          </div>
        </section>

        {/* Student Reviews + Live Review Form */}
        <section className="p-4 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] space-y-3">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            Student Reviews ({detailEatery.reviews.length})
          </h3>

          <form onSubmit={handleReviewSubmit} className="p-3 rounded-xl bg-stone-50 dark:bg-zinc-900/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Leave your rating
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setReviewRating(s)}
                    aria-label={`Set review rating ${s} stars`}
                    className="p-0.5 cursor-pointer"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        reviewRating >= s
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-zinc-300 dark:text-zinc-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                aria-label="Write a review"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share portion size, taste, or hygiene feedback..."
                className="flex-1 px-3 py-2 rounded-xl border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100"
              />
              <button
                type="submit"
                disabled={!reviewComment.trim()}
                aria-label="Publish review"
                className="p-2 rounded-xl bg-[#FF6B35] text-white disabled:opacity-40 cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {detailEatery.reviews.map((rev) => (
            <div key={rev.id} className="space-y-1 pb-2.5 border-b border-stone-100 dark:border-white/[0.06] last:border-0 last:pb-0">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {rev.studentName} · <span className="font-normal text-zinc-500">{rev.hostel}</span>
                </span>
                <span className="inline-flex items-center gap-0.5 font-mono font-semibold text-amber-500">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {rev.rating.toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">{rev.comment}</p>
            </div>
          ))}
        </section>
      </motion.div>
    );
  }

  const activeMapEatery =
    state.eateries.find((e) => e.id === mapActiveId) || state.eateries[0];

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
            Selakui Partner Eateries
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Within 1 km of DBS Global University
          </p>
        </div>
        <div className="flex items-center p-1 rounded-xl bg-stone-100/90 dark:bg-zinc-900/90 border border-stone-200/70 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`relative inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              viewMode === 'list'
                ? 'text-zinc-900 dark:text-zinc-50'
                : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            {viewMode === 'list' && (
              <motion.span
                layoutId="explore-view-pill"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-lg bg-white dark:bg-[#1C2029] shadow-sm border border-stone-200/70 dark:border-white/[0.08]"
                aria-hidden="true"
              />
            )}
            <List className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">List</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`relative inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              viewMode === 'map'
                ? 'text-zinc-900 dark:text-zinc-50'
                : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            {viewMode === 'map' && (
              <motion.span
                layoutId="explore-view-pill"
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-lg bg-white dark:bg-[#1C2029] shadow-sm border border-stone-200/70 dark:border-white/[0.08]"
                aria-hidden="true"
              />
            )}
            <MapPin className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">Map</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
        <input
          type="search"
          aria-label="Search Selakui eateries or dishes"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search dosa, rajma, paneer, or dhaba..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => setVegOnly(!vegOnly)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 border cursor-pointer transition-colors min-h-[36px] ${
            vegOnly
              ? 'bg-[#15803D] text-white border-[#15803D]'
              : 'bg-white/85 dark:bg-[#151820]/85 text-zinc-700 dark:text-zinc-300 border-stone-200/80 dark:border-white/10'
          }`}
        >
          Pure Veg
        </button>
        <button
          type="button"
          onClick={() => setMaxDistanceKm(maxDistanceKm === 0.5 ? 2 : 0.5)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 border cursor-pointer transition-colors min-h-[36px] ${
            maxDistanceKm === 0.5
              ? 'bg-[#FF6B35] text-white border-[#FF6B35]'
              : 'bg-white/85 dark:bg-[#151820]/85 text-zinc-700 dark:text-zinc-300 border-stone-200/80 dark:border-white/10'
          }`}
        >
          Under 0.5 km
        </button>
        <button
          type="button"
          onClick={() => setMinHygiene(minHygiene === 4.8 ? 4.0 : 4.8)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 border cursor-pointer transition-colors min-h-[36px] ${
            minHygiene === 4.8
              ? 'bg-[#FF6B35] text-white border-[#FF6B35]'
              : 'bg-white/85 dark:bg-[#151820]/85 text-zinc-700 dark:text-zinc-300 border-stone-200/80 dark:border-white/10'
          }`}
        >
          4.8★+ Hygiene
        </button>
        <button
          type="button"
          onClick={() => setMaxBudget(maxBudget === 50 ? 60 : 50)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 border cursor-pointer transition-colors min-h-[36px] ${
            maxBudget === 50
              ? 'bg-[#FF6B35] text-white border-[#FF6B35]'
              : 'bg-white/85 dark:bg-[#151820]/85 text-zinc-700 dark:text-zinc-300 border-stone-200/80 dark:border-white/10'
          }`}
        >
          Budget ≤ ₹50
        </button>
      </div>

      {viewMode === 'map' ? (
        <div className="space-y-3">
          <div className="relative h-64 rounded-2xl overflow-hidden border border-stone-200/80 dark:border-white/[0.1] bg-[#EFECE6] dark:bg-[#12161E]">
            <div className="absolute inset-0 cc-arch-grid opacity-60 pointer-events-none" aria-hidden="true" />
            <svg viewBox="0 0 100 100" className="w-full h-full relative z-0" aria-label="Illustrated Selakui campus map">
              <path d="M0 48 Q 48 44, 100 52" stroke="#D6D3CD" strokeOpacity="0.65" strokeWidth="3.2" fill="none" />
              <path d="M46 0 L 49 100" stroke="#D6D3CD" strokeOpacity="0.65" strokeWidth="2.4" fill="none" />
              <path d="M18 15 L 82 82" stroke="#94A3B8" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
              <circle cx="47" cy="46" r="26" stroke="#15803D" strokeOpacity="0.18" strokeDasharray="1.5 2" strokeWidth="0.6" fill="none" />
              <rect x="38" y="39" width="18" height="14" rx="2.5" fill="#15803D" opacity="0.2" stroke="#15803D" strokeWidth="0.8" />
              <text x="47" y="47" textAnchor="middle" fontSize="3.4" fontWeight="700" fill="#15803D">
                DBS Campus
              </text>
              <text x="47" y="51" textAnchor="middle" fontSize="2.3" fill="#64748B">
                Selakui Gate
              </text>
            </svg>

            {filtered.map((eatery) => {
              const isSelected = eatery.id === activeMapEatery?.id;
              return (
                <div
                  key={eatery.id}
                  style={{ left: `${eatery.mapPos.x}%`, top: `${eatery.mapPos.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 ${isSelected ? 'z-20' : 'z-10'}`}
                >
                  {isSelected && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-lg bg-[#FF6B35]/35 animate-cc-sonar"
                    />
                  )}
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    onClick={() => setMapActiveId(eatery.id)}
                    aria-label={`Select ${eatery.name} on map`}
                    className={`relative px-2 py-1 rounded-lg text-[10px] font-bold shadow-md transition-transform cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#FF6B35] text-white scale-110'
                        : 'bg-white/95 dark:bg-[#1C2029]/95 text-zinc-900 dark:text-zinc-100 border border-stone-300/80 dark:border-white/15'
                    }`}
                  >
                    {eatery.name.split(' ')[0]} · ₹{eatery.avgPartnerPrice}
                  </motion.button>
                </div>
              );
            })}
          </div>

          {activeMapEatery && (
            <motion.div
              key={activeMapEatery.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 truncate">
                  {activeMapEatery.name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {activeMapEatery.distanceKm} km · {activeMapEatery.walkMinutes} min walk · {activeMapEatery.hygieneRating}★
                </p>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1 truncate">
                  {activeMapEatery.todaySpecial}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEateryId(activeMapEatery.id)}
                className="px-3.5 py-2 rounded-xl bg-[#FF6B35] text-white text-xs font-bold shrink-0 cursor-pointer min-h-[40px]"
              >
                Open
              </button>
            </motion.div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] text-center space-y-2">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                No eateries match those filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setVegOnly(false);
                  setMaxDistanceKm(2);
                  setMinHygiene(4.0);
                  setMaxBudget(60);
                }}
                className="px-4 py-2 rounded-xl bg-[#FF6B35] text-white text-xs font-bold cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filtered.map((eatery) => (
              <motion.div
                key={eatery.id}
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                className="group rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] overflow-hidden shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="relative h-36 bg-stone-100 dark:bg-zinc-800 overflow-hidden">
                  <img
                    src={eatery.image}
                    alt={eatery.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent flex items-end justify-between p-3.5">
                    <div className="text-white">
                      <h3 className="text-base font-bold leading-tight">{eatery.name}</h3>
                      <p className="text-[11px] text-zinc-200">
                        {eatery.cuisine} · {eatery.isPureVeg ? 'Pure Veg' : 'Veg & Non-Veg'}
                      </p>
                    </div>
                    <div className="text-right text-white">
                      <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        {eatery.hygieneRating.toFixed(1)} Verified
                      </div>
                      <div className="text-[11px] font-mono">₹{eatery.avgPartnerPrice}/meal</div>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>
                      {eatery.distanceKm} km · {eatery.walkMinutes} min walk
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {eatery.rushLevel} Rush · {eatery.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    Today&apos;s Special: {eatery.todaySpecial}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedEateryId(eatery.id)}
                      className="flex-1 py-2 px-3 rounded-xl border border-stone-200/80 dark:border-white/10 text-xs font-semibold text-zinc-800 dark:text-zinc-100 hover:bg-stone-50 dark:hover:bg-white/[0.05] cursor-pointer min-h-[40px]"
                    >
                      Menu & Hygiene Card
                    </button>
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => jumpToQrRedeem(eatery.id, eatery.menu[0]?.name)}
                      className="py-2 px-4 rounded-xl bg-[#FF6B35] text-white text-xs font-bold hover:bg-[#e85d2a] cursor-pointer min-h-[40px]"
                    >
                      Redeem QR
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

