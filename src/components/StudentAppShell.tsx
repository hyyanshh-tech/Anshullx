import React from 'react';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Circle,
  Compass,
  CreditCard,
  Gift,
  History,
  Home,
  Info,
  LayoutGrid,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCampusCrave } from '../context/CampusCraveContext';
import { StudentHome } from './student/StudentHome';
import { ExploreEateries } from './student/ExploreEateries';
import { QrPassScreen } from './student/QrPassScreen';
import { AiMealBuddy } from './student/AiMealBuddy';
import { PlansAndCheckout } from './student/PlansAndCheckout';
import { NutritionTracker } from './student/NutritionTracker';
import { BudgetDashboard } from './student/BudgetDashboard';
import { RewardsAndReferrals } from './student/RewardsAndReferrals';
import { HistoryAndProfile } from './student/HistoryAndProfile';
import type { HubSubPage, StudentTab } from '../types';

export function StudentAppShell({ onOpenAbout }: { onOpenAbout: () => void }) {
  const {
    state,
    activeTab,
    setActiveTab,
    hubSubPage,
    setHubSubPage,
    setRole,
    activateDemoMode,
  } = useCampusCrave();

  const openHubSub = (sub: HubSubPage) => {
    setHubSubPage(sub);
    setActiveTab('hub');
  };

  const walkthroughSteps = [
    {
      label: 'Explore Selakui eateries & map',
      done: state.milestones.exploredEatery,
      action: () => setActiveTab('explore'),
    },
    {
      label: 'Redeem 30s Dynamic QR pass',
      done: state.milestones.redeemedQr,
      action: () => setActiveTab('qr'),
    },
    {
      label: 'Chat with Gemini AI Meal Buddy',
      done: state.milestones.usedAiBuddy,
      action: () => setActiveTab('buddy'),
    },
    {
      label: 'Test Vendor QR counter scanner',
      done: state.milestones.checkedVendor,
      action: () => setRole('vendor'),
    },
    {
      label: 'Model Admin unit economics',
      done: state.milestones.checkedAdmin,
      action: () => setRole('admin'),
    },
  ];
  const completedCount = walkthroughSteps.filter((s) => s.done).length;

  const renderStudentContent = () => {
    switch (activeTab) {
      case 'home':
        return <StudentHome />;
      case 'explore':
        return <ExploreEateries />;
      case 'qr':
        return <QrPassScreen />;
      case 'buddy':
        return <AiMealBuddy />;
      case 'hub':
      default:
        if (hubSubPage === 'plans') {
          return <PlansAndCheckout onBack={() => setHubSubPage('menu')} />;
        }
        if (hubSubPage === 'nutrition') {
          return <NutritionTracker onBack={() => setHubSubPage('menu')} />;
        }
        if (hubSubPage === 'budget') {
          return <BudgetDashboard onBack={() => setHubSubPage('menu')} />;
        }
        if (hubSubPage === 'rewards') {
          return <RewardsAndReferrals onBack={() => setHubSubPage('menu')} />;
        }
        if (hubSubPage === 'history') {
          return <HistoryAndProfile onBack={() => setHubSubPage('menu')} />;
        }

        return (
          <div className="space-y-4 pb-6">
            <div>
              <h1 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
                Pass Hub & Account
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {state.student.name} · {state.subscription.creditsRemaining} credits active
              </p>
            </div>

            <div className="rounded-2xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] divide-y divide-stone-100 dark:divide-white/[0.06]">
              {(
                [
                  {
                    id: 'nutrition',
                    title: 'Nutrition & Macro Tracker',
                    desc: 'Daily calories, protein & 7-day plan trends',
                    icon: Activity,
                  },
                  {
                    id: 'plans',
                    title: 'Plans & UPI Checkout',
                    desc: 'Trial ₹199 · Monthly ₹1,999 · Roommate Bundle',
                    icon: CreditCard,
                  },
                  {
                    id: 'budget',
                    title: 'Budget & Savings Analytics',
                    desc: 'Weekly charts vs Zomato/Swiggy & goal slider',
                    icon: BarChart3,
                  },
                  {
                    id: 'rewards',
                    title: 'Rewards & Hostel Referrals',
                    desc: 'Refer 3 friends = 1 free meal · Campus leaderboard',
                    icon: Gift,
                  },
                  {
                    id: 'history',
                    title: 'Meal History, Invoices & Hygiene',
                    desc: 'Past scans, UPI receipts & vendor feedback form',
                    icon: History,
                  },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setHubSubPage(item.id)}
                    className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-stone-50/80 dark:hover:bg-white/[0.03] transition-colors cursor-pointer min-h-[60px]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                          {item.title}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                  </button>
                );
              })}

              <button
                type="button"
                onClick={onOpenAbout}
                className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-stone-50/80 dark:hover:bg-white/[0.03] transition-colors cursor-pointer min-h-[60px]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-[#15803D] dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                      About CampusCrave
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      Problem, CVP statement & Selakui campus model
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
              </button>
            </div>
          </div>
        );
    }
  };

  const navItems: { id: StudentTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'qr', label: 'QR Pass', icon: QrCode },
    { id: 'buddy', label: 'AI Buddy', icon: Sparkles },
    { id: 'hub', label: 'More', icon: LayoutGrid },
  ];

  return (
    <div className="max-w-6xl mx-auto px-0 sm:px-6 py-0 sm:py-6 grid lg:grid-cols-12 gap-8 items-start">
      {/* Desktop Context Rail (keeps desktop balanced and richly interactive alongside centered phone frame) */}
      <aside className="hidden lg:block lg:col-span-5 space-y-5 sticky top-20">
        <div className="p-6 rounded-3xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#15803D] dark:text-emerald-400">
              Student Mobile Experience · Live Preview
            </p>
            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {state.student.name}&apos;s Meal Pass
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              DBS Global University, Selakui · {state.subscription.creditsRemaining} credits active
              on {state.subscription.planName}.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab('qr')}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#ff7d4d] text-white text-xs font-bold shadow-sm shadow-[#FF6B35]/20 hover:brightness-105 cursor-pointer min-h-[42px]"
            >
              Open QR Pass
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => openHubSub('plans')}
              className="py-2.5 px-3 rounded-xl border border-stone-200/80 dark:border-white/10 text-xs font-bold text-zinc-800 dark:text-zinc-100 hover:bg-stone-50 dark:hover:bg-white/[0.05] cursor-pointer min-h-[42px]"
            >
              Plans & Checkout
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => openHubSub('nutrition')}
              className="py-2.5 px-3 rounded-xl border border-stone-200/80 dark:border-white/10 text-xs font-bold text-zinc-800 dark:text-zinc-100 hover:bg-stone-50 dark:hover:bg-white/[0.05] cursor-pointer min-h-[42px]"
            >
              Nutrition Tracker
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => openHubSub('budget')}
              className="py-2.5 px-3 rounded-xl border border-stone-200/80 dark:border-white/10 text-xs font-bold text-zinc-800 dark:text-zinc-100 hover:bg-stone-50 dark:hover:bg-white/[0.05] cursor-pointer min-h-[42px]"
            >
              Savings Charts
            </motion.button>
          </div>

          <div className="pt-3 border-t border-stone-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={activateDemoMode}
              className="font-semibold text-[#FF6B35] hover:underline cursor-pointer"
            >
              Refresh Demo Profile
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRole('vendor')}
                className="font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
              >
                Vendor Portal →
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className="font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
              >
                Admin →
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Walkthrough Checklist */}
        <div className="p-5 rounded-3xl bg-white/85 dark:bg-[#151820]/85 backdrop-blur-xl border border-stone-200/80 dark:border-white/[0.08] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Interactive Tour Checklist
            </h3>
            <span className="text-xs font-mono font-bold text-[#FF6B35]">
              {completedCount}/5 tested
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#15803D] to-emerald-400 rounded-full"
              initial={false}
              animate={{ width: `${(completedCount / 5) * 100}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 24 }}
            />
          </div>
          <div className="space-y-1.5 pt-1">
            {walkthroughSteps.map((step) => (
              <motion.button
                key={step.label}
                type="button"
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.99 }}
                onClick={step.action}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl hover:bg-stone-50/90 dark:hover:bg-white/[0.04] text-left text-xs transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200">
                  {step.done ? (
                    <CheckCircle2 className="w-4 h-4 text-[#15803D] dark:text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-zinc-300 dark:text-zinc-600 shrink-0" />
                  )}
                  <span className={step.done ? 'line-through text-zinc-400 dark:text-zinc-500' : 'font-medium'}>
                    {step.label}
                  </span>
                </span>
                <span className="text-[11px] font-semibold text-[#FF6B35] shrink-0">
                  Go →
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </aside>

      {/* Centered Mobile App Frame on Desktop / Full-Bleed Native View on Mobile */}
      <div className="lg:col-span-7 flex justify-center w-full min-w-0">
        <div className="w-full min-w-0 sm:max-w-[420px] sm:rounded-[2.25rem] sm:border-[6px] sm:border-zinc-900 sm:dark:border-zinc-700/90 bg-[#FBF9F6]/95 dark:bg-[#111319]/95 sm:shadow-[0_24px_80px_-16px_rgba(0,0,0,0.28)] dark:sm:shadow-[0_24px_80px_-12px_rgba(255,107,53,0.14)] overflow-hidden flex flex-col min-h-[calc(100vh-3.5rem)] sm:min-h-[700px] sm:max-h-[820px] relative">
          {/* Desktop Phone Status Strip */}
          <div className="hidden sm:flex px-5 pt-3 pb-1 items-center justify-between text-[11px] font-mono text-zinc-500 dark:text-zinc-400 shrink-0">
            <span>9:41 AM</span>
            <span className="w-16 h-4 rounded-full bg-zinc-900 dark:bg-zinc-800 border border-white/10" aria-hidden="true" />
            <span>DBS Selakui</span>
          </div>

          {/* Scrollable App Viewport */}
          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden px-4 pt-3 pb-20 no-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeTab}-${activeTab === 'hub' ? hubSubPage : 'root'}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                {renderStudentContent()}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Bottom Navigation Bar (Fixed at bottom on mobile, pinned inside phone frame on desktop) */}
          <nav
            aria-label="Student app navigation"
            className="fixed sm:sticky bottom-0 left-0 right-0 z-30 h-16 bg-white/90 dark:bg-[#13161E]/90 backdrop-blur-xl border-t border-stone-200/80 dark:border-white/[0.08] grid grid-cols-5 items-center px-1 shrink-0"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => {
                    if (item.id === 'hub') setHubSubPage('menu');
                    setActiveTab(item.id);
                  }}
                  className={`relative flex flex-col items-center justify-center gap-0.5 min-h-[48px] rounded-xl cursor-pointer transition-colors ${
                    isActive
                      ? 'text-[#FF6B35]'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="student-bottom-tab-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="absolute top-0.5 w-8 h-1 rounded-full bg-[#FF6B35]"
                      aria-hidden="true"
                    />
                  )}
                  <Icon className="w-5 h-5 relative z-10" />
                  <span className="text-[10px] font-semibold tracking-tight whitespace-nowrap relative z-10">
                    {item.label}
                  </span>
                </motion.button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}

