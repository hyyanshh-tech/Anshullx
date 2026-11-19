import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyPlanPurchase,
  buildWeeklyNutritionTrend,
  calculateProjectedSemesterSavings,
  calculateSavingsSummary,
  calculateUnitEconomics,
  filterEateries,
  generateDynamicQrToken,
  generateUnitEconomicsCurve,
  getDishNutrition,
  getPlanDailyNutritionTarget,
  getReferralRewardStatus,
  getScenarioPreset,
  parseNutritionNumber,
  validateQrRedemption,
} from './campusCraveLogic';
import type { MealRedemption, PartnerEatery, SubscriptionPlan } from '../types';

const sampleRedemption = (overrides: Partial<MealRedemption> = {}): MealRedemption => ({
  id: 'red-1',
  studentId: 'stu-1',
  studentName: 'Aarav Rawat',
  eateryId: 'e1',
  eateryName: 'Pahadi Rasoi Dhaba',
  dishName: 'Rajma Chawal Thali',
  creditsUsed: 1,
  campusCraveCost: 52,
  deliveryEquivalentCost: 195,
  timestamp: 1_700_000_000_000,
  dateStr: '15 Nov 2026',
  timeStr: '01:15 PM',
  invoiceId: 'INV-1001',
  ...overrides,
});

test('calculateSavingsSummary computes exact savings vs delivery apps', () => {
  const redemptions = [
    sampleRedemption({ campusCraveCost: 50, deliveryEquivalentCost: 200 }),
    sampleRedemption({ id: 'red-2', campusCraveCost: 55, deliveryEquivalentCost: 205 }),
  ];
  const summary = calculateSavingsSummary(redemptions);
  assert.equal(summary.mealsRedeemed, 2);
  assert.equal(summary.totalCampusCraveSpend, 105);
  assert.equal(summary.totalDeliveryEquivalent, 405);
  assert.equal(summary.totalSaved, 300);
  assert.equal(summary.savingsPercent, 74);
});

test('generateDynamicQrToken and validateQrRedemption enforce 30s expiry and duplicate cooldown', () => {
  const now = 1_700_000_000_000;
  const token = generateDynamicQrToken('stu-1', 'monthly-1999', now);
  assert.ok(token.code.startsWith('CC-DBS-'));
  assert.ok(token.secondsLeft >= 1 && token.secondsLeft <= 30);

  // Valid when no recent redemptions
  const validRes = validateQrRedemption({
    tokenWindow: token.windowIndex,
    currentWindow: token.windowIndex,
    creditsRemaining: 10,
    recentRedemptions: [],
    nowMs: now,
  });
  assert.equal(validRes.status, 'valid');

  // Expired when tokenWindow lags behind by > 1 window
  const expiredRes = validateQrRedemption({
    tokenWindow: token.windowIndex - 3,
    currentWindow: token.windowIndex,
    creditsRemaining: 10,
    recentRedemptions: [],
    nowMs: now,
  });
  assert.equal(expiredRes.status, 'expired');

  // Duplicate blocked within 120 minute cooldown
  const dupRes = validateQrRedemption({
    tokenWindow: token.windowIndex,
    currentWindow: token.windowIndex,
    creditsRemaining: 10,
    recentRedemptions: [sampleRedemption({ timestamp: now - 30 * 60000 })],
    nowMs: now,
  });
  assert.equal(dupRes.status, 'already_used');
  assert.equal(dupRes.minutesSinceLastMeal, 30);

  // Allowed after cooldown passes
  const afterCooldownRes = validateQrRedemption({
    tokenWindow: token.windowIndex,
    currentWindow: token.windowIndex,
    creditsRemaining: 10,
    recentRedemptions: [sampleRedemption({ timestamp: now - 130 * 60000 })],
    nowMs: now,
  });
  assert.equal(afterCooldownRes.status, 'valid');
});

test('calculateUnitEconomics matches Base, Conservative, and Ambitious scenarios', () => {
  const base = calculateUnitEconomics(getScenarioPreset('base'));
  assert.equal(base.contributionPerSale, 399);
  assert.equal(base.monthlyRevenue, 299850);
  assert.equal(base.operatingSurplus, 44850);
  assert.equal(base.breakEvenCustomers, 38);

  const conservative = calculateUnitEconomics(getScenarioPreset('conservative'));
  assert.equal(conservative.contributionPerSale, 399);
  assert.equal(conservative.operatingSurplus, 16920);

  const ambitious = calculateUnitEconomics(getScenarioPreset('ambitious'));
  assert.equal(ambitious.contributionPerSale, 499);
  assert.equal(ambitious.monthlyRevenue, 599700);
  assert.equal(ambitious.operatingSurplus, 129700);
});

test('generateUnitEconomicsCurve and calculateProjectedSemesterSavings calculate accurate curves', () => {
  const curve = generateUnitEconomicsCurve(getScenarioPreset('base'));
  assert.equal(curve.length, 9);
  assert.equal(curve[0].customers, 0);
  assert.equal(curve[0].surplus, -15000);
  const at150 = curve.find((p) => p.customers === 150);
  assert.equal(at150?.surplus, 44850);

  const proj = calculateProjectedSemesterSavings(36);
  assert.equal(proj.campusCraveMonthly, 1908);
  assert.equal(proj.deliveryMonthly, 7020);
  assert.equal(proj.monthlySaved, 5112);
  assert.equal(proj.semesterSaved, 25560);
});

test('filterEateries filters by veg, distance, hygiene, budget, and search query', () => {
  const baseEatery = (overrides: Partial<PartnerEatery>): PartnerEatery => ({
    id: 'e1',
    name: 'Test Spot',
    distanceKm: 0.4,
    walkMinutes: 5,
    cuisine: 'North Indian',
    isPureVeg: true,
    hygieneRating: 4.8,
    verified: true,
    avgPartnerPrice: 52,
    isOpen: true,
    openHours: '8 AM - 10 PM',
    rushLevel: 'Low',
    image: '',
    mapPos: { x: 50, y: 50 },
    todaySpecial: 'Dal Tadka',
    rotatingDailyMenu: [],
    menu: [],
    hygieneCard: {
      kitchenSurface: 4.9,
      waterRoPurity: 4.8,
      oilFreshness: 4.7,
      staffGear: 4.8,
      fssaiVerified: true,
      lastAudited: '10 Nov 2026',
    },
    reviews: [],
    ...overrides,
  });

  const list = [
    baseEatery({ id: '1', name: 'Pahadi Rasoi', isPureVeg: false, distanceKm: 0.35 }),
    baseEatery({ id: '2', name: 'South Spice Corner', isPureVeg: true, distanceKm: 0.5, todaySpecial: 'Masala Dosa' }),
    baseEatery({ id: '3', name: 'Far Dhaba', isPureVeg: true, distanceKm: 1.9, hygieneRating: 3.9 }),
  ];

  const vegNear = filterEateries(list, {
    vegOnly: true,
    maxDistanceKm: 1.0,
    minHygiene: 4.5,
    maxBudget: 60,
    searchQuery: 'dosa',
  });
  assert.equal(vegNear.length, 1);
  assert.equal(vegNear[0].id, '2');
});

test('getReferralRewardStatus and applyPlanPurchase update rewards and rollover credits', () => {
  const refStatus = getReferralRewardStatus(5);
  assert.equal(refStatus.freeMealsEarned, 1);
  assert.equal(refStatus.progressTowardNext, 2);
  assert.equal(refStatus.neededForNext, 1);
  assert.equal(refStatus.tierLabel, 'Foodie Connector');

  const plan: SubscriptionPlan = {
    id: 'monthly-1999',
    name: 'Monthly Pass',
    tagline: 'Save 40%',
    price: 1999,
    originalDeliveryEquivalent: 5800,
    credits: 36,
    validityDays: 30,
    perMealCost: 55,
    audience: 'Hostel & PG regulars',
    highlights: [],
  };

  const nextSub = applyPlanPurchase(
    {
      planId: 'trial-199',
      planName: '3-Day Trial Pass',
      creditsTotal: 4,
      creditsRemaining: 2,
      dailyLimit: 2,
      daysLeft: 1,
      expiresAtLabel: '17 Nov 2026',
      purchasedAt: 1_700_000_000_000,
      amountPaid: 199,
    },
    plan,
    1_700_000_000_000,
  );
  assert.equal(nextSub.creditsRemaining, 38);
  assert.equal(nextSub.daysLeft, 30);
});

test('parseNutritionNumber, getDishNutrition, and getPlanDailyNutritionTarget derive accurate macros', () => {
  assert.equal(parseNutritionNumber('640 kcal'), 640);
  assert.equal(parseNutritionNumber('32g protein'), 32);
  assert.equal(parseNutritionNumber('', 500), 500);

  const mockEateries: PartnerEatery[] = [
    {
      id: 'healthy-bowl',
      name: 'Healthy Bowl Kitchen',
      distanceKm: 0.85,
      walkMinutes: 10,
      cuisine: 'Salads',
      isPureVeg: false,
      hygieneRating: 5,
      verified: true,
      avgPartnerPrice: 55,
      isOpen: true,
      openHours: '9 AM - 10 PM',
      rushLevel: 'Low',
      image: '',
      mapPos: { x: 78, y: 72 },
      todaySpecial: 'Roasted Paneer & Chickpea Bowl',
      rotatingDailyMenu: [],
      menu: [
        {
          id: 'hb-1',
          name: 'Roasted Paneer & Chickpea Bowl',
          priceCredits: 1,
          partnerValueInr: 55,
          isVeg: true,
          inStock: true,
          calories: '520 kcal',
          protein: '32g protein',
          description: 'Millet bowl',
        },
      ],
      hygieneCard: {
        kitchenSurface: 5,
        waterRoPurity: 5,
        oilFreshness: 5,
        staffGear: 5,
        fssaiVerified: true,
        lastAudited: '15 Nov 2026',
      },
      reviews: [],
    },
  ];

  const macros = getDishNutrition('Roasted Paneer & Chickpea Bowl', 'healthy-bowl', mockEateries);
  assert.equal(macros.calories, 520);
  assert.equal(macros.protein, 32);

  const trialTarget = getPlanDailyNutritionTarget('trial-199');
  const duoTarget = getPlanDailyNutritionTarget('ambitious-3799');
  assert.equal(trialTarget.targetCalories, 780);
  assert.equal(trialTarget.targetProtein, 28);
  assert.ok(duoTarget.targetCalories > trialTarget.targetCalories);
  assert.ok(duoTarget.targetProtein > trialTarget.targetProtein);
});

test('buildWeeklyNutritionTrend aggregates 7-day calorie and protein totals accurately', () => {
  const now = new Date(2026, 10, 18, 15, 0, 0).getTime();
  const mockEateries: PartnerEatery[] = [
    {
      id: 'healthy-bowl',
      name: 'Healthy Bowl Kitchen',
      distanceKm: 0.85,
      walkMinutes: 10,
      cuisine: 'Salads',
      isPureVeg: false,
      hygieneRating: 5,
      verified: true,
      avgPartnerPrice: 55,
      isOpen: true,
      openHours: '9 AM - 10 PM',
      rushLevel: 'Low',
      image: '',
      mapPos: { x: 78, y: 72 },
      todaySpecial: 'Roasted Paneer & Chickpea Bowl',
      rotatingDailyMenu: [],
      menu: [
        {
          id: 'hb-1',
          name: 'Roasted Paneer & Chickpea Bowl',
          priceCredits: 1,
          partnerValueInr: 55,
          isVeg: true,
          inStock: true,
          calories: '520 kcal',
          protein: '32g protein',
          description: 'Millet bowl',
        },
        {
          id: 'hb-2',
          name: 'Grilled Chicken Macro Bowl',
          priceCredits: 1,
          partnerValueInr: 55,
          isVeg: false,
          inStock: true,
          calories: '540 kcal',
          protein: '41g protein',
          description: 'Chicken bowl',
        },
      ],
      hygieneCard: {
        kitchenSurface: 5,
        waterRoPurity: 5,
        oilFreshness: 5,
        staffGear: 5,
        fssaiVerified: true,
        lastAudited: '15 Nov 2026',
      },
      reviews: [],
    },
  ];

  const redemptions: MealRedemption[] = [
    sampleRedemption({
      id: 'r-today-1',
      eateryId: 'healthy-bowl',
      eateryName: 'Healthy Bowl Kitchen',
      dishName: 'Roasted Paneer & Chickpea Bowl',
      timestamp: now - 2 * 3600000,
    }),
    sampleRedemption({
      id: 'r-today-2',
      eateryId: 'healthy-bowl',
      eateryName: 'Healthy Bowl Kitchen',
      dishName: 'Grilled Chicken Macro Bowl',
      timestamp: now - 1 * 3600000,
    }),
    sampleRedemption({
      id: 'r-two-days-ago',
      eateryId: 'healthy-bowl',
      eateryName: 'Healthy Bowl Kitchen',
      dishName: 'Roasted Paneer & Chickpea Bowl',
      timestamp: now - 2 * 86400000,
    }),
  ];

  const trend = buildWeeklyNutritionTrend({
    redemptions,
    eateries: mockEateries,
    planId: 'monthly-1999',
    nowMs: now,
  });

  assert.equal(trend.days.length, 7);
  assert.equal(trend.today.isToday, true);
  assert.equal(trend.today.calories, 1060);
  assert.equal(trend.today.protein, 73);
  assert.equal(trend.today.mealsCount, 2);
  assert.equal(trend.totalWeeklyMeals, 3);
  assert.equal(trend.weeklyTotalCalories, 1580);
  assert.equal(trend.weeklyTotalProtein, 105);
  assert.equal(trend.proteinGoalDaysMet, 1);
  assert.equal(trend.calorieGoalDaysMet, 1);
});
