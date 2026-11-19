import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChefHat,
  IndianRupee,
  QrCode,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCampusCrave } from '../context/CampusCraveContext';
import { HERO_IMAGE } from '../data/mockData';
import type { UserRole } from '../types';

const ONBOARDING_SLIDES = [
  {
    kicker: 'Save Money Every Semester',
    title: 'Eat fresh meals at ₹50–55 instead of ₹200+ delivery orders',
    body: 'Pre-pay one monthly pass and unlock 36 verified meals near DBS Global University, Selakui.',
    icon: IndianRupee,
    accent: 'text-[#FF6B35]',
    bg: 'bg-[#FF6B35]/10',
  },
  {
    kicker: 'Hygienic Verified Kitchens',
    title: 'Every partner dhaba & café passes our 5-point hygiene audit',
    body: 'Inspect RO water purity, oil freshness, FSSAI certification, and real student reviews before you walk in.',
    icon: ShieldCheck,
    accent: 'text-[#15803D] dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    kicker: 'Zero Delivery or Surge Fees',
    title: 'Walk 2–8 minutes, scan your 30-second QR pass, and eat hot',
    body: 'No rain surge, no packaging charges, no 45-minute cold delivery boxes.',
    icon: QrCode,
    accent: 'text-[#FF6B35]',
    bg: 'bg-[#FF6B35]/10',
  },
];

interface OnboardingAndLandingProps {
  onOpenAbout: () => void;
}

export function OnboardingAndLanding({ onOpenAbout }: OnboardingAndLandingProps) {
  const { activateDemoMode, completeOnboarding, setRole } = useCampusCrave();
  const [step, setStep] = useState<'splash' | 'slides' | 'signup'>('splash');
  const [slideIdx, setSlideIdx] = useState(0);

  const [name, setName] = useState('');
  const [college, setCollege] = useState('DBS Global University, Selakui');
  const [hostelOrPg, setHostelOrPg] = useState('Hostel Block B');
  const [phone, setPhone] = useState('');
  const [isFirstYear, setIsFirstYear] = useState(true);
  const [formError, setFormError] = useState('');

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setFormError('');
    completeOnboarding({
      name: name.trim(),
      college: college.trim() || 'DBS Global University, Selakui',
      hostelOrPg: hostelOrPg.trim() || 'Selakui Hostel',
      phone: phone.trim(),
      isFirstYearHosteller: isFirstYear,
    });
  };

  const quickRoleLaunch = (role: UserRole) => {
    if (role === 'student') {
      activateDemoMode();
    } else {
      setRole(role);
    }
  };

  const currentSlide = ONBOARDING_SLIDES[slideIdx];
  const SlideIcon = currentSlide.icon;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 grid lg:grid-cols-12 gap-8 items-center">
      {/* Left Context & Role Switcher (Desktop Hero / Mobile Summary) */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="lg:col-span-7 min-w-0 space-y-6"
      >
        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-wide text-[#15803D] dark:text-emerald-400">
            DBS Global University · Selakui, Dehradun
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 text-balance leading-[1.1]">
            Eat fresh.{' '}
            <span className="bg-gradient-to-r from-[#FF6B35] via-[#FF8A50] to-[#15803D] dark:to-emerald-400 bg-clip-text text-transparent">
              Save 40%.
            </span>{' '}
            Zero delivery fees.
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-300 max-w-xl leading-relaxed">
            Pre-paid digital meal pass for hostel & PG students. Redeem hygienic daily meals at
            6 verified Selakui partner spots for ~₹50–55/meal.
          </p>
        </div>

        {/* Instant Demo Mode + Role Switcher */}
        <div className="p-5 rounded-3xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Explore Instant Interactive Demo
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Pre-loaded with 32 seeded redemptions, 6 eateries & live unit economics.
              </p>
            </div>
            <motion.button
              type="button"
              whileHover={{ y: -1, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={activateDemoMode}
              className="relative overflow-hidden inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#E95622] text-white text-sm font-semibold shadow-md shadow-[#FF6B35]/25 cursor-pointer min-h-[44px]"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-cc-shimmer"
              />
              <Sparkles className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Launch Demo Mode</span>
            </motion.button>
          </div>

          <div className="pt-3 border-t border-stone-100 dark:border-white/[0.06]">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2.5">
              Or jump directly into a role workspace:
            </p>
            <div className="grid sm:grid-cols-3 gap-2.5">
              <motion.button
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => quickRoleLaunch('student')}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-stone-200/80 dark:border-white/10 hover:border-[#FF6B35] bg-stone-50/70 dark:bg-white/[0.03] text-left transition-colors cursor-pointer min-h-[44px]"
              >
                <UserCheck className="w-4 h-4 text-[#FF6B35] shrink-0" />
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Student App</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">QR pass & AI Buddy</div>
                </div>
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => quickRoleLaunch('vendor')}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-stone-200/80 dark:border-white/10 hover:border-[#15803D] bg-stone-50/70 dark:bg-white/[0.03] text-left transition-colors cursor-pointer min-h-[44px]"
              >
                <Store className="w-4 h-4 text-[#15803D] dark:text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Vendor Portal</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">QR scan & payouts</div>
                </div>
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => quickRoleLaunch('admin')}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-stone-200/80 dark:border-white/10 hover:border-zinc-400 bg-stone-50/70 dark:bg-white/[0.03] text-left transition-colors cursor-pointer min-h-[44px]"
              >
                <TrendingUp className="w-4 h-4 text-zinc-700 dark:text-zinc-300 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Admin / Founder</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">KPIs & unit math</div>
                </div>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Comparison proof strip */}
        <div className="grid grid-cols-3 gap-3 text-center sm:text-left">
          <motion.div
            whileHover={{ y: -2 }}
            className="p-3.5 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-md border border-stone-200/80 dark:border-white/[0.08]"
          >
            <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-[#FF6B35]">₹55</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Avg CampusCrave meal</div>
          </motion.div>
          <motion.div
            whileHover={{ y: -2 }}
            className="p-3.5 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-md border border-stone-200/80 dark:border-white/[0.08]"
          >
            <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-zinc-900 dark:text-zinc-100">₹195+</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Zomato/Swiggy avg</div>
          </motion.div>
          <motion.div
            whileHover={{ y: -2 }}
            className="p-3.5 rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-md border border-stone-200/80 dark:border-white/[0.08]"
          >
            <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-[#15803D] dark:text-emerald-400">6 Spots</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Within 1 km of DBS</div>
          </motion.div>
        </div>

        <button
          type="button"
          onClick={onOpenAbout}
          className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-[#FF6B35] underline underline-offset-4 cursor-pointer"
        >
          Read full CampusCrave CVP & problem-solution brief
        </button>
      </motion.div>

      {/* Right Phone App Frame: Splash -> Onboarding Slides -> Sign-Up */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="lg:col-span-5 flex justify-center"
      >
        <div className="w-full max-w-[390px] rounded-[2.25rem] border-[6px] border-zinc-900 dark:border-zinc-700/90 bg-[#FBF9F6]/95 dark:bg-[#111319]/95 backdrop-blur-xl shadow-[0_24px_80px_-16px_rgba(0,0,0,0.28)] dark:shadow-[0_24px_80px_-12px_rgba(255,107,53,0.14)] overflow-hidden flex flex-col min-h-[640px]">
          {/* Phone notch header */}
          <div className="px-5 pt-3 pb-2 flex items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
            <span>9:41 AM</span>
            <span className="w-16 h-4 rounded-full bg-zinc-900 dark:bg-zinc-800" aria-hidden="true" />
            <span>Selakui 5G</span>
          </div>

          <div className="flex-1 flex flex-col p-5">
            <AnimatePresence mode="wait">
              {step === 'splash' && (
                <motion.div
                  key="splash"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="relative h-48 rounded-2xl overflow-hidden border border-stone-200/80 dark:border-white/10 group">
                      <img
                        src={HERO_IMAGE}
                        alt="CampusCrave fresh student meals near Dehradun"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-4">
                        <div className="text-white">
                          <p className="text-[11px] font-medium text-amber-300">Selakui Partner Network</p>
                          <p className="text-base font-bold">Hot Thalis, Dosas & Bowls at ₹50–55</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2 text-[#FF6B35] font-bold text-sm">
                        <ChefHat className="w-5 h-5" />
                        <span>CampusCrave Pass</span>
                      </div>
                      <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 leading-tight">
                        Your hostel mess upgrade is 1 tap away.
                      </h2>
                      <p className="text-sm text-zinc-600 dark:text-zinc-300">
                        Built for DBS Global University hostellers & PG students.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-6">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep('slides')}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#E95622] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-[#FF6B35]/20 cursor-pointer min-h-[48px]"
                    >
                      Get Started
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                    <button
                      type="button"
                      onClick={activateDemoMode}
                      className="w-full py-3 px-4 rounded-xl border border-stone-300 dark:border-white/15 bg-white dark:bg-white/[0.04] text-zinc-800 dark:text-zinc-100 text-sm font-semibold hover:bg-stone-50 dark:hover:bg-white/[0.08] transition-colors cursor-pointer min-h-[44px]"
                    >
                      Skip to Demo Mode
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'slides' && (
                <motion.div
                  key={`slide-${slideIdx}`}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                      0{slideIdx + 1} / 03
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep('signup')}
                      className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer min-h-[36px] px-2"
                    >
                      Skip
                    </button>
                  </div>

                  <div className="my-auto space-y-5 py-6">
                    <div className={`w-14 h-14 rounded-2xl ${currentSlide.bg} flex items-center justify-center`}>
                      <SlideIcon className={`w-7 h-7 ${currentSlide.accent}`} />
                    </div>
                    <div className="space-y-2">
                      <p className={`text-xs font-semibold ${currentSlide.accent}`}>
                        {currentSlide.kicker}
                      </p>
                      <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 leading-snug">
                        {currentSlide.title}
                      </h2>
                      <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        {currentSlide.body}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2">
                      {ONBOARDING_SLIDES.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          aria-label={`Onboarding slide ${idx + 1}`}
                          onClick={() => setSlideIdx(idx)}
                          className={`h-2 rounded-full transition-all cursor-pointer ${
                            idx === slideIdx
                              ? 'w-7 bg-[#FF6B35]'
                              : 'w-2 bg-stone-300 dark:bg-zinc-700'
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (slideIdx < ONBOARDING_SLIDES.length - 1) {
                          setSlideIdx(slideIdx + 1);
                        } else {
                          setStep('signup');
                        }
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-[#FF6B35] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#e85d2a] transition-colors cursor-pointer min-h-[48px]"
                    >
                      {slideIdx < ONBOARDING_SLIDES.length - 1 ? 'Next' : 'Create Student Pass'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'signup' && (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -18 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
                      Student Pass Sign-Up
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Localhost demo account · Persists in your browser
                    </p>
                  </div>

                  <form onSubmit={handleSignUpSubmit} className="space-y-3 my-4">
                    <div>
                      <label htmlFor="cc-name" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Full Name
                      </label>
                      <input
                        id="cc-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Aarav Rawat"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                      />
                    </div>

                    <div>
                      <label htmlFor="cc-college" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        College / Campus
                      </label>
                      <input
                        id="cc-college"
                        type="text"
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                      />
                    </div>

                    <div>
                      <label htmlFor="cc-hostel" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Hostel / PG Name
                      </label>
                      <input
                        id="cc-hostel"
                        type="text"
                        value={hostelOrPg}
                        onChange={(e) => setHostelOrPg(e.target.value)}
                        placeholder="e.g. Hostel Block B / Selakui PG"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                      />
                    </div>

                    <div>
                      <label htmlFor="cc-phone" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Phone Number
                      </label>
                      <input
                        id="cc-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="9876543210"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800">
                      <div>
                        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          First-year hosteller?
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Unlocks ₹199 3-Day Trial Pass priority
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isFirstYear}
                        aria-label="First-year hosteller toggle"
                        onClick={() => setIsFirstYear(!isFirstYear)}
                        className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                          isFirstYear ? 'bg-[#15803D]' : 'bg-stone-300 dark:bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                            isFirstYear ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {formError && (
                      <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
                        {formError}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl bg-[#FF6B35] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#e85d2a] transition-colors cursor-pointer min-h-[48px]"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Activate Student Pass
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={activateDemoMode}
                    className="text-xs font-semibold text-center text-[#FF6B35] hover:underline cursor-pointer py-1"
                  >
                    Or autofill Demo Account (Aarav Rawat)
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
