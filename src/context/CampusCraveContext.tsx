import React, { createContext, useContext, useEffect, useState } from 'react';
import type {
  ActiveSubscription,
  AssumptionItem,
  ChatMessage,
  HubSubPage,
  HygieneReport,
  InvoiceRecord,
  MealRedemption,
  PartnerEatery,
  StudentProfile,
  StudentTab,
  SubscriptionPlan,
  UserRole,
  WeeklyPlanDay,
} from '../types';
import {
  DEFAULT_ACTIVE_SUBSCRIPTION,
  DEFAULT_STUDENT_PROFILE,
  INITIAL_ASSUMPTIONS,
  INITIAL_EATERIES,
  SEEDED_INVOICES,
  SEEDED_REDEMPTIONS,
} from '../data/mockData';
import {
  applyPlanPurchase,
  generateDynamicQrToken,
  getQrWindowIndex,
  validateQrRedemption,
} from '../utils/campusCraveLogic';

const STORAGE_KEY = 'campuscrave_state_v1';

interface PersistedState {
  hasCompletedOnboarding: boolean;
  role: UserRole;
  darkMode: boolean;
  student: StudentProfile;
  subscription: ActiveSubscription;
  eateries: PartnerEatery[];
  redemptions: MealRedemption[];
  invoices: InvoiceRecord[];
  hygieneReports: HygieneReport[];
  assumptions: AssumptionItem[];
  chatMessages: ChatMessage[];
  weeklyPlan: WeeklyPlanDay[] | null;
  weeklyPlanSummary: string;
  selectedVendorId: string;
  cooldownClearedAt: number;
  vendorOffPeakPromo: boolean;
  settledVendors: Record<string, number>;
  milestones: {
    exploredEatery: boolean;
    redeemedQr: boolean;
    usedAiBuddy: boolean;
    checkedVendor: boolean;
    checkedAdmin: boolean;
  };
}

function loadInitialState(): PersistedState {
  const autostart =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('autostart') === '1';

  const baseState: PersistedState = {
    hasCompletedOnboarding: autostart,
    role: 'student',
    darkMode: false,
    student: DEFAULT_STUDENT_PROFILE,
    subscription: DEFAULT_ACTIVE_SUBSCRIPTION,
    eateries: INITIAL_EATERIES,
    redemptions: SEEDED_REDEMPTIONS,
    invoices: SEEDED_INVOICES,
    hygieneReports: [
      {
        id: 'hr-101',
        eateryId: 'tandoor-junction',
        eateryName: 'Tandoor Junction',
        category: 'Packaging / Serving Cleanliness',
        details: 'Requested extra tissue & covered chutney bowls during rush hour.',
        createdAt: Date.now() - 3 * 86400000,
        status: 'Resolved',
      },
    ],
    assumptions: INITIAL_ASSUMPTIONS,
    chatMessages: [
      {
        id: 'msg-welcome',
        sender: 'ai',
        text: 'Hey Aarav! I am your CampusCrave Meal Buddy for Selakui. Tell me your craving, budget, or exam-week mood and I will match you with a verified meal near DBS Global University.',
        timestamp: Date.now() - 600000,
      },
    ],
    weeklyPlan: null,
    weeklyPlanSummary: '',
    selectedVendorId: 'pahadi-rasoi',
    cooldownClearedAt: 0,
    vendorOffPeakPromo: true,
    settledVendors: {},
    milestones: {
      exploredEatery: false,
      redeemedQr: false,
      usedAiBuddy: false,
      checkedVendor: false,
      checkedAdmin: false,
    },
  };

  if (typeof window === 'undefined') return baseState;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return baseState;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      ...baseState,
      ...parsed,
      hasCompletedOnboarding: autostart ? true : Boolean(parsed.hasCompletedOnboarding),
    };
  } catch {
    return baseState;
  }
}

export interface ToastItem {
  id: string;
  title: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

interface CampusCraveContextValue {
  state: PersistedState;
  activeTab: StudentTab;
  setActiveTab: (tab: StudentTab) => void;
  hubSubPage: HubSubPage;
  setHubSubPage: (sub: HubSubPage) => void;
  selectedEateryId: string | null;
  setSelectedEateryId: (id: string | null) => void;
  toasts: ToastItem[];
  pushToast: (title: string, type?: ToastItem['type']) => void;
  setRole: (role: UserRole) => void;
  toggleDarkMode: () => void;
  activateDemoMode: () => void;
  completeOnboarding: (profile: Partial<StudentProfile>) => void;
  updateStudentProfile: (updates: Partial<StudentProfile>) => void;
  redeemMealAtEatery: (eateryId: string, dishName?: string, bypassCooldownForVendorSim?: boolean) => { ok: boolean; message: string };
  purchasePlan: (plan: SubscriptionPlan, upiApp: 'GPay' | 'PhonePe' | 'Paytm') => InvoiceRecord;
  rateRedemption: (redemptionId: string, rating: number) => void;
  submitHygieneReport: (eateryId: string, category: string, details: string) => void;
  toggleMenuItemStock: (eateryId: string, itemId: string) => void;
  addVendorMenuItem: (eateryId: string, name: string, partnerValueInr: number, isVeg: boolean) => void;
  setSelectedVendorId: (id: string) => void;
  updateAssumptionStatus: (id: string, status: AssumptionItem['status']) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setWeeklyPlan: (plan: WeeklyPlanDay[], summary: string) => void;
  resetDemoData: () => void;
  getStudentRedemptions: () => MealRedemption[];
  simulateFriendReferral: () => void;
  qrPreselect: { eateryId: string; dishName?: string } | null;
  setQrPreselect: (val: { eateryId: string; dishName?: string } | null) => void;
  jumpToQrRedeem: (eateryId: string, dishName?: string) => void;
  clearDuplicateCooldownForDemo: () => void;
  addEateryReview: (eateryId: string, rating: number, comment: string) => void;
  toggleVendorOffPeakPromo: () => void;
  settleVendorPayout: (vendorId: string, amount: number) => void;
  markMilestone: (key: keyof PersistedState['milestones']) => void;
}

const CampusCraveContext = createContext<CampusCraveContextValue | null>(null);

export function CampusCraveProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(loadInitialState);
  const [activeTab, setActiveTab] = useState<StudentTab>('home');
  const [hubSubPage, setHubSubPage] = useState<HubSubPage>('menu');
  const [selectedEateryId, setSelectedEateryId] = useState<string | null>(null);
  const [qrPreselect, setQrPreselect] = useState<{ eateryId: string; dishName?: string } | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    if (state.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.darkMode]);

  const pushToast = (title: string, type: ToastItem['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  };

  const setRole = (role: UserRole) => {
    setState((prev) => ({
      ...prev,
      role,
      milestones: {
        ...prev.milestones,
        checkedVendor: role === 'vendor' ? true : prev.milestones.checkedVendor,
        checkedAdmin: role === 'admin' ? true : prev.milestones.checkedAdmin,
      },
    }));
  };

  const toggleDarkMode = () => {
    setState((prev) => ({ ...prev, darkMode: !prev.darkMode }));
  };

  const activateDemoMode = () => {
    setState((prev) => ({
      ...prev,
      hasCompletedOnboarding: true,
      role: 'student',
      student: DEFAULT_STUDENT_PROFILE,
    }));
    setActiveTab('home');
    pushToast('Demo Mode active: Logged in as Aarav Rawat (DBS Hostel Block B)', 'success');
  };

  const completeOnboarding = (profile: Partial<StudentProfile>) => {
    setState((prev) => ({
      ...prev,
      hasCompletedOnboarding: true,
      role: 'student',
      student: {
        ...prev.student,
        ...profile,
        id: prev.student.id || `stu-${Date.now()}`,
        referralCode: (profile.name || prev.student.name)
          .toUpperCase()
          .replace(/[^A-Z]/g, '')
          .slice(0, 5) + 'DBS40',
      },
    }));
    setActiveTab('home');
    pushToast('Welcome to CampusCrave! Your student pass is ready.', 'success');
  };

  const updateStudentProfile = (updates: Partial<StudentProfile>) => {
    setState((prev) => ({
      ...prev,
      student: { ...prev.student, ...updates },
    }));
  };

  const getStudentRedemptions = () =>
    state.redemptions.filter((r) => r.studentId === state.student.id);

  const redeemMealAtEatery = (
    eateryId: string,
    dishName?: string,
    bypassCooldownForVendorSim = false,
  ): { ok: boolean; message: string } => {
    const now = Date.now();
    const eatery = state.eateries.find((e) => e.id === eateryId);
    if (!eatery) {
      return { ok: false, message: 'Partner eatery not found.' };
    }

    const token = generateDynamicQrToken(state.student.id, state.subscription.planId, now);
    const studentRedemptions = state.redemptions.filter(
      (r) => r.studentId === state.student.id && r.timestamp > state.cooldownClearedAt,
    );

    const validation = validateQrRedemption({
      tokenWindow: token.windowIndex,
      currentWindow: getQrWindowIndex(now),
      creditsRemaining: state.subscription.creditsRemaining,
      recentRedemptions: bypassCooldownForVendorSim ? [] : studentRedemptions,
      nowMs: now,
    });

    if (validation.status !== 'valid') {
      pushToast(validation.reason, 'warning');
      return { ok: false, message: validation.reason };
    }

    const chosenDish = dishName || eatery.todaySpecial;
    const d = new Date(now);
    const newRedemption: MealRedemption = {
      id: `red-${now}`,
      studentId: state.student.id,
      studentName: state.student.name,
      eateryId: eatery.id,
      eateryName: eatery.name,
      dishName: chosenDish,
      creditsUsed: 1,
      campusCraveCost: eatery.avgPartnerPrice,
      deliveryEquivalentCost: eatery.avgPartnerPrice + 145,
      timestamp: now,
      dateStr: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      timeStr: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      invoiceId: `CC-${now.toString().slice(-6)}`,
    };

    setState((prev) => ({
      ...prev,
      subscription: {
        ...prev.subscription,
        creditsRemaining: Math.max(0, prev.subscription.creditsRemaining - 1),
      },
      student: {
        ...prev.student,
        streakDays: prev.student.streakDays + 1,
      },
      redemptions: [newRedemption, ...prev.redemptions],
      milestones: {
        ...prev.milestones,
        redeemedQr: true,
      },
    }));

    pushToast(`1 meal credit redeemed at ${eatery.name}!`, 'success');
    return { ok: true, message: `Redeemed ${chosenDish} at ${eatery.name}` };
  };

  const purchasePlan = (
    plan: SubscriptionPlan,
    upiApp: 'GPay' | 'PhonePe' | 'Paytm',
  ): InvoiceRecord => {
    const now = Date.now();
    const nextSub = applyPlanPurchase(state.subscription, plan, now);
    const invoice: InvoiceRecord = {
      id: `INV-CC-${now.toString().slice(-4)}`,
      planName: `${plan.name} (${plan.credits} Credits)`,
      amount: plan.price,
      upiApp,
      utrNumber: `UTR${now.toString().slice(-11)}`,
      dateStr: new Date(now).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      status: 'Paid',
    };

    setState((prev) => ({
      ...prev,
      subscription: nextSub,
      invoices: [invoice, ...prev.invoices],
    }));
    pushToast(`${plan.name} activated via ${upiApp}!`, 'success');
    return invoice;
  };

  const rateRedemption = (redemptionId: string, rating: number) => {
    setState((prev) => ({
      ...prev,
      redemptions: prev.redemptions.map((r) =>
        r.id === redemptionId ? { ...r, rating } : r,
      ),
    }));
    pushToast(`Thanks for rating ${rating}★!`, 'success');
  };

  const submitHygieneReport = (eateryId: string, category: string, details: string) => {
    const eatery = state.eateries.find((e) => e.id === eateryId);
    const report: HygieneReport = {
      id: `hr-${Date.now()}`,
      eateryId,
      eateryName: eatery?.name || 'Partner Eatery',
      category,
      details,
      createdAt: Date.now(),
      status: 'Under Review',
    };
    setState((prev) => ({
      ...prev,
      hygieneReports: [report, ...prev.hygieneReports],
    }));
    pushToast('Hygiene feedback logged for immediate Selakui field audit.', 'success');
  };

  const toggleMenuItemStock = (eateryId: string, itemId: string) => {
    setState((prev) => ({
      ...prev,
      eateries: prev.eateries.map((e) =>
        e.id === eateryId
          ? {
              ...e,
              menu: e.menu.map((m) =>
                m.id === itemId ? { ...m, inStock: !m.inStock } : m,
              ),
            }
          : e,
      ),
    }));
    pushToast('Menu stock updated for live student view.', 'info');
  };

  const addVendorMenuItem = (
    eateryId: string,
    name: string,
    partnerValueInr: number,
    isVeg: boolean,
  ) => {
    setState((prev) => ({
      ...prev,
      eateries: prev.eateries.map((e) =>
        e.id === eateryId
          ? {
              ...e,
              todaySpecial: name,
              menu: [
                {
                  id: `item-${Date.now()}`,
                  name,
                  priceCredits: 1,
                  partnerValueInr,
                  isVeg,
                  isSpecial: true,
                  inStock: true,
                  calories: '550 kcal',
                  protein: '18g protein',
                  description: 'Freshly added today by partner kitchen.',
                },
                ...e.menu,
              ],
            }
          : e,
      ),
    }));
    pushToast(`Added "${name}" to today's live menu!`, 'success');
  };

  const setSelectedVendorId = (id: string) => {
    setState((prev) => ({ ...prev, selectedVendorId: id }));
  };

  const updateAssumptionStatus = (id: string, status: AssumptionItem['status']) => {
    setState((prev) => ({
      ...prev,
      assumptions: prev.assumptions.map((a) => (a.id === id ? { ...a, status } : a)),
    }));
    pushToast(`Assumption marked as ${status}`, 'info');
  };

  const addChatMessage = (msg: ChatMessage) => {
    setState((prev) => ({
      ...prev,
      chatMessages: [...prev.chatMessages, msg],
    }));
  };

  const setWeeklyPlan = (plan: WeeklyPlanDay[], summary: string) => {
    setState((prev) => ({
      ...prev,
      weeklyPlan: plan,
      weeklyPlanSummary: summary,
    }));
  };

  const simulateFriendReferral = () => {
    setState((prev) => {
      const nextCount = prev.student.referredFriendsCount + 1;
      const earnedFreeMeal = nextCount % 3 === 0;
      return {
        ...prev,
        student: {
          ...prev.student,
          referredFriendsCount: nextCount,
        },
        subscription: earnedFreeMeal
          ? {
              ...prev.subscription,
              creditsRemaining: prev.subscription.creditsRemaining + 1,
              creditsTotal: prev.subscription.creditsTotal + 1,
            }
          : prev.subscription,
      };
    });
    pushToast('Friend referral credited! Keep sharing to unlock free meals.', 'success');
  };

  const jumpToQrRedeem = (eateryId: string, dishName?: string) => {
    setQrPreselect({ eateryId, dishName });
    setState((prev) => ({ ...prev, role: 'student', hasCompletedOnboarding: true }));
    setActiveTab('qr');
  };

  const clearDuplicateCooldownForDemo = () => {
    setState((prev) => ({ ...prev, cooldownClearedAt: Date.now() }));
    pushToast('Demo cooldown cleared — you can scan a fresh meal pass immediately.', 'info');
  };

  const addEateryReview = (eateryId: string, rating: number, comment: string) => {
    const newRev = {
      id: `rev-${Date.now()}`,
      studentName: state.student.name,
      hostel: state.student.hostelOrPg.split('·')[0].trim(),
      rating,
      comment,
      dateLabel: 'Just now',
    };
    setState((prev) => ({
      ...prev,
      eateries: prev.eateries.map((e) => {
        if (e.id !== eateryId) return e;
        const updatedReviews = [newRev, ...e.reviews];
        const avg =
          updatedReviews.reduce((acc, r) => acc + r.rating, 0) /
          updatedReviews.length;
        return {
          ...e,
          hygieneRating: Math.round(avg * 10) / 10,
          reviews: updatedReviews,
        };
      }),
      milestones: { ...prev.milestones, exploredEatery: true },
    }));
    pushToast('Review published live to Selakui partner card!', 'success');
  };

  const toggleVendorOffPeakPromo = () => {
    setState((prev) => ({
      ...prev,
      vendorOffPeakPromo: !prev.vendorOffPeakPromo,
    }));
    pushToast('Off-peak 2–4 PM Chai perk toggled.', 'info');
  };

  const settleVendorPayout = (vendorId: string, amount: number) => {
    setState((prev) => ({
      ...prev,
      settledVendors: {
        ...prev.settledVendors,
        [vendorId]: (prev.settledVendors[vendorId] || 0) + amount,
      },
    }));
    pushToast(`Instant UPI settlement of ₹${amount} processed to partner bank!`, 'success');
  };

  const markMilestone = (key: keyof PersistedState['milestones']) => {
    setState((prev) => {
      if (prev.milestones[key]) return prev;
      return {
        ...prev,
        milestones: { ...prev.milestones, [key]: true },
      };
    });
  };

  const resetDemoData = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setState(loadInitialState());
    setActiveTab('home');
    setHubSubPage('menu');
    setQrPreselect(null);
    pushToast('Demo workspace reset to fresh seed data.', 'info');
  };

  return (
    <CampusCraveContext.Provider
      value={{
        state,
        activeTab,
        setActiveTab,
        hubSubPage,
        setHubSubPage,
        selectedEateryId,
        setSelectedEateryId,
        toasts,
        pushToast,
        setRole,
        toggleDarkMode,
        activateDemoMode,
        completeOnboarding,
        updateStudentProfile,
        redeemMealAtEatery,
        purchasePlan,
        rateRedemption,
        submitHygieneReport,
        toggleMenuItemStock,
        addVendorMenuItem,
        setSelectedVendorId,
        updateAssumptionStatus,
        addChatMessage,
        setWeeklyPlan,
        resetDemoData,
        getStudentRedemptions,
        simulateFriendReferral,
        qrPreselect,
        setQrPreselect,
        jumpToQrRedeem,
        clearDuplicateCooldownForDemo,
        addEateryReview,
        toggleVendorOffPeakPromo,
        settleVendorPayout,
        markMilestone,
      }}
    >
      {children}
    </CampusCraveContext.Provider>
  );
}

export function useCampusCrave() {
  const ctx = useContext(CampusCraveContext);
  if (!ctx) throw new Error('useCampusCrave must be used within CampusCraveProvider');
  return ctx;
}
