import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { contributeToGoal, createGoal, getGoal, listGoals, projectGoal } from "./goals.service";

export const goalsRouter = Router();

goalsRouter.use(requireAuth);

const categoryEnum = z.enum(["EMERGENCY_FUND", "SAVINGS", "TRAVEL", "EDUCATION", "RETIREMENT", "INSURANCE_LINKED", "OTHER"]);

const createGoalSchema = z.object({
  name: z.string().min(2),
  category: categoryEnum.optional(),
  targetAmountCents: z.number().int().positive(),
  targetDate: z.coerce.date().optional(),
});

goalsRouter.get("/", async (req, res, next) => {
  try {
    res.json(await listGoals(req.user!.sub));
  } catch (err) {
    next(err);
  }
});

goalsRouter.post("/", async (req, res, next) => {
  try {
    const input = createGoalSchema.parse(req.body);
    res.status(201).json(await createGoal(req.user!.sub, input));
  } catch (err) {
    next(err);
  }
});

goalsRouter.get("/:id", async (req, res, next) => {
  try {
    res.json(await getGoal(req.user!.sub, req.params.id));
  } catch (err) {
    next(err);
  }
});

goalsRouter.get("/:id/projection", async (req, res, next) => {
  try {
    res.json(await projectGoal(req.user!.sub, req.params.id));
  } catch (err) {
    next(err);
  }
});

const contributeSchema = z.object({ amountCents: z.number().int().positive() });

goalsRouter.post("/:id/contribute", async (req, res, next) => {
  try {
    const { amountCents } = contributeSchema.parse(req.body);
    res.status(201).json(await contributeToGoal(req.user!.sub, req.params.id, amountCents));
  } catch (err) {
    next(err);
  }
});
