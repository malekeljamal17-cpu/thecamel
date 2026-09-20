export interface BadgeDefinition {
  code: string;
  name: string;
  description: string;
  icon: string;
  pointsReward: number;
}

// Seeded into the Badge table; referenced by code from anywhere business
// logic wants to award one (see gamification.service#awardBadge).
export const BADGE_CATALOG: BadgeDefinition[] = [
  { code: "FIRST_STEP", name: "First Step", description: "Completed sign-up and KYC.", icon: "🪪", pointsReward: 50 },
  { code: "FIRST_DEPOSIT", name: "First Deposit", description: "Added money to your wallet for the first time.", icon: "💰", pointsReward: 50 },
  { code: "GOAL_SETTER", name: "Goal Setter", description: "Created your first savings goal.", icon: "🎯", pointsReward: 30 },
  { code: "GOAL_ACHIEVER", name: "Goal Achiever", description: "Reached 100% of a savings goal.", icon: "🏆", pointsReward: 200 },
  { code: "STREAK_7", name: "Consistent Saver", description: "7-day activity streak.", icon: "🔥", pointsReward: 75 },
  { code: "STREAK_30", name: "Unstoppable", description: "30-day activity streak.", icon: "🚀", pointsReward: 300 },
  { code: "PROTECTED", name: "Protected", description: "Linked a life/savings insurance policy to a goal.", icon: "🛡️", pointsReward: 150 },
  { code: "PREMIUM_MEMBER", name: "Premium Member", description: "Booked your first session with a human advisor.", icon: "⭐", pointsReward: 100 },
  { code: "FREQUENT_SAVER", name: "Frequent Saver", description: "Made 10 goal contributions.", icon: "📈", pointsReward: 100 },
];

// Points required (cumulative) to reach a given level. Level = index + 1.
export const LEVEL_THRESHOLDS = [0, 100, 300, 700, 1500, 3000, 6000, 12000];

export function levelForPoints(points: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (points >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

export function levelProgress(points: number): { level: number; currentLevelFloor: number; nextLevelCeiling: number | null; progressPercent: number } {
  const level = levelForPoints(points);
  const currentLevelFloor = LEVEL_THRESHOLDS[level - 1];
  const nextLevelCeiling = LEVEL_THRESHOLDS[level] ?? null;

  if (nextLevelCeiling === null) {
    return { level, currentLevelFloor, nextLevelCeiling, progressPercent: 100 };
  }

  const progressPercent = Math.round(((points - currentLevelFloor) / (nextLevelCeiling - currentLevelFloor)) * 100);
  return { level, currentLevelFloor, nextLevelCeiling, progressPercent };
}
