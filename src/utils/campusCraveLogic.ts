import type {
  ActiveSubscription,
  MealRedemption,
  PartnerEatery,
  ScenarioPreset,
  SubscriptionPlan,
  UnitEconomicsInputs,
} from '../types';

export const QR_REFRESH_SECONDS = 30;
export const DUPLICATE_REDEMPTION_COOLDOWN_MINUTES = 120;

export interface SavingsSummary {
  mealsRedeemed: number;
  totalCampusCraveSpend: number;
  totalDeliveryEquivalent: number;
  totalSaved: number;
  savingsPercent: number;
}

export function calculateSavingsSummary(
  redemptions: MealRedemption[],
): SavingsSummary {
  if (redemptions.length === 0) {
    return {
      mealsRedeemed: 0,
      totalCampusCraveSpend: 0,
      totalDeliveryEquivalent: 0,
      totalSaved: 0,
      savingsPercent: 0,
    };
  }

  let totalCampusCraveSpend = 0;
  let totalDeliveryEquivalent = 0;

  for (const r of redemptions) {
    totalCampusCraveSpend += r.campusCraveCost;
    totalDeliveryEquivalent += r.deliveryEquivalentCost;
  }

  const totalSaved = Math.max(0, totalDeliveryEquivalent - totalCampusCraveSpend);
  const savingsPercent =
    totalDeliveryEquivalent > 0
      ? Math.round((totalSaved / totalDeliveryEquivalent) * 100)
      : 0;

  return {
    mealsRedeemed: redemptions.length,
    totalCampusCraveSpend,
    totalDeliveryEquivalent,
    totalSaved,
    savingsPercent,
  };
}

export function getQrWindowIndex(timestampMs: number): number {
  return Math.floor(timestampMs / (QR_REFRESH_SECONDS * 1000));
}

export function getQrSecondsRemaining(timestampMs: number): number {
  const elapsedInWindow = Math.floor(timestampMs / 1000) % QR_REFRESH_SECONDS;
  return QR_REFRESH_SECONDS - elapsedInWindow;
}

export function generateDynamicQrToken(
  studentId: string,
  planId: string,
  timestampMs: number,
): { code: string; windowIndex: number; secondsLeft: number } {
  const windowIndex = getQrWindowIndex(timestampMs);
  const secondsLeft = getQrSecondsRemaining(timestampMs);
  const raw = `${studentId}-${planId}-${windowIndex}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  }
  const suffix = hash.toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
  return {
    code: `CC-DBS-${windowIndex % 1000}-${suffix}`,
    windowIndex,
    secondsLeft,
  };
}

export type QrValidationStatus =
  | 'valid'
  | 'expired'
  | 'already_used'
  | 'no_credits';

export interface QrValidationResult {
  status: QrValidationStatus;
  reason: string;
  minutesSinceLastMeal?: number;
}

export function validateQrRedemption(params: {
  tokenWindow: number;
  currentWindow: number;
  creditsRemaining: number;
  recentRedemptions: MealRedemption[];
  nowMs: number;
  cooldownMinutes?: number;
}): QrValidationResult {
  const {
    tokenWindow,
    currentWindow,
    creditsRemaining,
    recentRedemptions,
    nowMs,
    cooldownMinutes = DUPLICATE_REDEMPTION_COOLDOWN_MINUTES,
  } = params;

  if (creditsRemaining <= 0) {
    return {
      status: 'no_credits',
      reason: 'No meal credits remaining on active pass. Please renew or upgrade your plan.',
    };
  }

  if (Math.abs(currentWindow - tokenWindow) > 1) {
    return {
      status: 'expired',
      reason: 'QR token expired (30-second security window elapsed). Refresh pass to scan again.',
    };
  }

  if (recentRedemptions.length > 0) {
    const latestTs = recentRedemptions.reduce(
      (max, r) => (r.timestamp > max ? r.timestamp : max),
      0,
    );
    const diffMinutes = Math.floor((nowMs - latestTs) / 60000);
    if (diffMinutes < cooldownMinutes && diffMinutes >= 0) {
      const waitMinutes = cooldownMinutes - diffMinutes;
      return {
        status: 'already_used',
        minutesSinceLastMeal: diffMinutes,
        reason: `Duplicate scan blocked: a meal was redeemed ${diffMinutes} min ago. Next credit unlocks in ${waitMinutes} min.`,
      };
    }
  }

  return {
    status: 'valid',
    reason: 'Pass verified! 1 meal credit ready for instant counter redemption.',
  };
}

export interface EateryFilters {
  vegOnly: boolean;
  maxDistanceKm: number;
  minHygiene: number;
  maxBudget: number;
  searchQuery: string;
  openOnly?: boolean;
}

export function filterEateries(
  eateries: PartnerEatery[],
  filters: EateryFilters,
): PartnerEatery[] {
  const q = filters.searchQuery.trim().toLowerCase();
  return eateries.filter((e) => {
    if (filters.vegOnly && !e.isPureVeg) return false;
    if (filters.openOnly && !e.isOpen) return false;
    if (e.distanceKm > filters.maxDistanceKm) return false;
    if (e.hygieneRating < filters.minHygiene) return false;
    if (e.avgPartnerPrice > filters.maxBudget) return false;
    if (q) {
      const matchesName = e.name.toLowerCase().includes(q);
      const matchesCuisine = e.cuisine.toLowerCase().includes(q);
      const matchesSpecial = e.todaySpecial.toLowerCase().includes(q);
      const matchesMenu = e.menu.some((m) => m.name.toLowerCase().includes(q));
      if (!matchesName && !matchesCuisine && !matchesSpecial && !matchesMenu) {
        return false;
      }
    }
    return true;
  });
}

export interface UnitEconomicsResult {
  contributionPerSale: number;
  monthlyRevenue: number;
  totalVariableCost: number;
  grossContribution: number;
  operatingSurplus: number;
  contributionMarginPct: number;
  breakEvenCustomers: number;
}

export function calculateUnitEconomics(
  inputs: UnitEconomicsInputs,
): UnitEconomicsResult {
  const contributionPerSale = inputs.sellingPrice - inputs.variableCost;
  const monthlyRevenue = inputs.sellingPrice * inputs.customers;
  const totalVariableCost = inputs.variableCost * inputs.customers;
  const grossContribution = contributionPerSale * inputs.customers;
  const operatingSurplus = grossContribution - inputs.fixedCost;
  const contributionMarginPct =
    inputs.sellingPrice > 0
      ? Math.round((contributionPerSale / inputs.sellingPrice) * 1000) / 10
      : 0;
  const breakEvenCustomers =
    contributionPerSale > 0
      ? Math.ceil(inputs.fixedCost / contributionPerSale)
      : 0;

  return {
    contributionPerSale,
    monthlyRevenue,
    totalVariableCost,
    grossContribution,
    operatingSurplus,
    contributionMarginPct,
    breakEvenCustomers,
  };
}

export function getScenarioPreset(preset: ScenarioPreset): UnitEconomicsInputs {
  switch (preset) {
    case 'conservative':
      return {
        sellingPrice: 1999,
        variableCost: 1600,
        customers: 80,
        fixedCost: 15000,
      };
    case 'ambitious':
      return {
        sellingPrice: 1999,
        variableCost: 1500,
        customers: 300,
        fixedCost: 20000,
      };
    case 'base':
    default:
      return {
        sellingPrice: 1999,
        variableCost: 1600,
        customers: 150,
        fixedCost: 15000,
      };
  }
}

export function getReferralRewardStatus(referredCount: number): {
  freeMealsEarned: number;
  progressTowardNext: number;
  neededForNext: number;
  tierLabel: string;
} {
  const safeCount = Math.max(0, Math.floor(referredCount));
  const freeMealsEarned = Math.floor(safeCount / 3);
  const progressTowardNext = safeCount % 3;
  const neededForNext = 3 - progressTowardNext;

  let tierLabel = 'Campus Starter';
  if (safeCount >= 9) tierLabel = 'Hostel Ambassador';
  else if (safeCount >= 6) tierLabel = 'Mess Liberator';
  else if (safeCount >= 3) tierLabel = 'Foodie Connector';

  return {
    freeMealsEarned,
    progressTowardNext,
    neededForNext,
    tierLabel,
  };
}

export function applyPlanPurchase(
  currentSub: ActiveSubscription | null,
  plan: SubscriptionPlan,
  nowMs: number,
): ActiveSubscription {
  const rollover = currentSub ? Math.max(0, currentSub.creditsRemaining) : 0;
  const expiryDate = new Date(nowMs + plan.validityDays * 86400000);
  const expiresAtLabel = expiryDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return {
    planId: plan.id,
    planName: plan.name,
    creditsTotal: plan.credits + rollover,
    creditsRemaining: plan.credits + rollover,
    dailyLimit: 2,
    daysLeft: plan.validityDays,
    expiresAtLabel,
    purchasedAt: nowMs,
    amountPaid: plan.price,
  };
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export interface BreakEvenCurvePoint {
  customers: number;
  revenue: number;
  totalCost: number;
  surplus: number;
}

export function generateUnitEconomicsCurve(
  inputs: UnitEconomicsInputs,
): BreakEvenCurvePoint[] {
  const points: BreakEvenCurvePoint[] = [];
  for (let c = 0; c <= 400; c += 50) {
    const revenue = inputs.sellingPrice * c;
    const totalCost = inputs.fixedCost + inputs.variableCost * c;
    points.push({
      customers: c,
      revenue,
      totalCost,
      surplus: revenue - totalCost,
    });
  }
  return points;
}

export function calculateProjectedSemesterSavings(mealsPerMonth: number): {
  campusCraveMonthly: number;
  deliveryMonthly: number;
  monthlySaved: number;
  semesterSaved: number;
} {
  const safeMeals = Math.max(1, Math.min(90, Math.round(mealsPerMonth)));
  const campusCraveMonthly = safeMeals * 53;
  const deliveryMonthly = safeMeals * 195;
  const monthlySaved = deliveryMonthly - campusCraveMonthly;
  return {
    campusCraveMonthly,
    deliveryMonthly,
    monthlySaved,
    semesterSaved: monthlySaved * 5,
  };
}

export function parseNutritionNumber(raw: string, fallback = 0): number {
  const match = String(raw || '').match(/(\d+(?:\.\d+)?)/);
  if (!match) return fallback;
  const value = Number(match[1]);
  return Number.isFinite(value) ? Math.round(value) : fallback;
}

export function getDishNutrition(
  dishName: string,
  eateryId: string,
  eateries: PartnerEatery[],
): { calories: number; protein: number } {
  const normalizedDish = dishName.trim().toLowerCase();
  const eatery = eateries.find((e) => e.id === eateryId);

  if (eatery) {
    const exact = eatery.menu.find(
      (item) => item.name.trim().toLowerCase() === normalizedDish,
    );
    if (exact) {
      return {
        calories: parseNutritionNumber(exact.calories, 550),
        protein: parseNutritionNumber(exact.protein, 18),
      };
    }

    const fuzzy = eatery.menu.find(
      (item) =>
        normalizedDish.includes(item.name.trim().toLowerCase()) ||
        item.name.trim().toLowerCase().includes(normalizedDish),
    );
    if (fuzzy) {
      return {
        calories: parseNutritionNumber(fuzzy.calories, 550),
        protein: parseNutritionNumber(fuzzy.protein, 18),
      };
    }

    if (eatery.menu.length > 0) {
      return {
        calories: parseNutritionNumber(eatery.menu[0].calories, 550),
        protein: parseNutritionNumber(eatery.menu[0].protein, 18),
      };
    }
  }

  for (const spot of eateries) {
    const match = spot.menu.find(
      (item) => item.name.trim().toLowerCase() === normalizedDish,
    );
    if (match) {
      return {
        calories: parseNutritionNumber(match.calories, 550),
        protein: parseNutritionNumber(match.protein, 18),
      };
    }
  }

  return { calories: 550, protein: 18 };
}

export interface PlanNutritionTarget {
  planId: string;
  planName: string;
  mealsPerDayTarget: number;
  targetCalories: number;
  targetProtein: number;
  dailyRdaCalories: number;
  dailyRdaProtein: number;
  dailyPlanCostInr: number;
}

export function getPlanDailyNutritionTarget(
  planId: string,
  plans: SubscriptionPlan[] = [],
): PlanNutritionTarget {
  const dailyRdaCalories = 2200;
  const dailyRdaProtein = 65;

  switch (planId) {
    case 'trial-199':
      return {
        planId,
        planName: '3-Day Trial Pass',
        mealsPerDayTarget: 1.3,
        targetCalories: 780,
        targetProtein: 28,
        dailyRdaCalories,
        dailyRdaProtein,
        dailyPlanCostInr: 66,
      };
    case 'weekly-499':
      return {
        planId,
        planName: '7-Day Meal Pass',
        mealsPerDayTarget: 1.4,
        targetCalories: 840,
        targetProtein: 32,
        dailyRdaCalories,
        dailyRdaProtein,
        dailyPlanCostInr: 71,
      };
    case 'ambitious-3799':
      return {
        planId,
        planName: 'Roommate Duo Bundle',
        mealsPerDayTarget: 2.0,
        targetCalories: 1200,
        targetProtein: 48,
        dailyRdaCalories,
        dailyRdaProtein,
        dailyPlanCostInr: 127,
      };
    case 'monthly-1999':
      return {
        planId,
        planName: 'Monthly Pass',
        mealsPerDayTarget: 1.5,
        targetCalories: 900,
        targetProtein: 36,
        dailyRdaCalories,
        dailyRdaProtein,
        dailyPlanCostInr: 67,
      };
    default: {
      const matched = plans.find((p) => p.id === planId);
      if (matched) {
        const mealsPerDayTarget = Math.max(
          1,
          Math.min(2.5, Math.round((matched.credits / Math.max(1, matched.validityDays)) * 10) / 10),
        );
        return {
          planId: matched.id,
          planName: matched.name,
          mealsPerDayTarget,
          targetCalories: Math.round(mealsPerDayTarget * 580),
          targetProtein: Math.round(mealsPerDayTarget * 24),
          dailyRdaCalories,
          dailyRdaProtein,
          dailyPlanCostInr: Math.round(matched.price / Math.max(1, matched.validityDays)),
        };
      }
      return {
        planId: 'monthly-1999',
        planName: 'Monthly Pass',
        mealsPerDayTarget: 1.5,
        targetCalories: 900,
        targetProtein: 36,
        dailyRdaCalories,
        dailyRdaProtein,
        dailyPlanCostInr: 67,
      };
    }
  }
}

export interface LoggedMealMacro {
  id: string;
  dishName: string;
  eateryName: string;
  eateryId: string;
  timeStr: string;
  calories: number;
  protein: number;
}

export interface WeeklyNutritionDay {
  dateKey: string;
  dayLabel: string;
  shortDate: string;
  isToday: boolean;
  calories: number;
  protein: number;
  mealsCount: number;
  targetCalories: number;
  targetProtein: number;
  dishes: LoggedMealMacro[];
}

export interface WeeklyNutritionSummary {
  days: WeeklyNutritionDay[];
  today: WeeklyNutritionDay;
  weeklyTotalCalories: number;
  weeklyTotalProtein: number;
  weeklyAvgCalories: number;
  weeklyAvgProtein: number;
  totalWeeklyMeals: number;
  proteinGoalDaysMet: number;
  calorieGoalDaysMet: number;
  target: PlanNutritionTarget;
}

function formatLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function buildWeeklyNutritionTrend(params: {
  redemptions: MealRedemption[];
  eateries: PartnerEatery[];
  planId: string;
  plans?: SubscriptionPlan[];
  nowMs?: number;
}): WeeklyNutritionSummary {
  const {
    redemptions,
    eateries,
    planId,
    plans = [],
    nowMs = Date.now(),
  } = params;

  const target = getPlanDailyNutritionTarget(planId, plans);
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const anchor = new Date(nowMs);
  anchor.setHours(0, 0, 0, 0);

  const days: WeeklyNutritionDay[] = [];
  const dayByKey = new Map<string, WeeklyNutritionDay>();

  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(anchor.getTime() - offset * 86400000);
    const dateKey = formatLocalDateKey(d);
    const isToday = offset === 0;
    const dayObj: WeeklyNutritionDay = {
      dateKey,
      dayLabel: isToday ? 'Today' : weekdayNames[d.getDay()],
      shortDate: `${d.getDate()} ${monthNames[d.getMonth()]}`,
      isToday,
      calories: 0,
      protein: 0,
      mealsCount: 0,
      targetCalories: target.targetCalories,
      targetProtein: target.targetProtein,
      dishes: [],
    };
    days.push(dayObj);
    dayByKey.set(dateKey, dayObj);
  }

  for (const r of redemptions) {
    const d = new Date(r.timestamp);
    const key = formatLocalDateKey(d);
    const bucket = dayByKey.get(key);
    if (!bucket) continue;

    const macros = getDishNutrition(r.dishName, r.eateryId, eateries);
    bucket.calories += macros.calories;
    bucket.protein += macros.protein;
    bucket.mealsCount += 1;
    bucket.dishes.push({
      id: r.id,
      dishName: r.dishName,
      eateryName: r.eateryName,
      eateryId: r.eateryId,
      timeStr: r.timeStr,
      calories: macros.calories,
      protein: macros.protein,
    });
  }

  let weeklyTotalCalories = 0;
  let weeklyTotalProtein = 0;
  let totalWeeklyMeals = 0;
  let proteinGoalDaysMet = 0;
  let calorieGoalDaysMet = 0;

  for (const day of days) {
    weeklyTotalCalories += day.calories;
    weeklyTotalProtein += day.protein;
    totalWeeklyMeals += day.mealsCount;
    if (day.protein >= target.targetProtein) proteinGoalDaysMet += 1;
    if (day.calories >= target.targetCalories) calorieGoalDaysMet += 1;
  }

  const activeDays = days.filter((d) => d.mealsCount > 0).length || 1;

  return {
    days,
    today: days[days.length - 1],
    weeklyTotalCalories,
    weeklyTotalProtein,
    weeklyAvgCalories: Math.round(weeklyTotalCalories / activeDays),
    weeklyAvgProtein: Math.round(weeklyTotalProtein / activeDays),
    totalWeeklyMeals,
    proteinGoalDaysMet,
    calorieGoalDaysMet,
    target,
  };
}


