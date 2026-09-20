export type PaymentProvider = "CARD" | "WISH_MONEY" | "OMT" | "INTERNAL";
export type GoalCategory = "EMERGENCY_FUND" | "SAVINGS" | "TRAVEL" | "EDUCATION" | "RETIREMENT" | "INSURANCE_LINKED" | "OTHER";
export type PolicyType = "LIFE" | "SAVINGS_PLAN" | "LIFE_AND_SAVINGS";
export type BookingStatus = "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  kycStatus: "PENDING" | "VERIFIED" | "REJECTED";
  tier: "FREE" | "PREMIUM";
}

export interface Wallet {
  balanceCents: number;
  currency: string;
}

export interface Badge {
  code: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export interface Gamification {
  points: number;
  level: number;
  currentLevelFloor: number;
  nextLevelCeiling: number | null;
  progressPercent: number;
  currentStreakDays: number;
  longestStreakDays: number;
  badges: Badge[];
}

export interface InsurancePolicy {
  id: string;
  provider: string;
  policyType: PolicyType;
  status: string;
  coverageAmountCents: number;
  premiumAmountCents: number;
  premiumFrequency: string;
  goalId: string | null;
}

export interface Goal {
  id: string;
  name: string;
  category: GoalCategory;
  targetAmountCents: number;
  currentAmountCents: number;
  targetDate: string | null;
  linkedPolicy: InsurancePolicy | null;
}

export interface Advisor {
  id: string;
  name: string;
  title: string;
  bio: string;
  specialties: string;
}

export interface Booking {
  id: string;
  advisorId: string;
  advisor?: Advisor;
  scheduledAt: string;
  durationMinutes: number;
  topic: string;
  status: BookingStatus;
  meetingLink: string | null;
  feeCents: number;
}

export interface Transaction {
  id: string;
  type: string;
  provider: PaymentProvider;
  amountCents: number;
  feeCents: number;
  currency: string;
  status: string;
  createdAt: string;
}

export interface DashboardResponse {
  user: { fullName: string; tier: string; kycStatus: string };
  wallet: Wallet;
  gamification: Gamification;
  goals: Goal[];
  upcomingBooking: Booking | null;
}
