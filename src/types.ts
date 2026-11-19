export type UserRole = 'student' | 'vendor' | 'admin';

export type StudentTab =
  | 'home'
  | 'explore'
  | 'qr'
  | 'buddy'
  | 'hub';

export type HubSubPage =
  | 'menu'
  | 'plans'
  | 'nutrition'
  | 'budget'
  | 'rewards'
  | 'history'
  | 'about';

export interface StudentProfile {
  id: string;
  name: string;
  college: string;
  hostelOrPg: string;
  phone: string;
  isFirstYearHosteller: boolean;
  vegOnly: boolean;
  examMode: boolean;
  monthlyBudgetGoal: number;
  referralCode: string;
  referredFriendsCount: number;
  streakDays: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tagline: string;
  price: number;
  originalDeliveryEquivalent: number;
  credits: number;
  validityDays: number;
  perMealCost: number;
  popular?: boolean;
  audience: string;
  highlights: string[];
}

export interface ActiveSubscription {
  planId: string;
  planName: string;
  creditsTotal: number;
  creditsRemaining: number;
  dailyLimit: number;
  daysLeft: number;
  expiresAtLabel: string;
  purchasedAt: number;
  amountPaid: number;
}

export interface MenuItem {
  id: string;
  name: string;
  priceCredits: number;
  partnerValueInr: number;
  isVeg: boolean;
  isSpecial?: boolean;
  inStock: boolean;
  calories: string;
  protein: string;
  description: string;
}

export interface HygieneScorecard {
  kitchenSurface: number;
  waterRoPurity: number;
  oilFreshness: number;
  staffGear: number;
  fssaiVerified: boolean;
  lastAudited: string;
}

export interface EateryReview {
  id: string;
  studentName: string;
  hostel: string;
  rating: number;
  comment: string;
  dateLabel: string;
}

export interface PartnerEatery {
  id: string;
  name: string;
  distanceKm: number;
  walkMinutes: number;
  cuisine: string;
  isPureVeg: boolean;
  hygieneRating: number;
  verified: boolean;
  avgPartnerPrice: number;
  isOpen: boolean;
  openHours: string;
  rushLevel: 'Low' | 'Moderate' | 'Busy';
  image: string;
  mapPos: { x: number; y: number };
  todaySpecial: string;
  rotatingDailyMenu: { day: string; special: string }[];
  menu: MenuItem[];
  hygieneCard: HygieneScorecard;
  reviews: EateryReview[];
}

export interface MealRedemption {
  id: string;
  studentId: string;
  studentName: string;
  eateryId: string;
  eateryName: string;
  dishName: string;
  creditsUsed: number;
  campusCraveCost: number;
  deliveryEquivalentCost: number;
  timestamp: number;
  dateStr: string;
  timeStr: string;
  rating?: number;
  invoiceId: string;
}

export interface HygieneReport {
  id: string;
  eateryId: string;
  eateryName: string;
  category: string;
  details: string;
  createdAt: number;
  status: 'Under Review' | 'Resolved';
}

export interface InvoiceRecord {
  id: string;
  planName: string;
  amount: number;
  upiApp: 'GPay' | 'PhonePe' | 'Paytm';
  utrNumber: string;
  dateStr: string;
  status: 'Paid';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export interface WeeklyPlanDay {
  day: string;
  lunch: { eatery: string; dish: string; credits: number; tag: string };
  dinner: { eatery: string; dish: string; credits: number; tag: string };
}

export type ScenarioPreset = 'conservative' | 'base' | 'ambitious';

export interface UnitEconomicsInputs {
  sellingPrice: number;
  variableCost: number;
  customers: number;
  fixedCost: number;
}

export interface AssumptionItem {
  id: string;
  title: string;
  hypothesis: string;
  status: 'Untested' | 'Testing' | 'Validated';
  evidence: string;
}
