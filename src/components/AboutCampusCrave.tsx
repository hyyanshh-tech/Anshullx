import React from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  ChefHat,
  IndianRupee,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
} from 'lucide-react';
import { HERO_IMAGE } from '../data/mockData';
import type { UserRole } from '../types';

interface AboutProps {
  onBack: () => void;
  onSelectRole: (role: UserRole) => void;
}

export function AboutCampusCrave({ onBack, onSelectRole }: AboutProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-[#FF6B35] cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to App
        </button>
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          DBS Global University · Selakui, Dehradun
        </span>
      </div>

      {/* Hero CVP Card */}
      <section className="rounded-3xl overflow-hidden bg-white dark:bg-[#1A1C21] border border-stone-200 dark:border-zinc-800 grid lg:grid-cols-2 items-stretch">
        <div className="p-6 sm:p-10 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <p className="text-xs font-semibold tracking-wide text-[#166534] dark:text-emerald-400">
              Eat fresh · Save 40% · Zero delivery fees
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 text-balance">
              Reinventing daily hostel dining around DBS Global University.
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
              For university hostellers looking for affordable daily dining alternatives,
              CampusCrave is a digital meal subscription that provides discounted, hygienic
              meals at local partner spots, unlike traditional delivery apps with heavy fees.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onSelectRole('student')}
              className="px-5 py-2.5 rounded-xl bg-[#FF6B35] text-white text-sm font-semibold hover:bg-[#e85d2a] transition-colors cursor-pointer min-h-[44px]"
            >
              Explore Student App
            </button>
            <button
              type="button"
              onClick={() => onSelectRole('admin')}
              className="px-5 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 text-sm font-semibold text-zinc-800 dark:text-zinc-100 hover:bg-stone-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer min-h-[44px]"
            >
              View Unit Economics
            </button>
          </div>
        </div>
        <div className="relative min-h-[260px] lg:min-h-full bg-stone-100 dark:bg-zinc-800">
          <img
            src={HERO_IMAGE}
            alt="Fresh Indian thali and masala chai near Dehradun foothills"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6">
            <p className="text-white text-sm font-medium">
              ₹50–₹55 verified partner meals · 0% delivery or platform surcharges
            </p>
          </div>
        </div>
      </section>

      {/* Problem vs Solution */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1A1C21] border border-stone-200 dark:border-zinc-800 space-y-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            The Selakui Hostel Dining Trap
          </h2>
          <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
            <li className="flex items-start gap-2.5">
              <IndianRupee className="w-4 h-4 text-[#FF6B35] shrink-0 mt-0.5" />
              <span>
                <strong>Delivery App Burn:</strong> Zomato & Swiggy cost ₹150–₹250 per meal once
                packaging, platform, and rain surge fees stack up.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#FF6B35] shrink-0 mt-0.5" />
              <span>
                <strong>Unverified Local Dhabas:</strong> Roadside stalls vary wildly in oil
                freshness, RO water standards, and counter hygiene.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <ChefHat className="w-4 h-4 text-[#FF6B35] shrink-0 mt-0.5" />
              <span>
                <strong>Hostel Mess Fatigue:</strong> Repetitive weekly menus push students to skip
                meals or overspend on late-night junk food.
              </span>
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-[#1A1C21] border border-stone-200 dark:border-zinc-800 space-y-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            How CampusCrave Solves It
          </h2>
          <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
            <li className="flex items-start gap-2.5">
              <BadgeCheck className="w-4 h-4 text-[#15803D] dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Pre-Paid Digital Meal Pass:</strong> One ₹1,999 monthly subscription unlocks
                36 meal credits (~₹55/meal) across 6 verified eateries within 1 km.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Store className="w-4 h-4 text-[#15803D] dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>30-Second Dynamic QR Pass:</strong> Walk in, scan at the counter, and eat
                hot fresh food with zero delivery wait and zero surge fees.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#15803D] dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Gemini AI Meal Buddy:</strong> Matches credits to budget, protein goals,
                veg preferences, and exam-week schedules automatically.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* 3-Role Ecosystem */}
      <section className="grid sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => onSelectRole('student')}
          className="text-left p-5 rounded-2xl bg-white dark:bg-[#1A1C21] border border-stone-200 dark:border-zinc-800 hover:border-[#FF6B35] transition-colors cursor-pointer space-y-2"
        >
          <p className="text-xs font-semibold text-[#FF6B35]">Role 01</p>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Student Pass App</h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Dynamic QR pass, 6 Selakui eateries, AI Meal Buddy, savings tracker & referral rewards.
          </p>
        </button>
        <button
          type="button"
          onClick={() => onSelectRole('vendor')}
          className="text-left p-5 rounded-2xl bg-white dark:bg-[#1A1C21] border border-stone-200 dark:border-zinc-800 hover:border-[#FF6B35] transition-colors cursor-pointer space-y-2"
        >
          <p className="text-xs font-semibold text-[#15803D] dark:text-emerald-400">Role 02</p>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Vendor Partner Portal</h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Instant QR validation, daily settlement ledger, menu stock toggles & off-peak footfall charts.
          </p>
        </button>
        <button
          type="button"
          onClick={() => onSelectRole('admin')}
          className="text-left p-5 rounded-2xl bg-white dark:bg-[#1A1C21] border border-stone-200 dark:border-zinc-800 hover:border-[#FF6B35] transition-colors cursor-pointer space-y-2"
        >
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Role 03</p>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
            Founder Console <TrendingUp className="w-4 h-4 text-[#FF6B35]" />
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Pilot KPIs, interactive unit economics calculator, 30-day GTM tracker & Gemini AI insights.
          </p>
        </button>
      </section>
    </div>
  );
}
