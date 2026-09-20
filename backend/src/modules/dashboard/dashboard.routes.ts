import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { getDashboardGamification } from "../gamification/gamification.service";
import { getWalletSummary } from "../wallet/wallet.service";
import { listGoals } from "../goals/goals.service";
import { listBookings } from "../bookings/bookings.service";
import { prisma } from "../../lib/prisma";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

// One aggregated call for the mobile app's home screen.
dashboardRouter.get("/", async (req, res, next) => {
  try {
    const userId = req.user!.sub;
    const [wallet, gamification, goals, bookings, user] = await Promise.all([
      getWalletSummary(userId),
      getDashboardGamification(userId),
      listGoals(userId),
      listBookings(userId),
      prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    ]);

    const upcomingBooking = bookings.find((b) => b.status === "CONFIRMED" && b.scheduledAt.getTime() > Date.now());

    res.json({
      user: { fullName: user.fullName, tier: user.tier, kycStatus: user.kycStatus },
      wallet,
      gamification,
      goals,
      upcomingBooking: upcomingBooking ?? null,
    });
  } catch (err) {
    next(err);
  }
});
