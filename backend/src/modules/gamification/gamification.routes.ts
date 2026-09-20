import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { getDashboardGamification } from "./gamification.service";

export const gamificationRouter = Router();

gamificationRouter.use(requireAuth);

gamificationRouter.get("/me", async (req, res, next) => {
  try {
    const summary = await getDashboardGamification(req.user!.sub);
    res.json(summary);
  } catch (err) {
    next(err);
  }
});
