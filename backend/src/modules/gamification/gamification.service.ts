import { prisma } from "../../lib/prisma";
import { levelForPoints, levelProgress } from "./badges";

const oneDayMs = 24 * 60 * 60 * 1000;

export async function awardPoints(userId: string, points: number, reason: string) {
  await prisma.pointsEntry.create({ data: { userId, points, reason } });

  const user = await prisma.user.update({
    where: { id: userId },
    data: { points: { increment: points } },
  });

  const newLevel = levelForPoints(user.points);
  if (newLevel !== user.level) {
    await prisma.user.update({ where: { id: userId }, data: { level: newLevel } });
  }
}

/** Call once per "meaningful" user action per day to drive the streak. */
export async function recordActivity(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const now = new Date();

  let currentStreakDays = user.currentStreakDays;
  if (!user.lastActivityAt) {
    currentStreakDays = 1;
  } else {
    const daysSinceLast = Math.floor((now.getTime() - user.lastActivityAt.getTime()) / oneDayMs);
    if (daysSinceLast === 0) {
      // already counted today
      return;
    } else if (daysSinceLast === 1) {
      currentStreakDays += 1;
    } else {
      currentStreakDays = 1; // streak broken
    }
  }

  const longestStreakDays = Math.max(user.longestStreakDays, currentStreakDays);

  await prisma.user.update({
    where: { id: userId },
    data: { currentStreakDays, longestStreakDays, lastActivityAt: now },
  });

  if (currentStreakDays === 7) await awardBadge(userId, "STREAK_7");
  if (currentStreakDays === 30) await awardBadge(userId, "STREAK_30");
}

export async function awardBadge(userId: string, code: string) {
  const badge = await prisma.badge.findUnique({ where: { code } });
  if (!badge) return;

  const existing = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
  });
  if (existing) return;

  await prisma.userBadge.create({ data: { userId, badgeId: badge.id } });
  if (badge.pointsReward > 0) {
    await awardPoints(userId, badge.pointsReward, `Badge earned: ${badge.name}`);
  }
}

export async function getDashboardGamification(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { userBadges: { include: { badge: true }, orderBy: { earnedAt: "desc" } } },
  });

  return {
    points: user.points,
    ...levelProgress(user.points),
    currentStreakDays: user.currentStreakDays,
    longestStreakDays: user.longestStreakDays,
    badges: user.userBadges.map((ub) => ({
      code: ub.badge.code,
      name: ub.badge.name,
      description: ub.badge.description,
      icon: ub.badge.icon,
      earnedAt: ub.earnedAt,
    })),
  };
}
