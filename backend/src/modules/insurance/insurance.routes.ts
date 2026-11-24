import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { linkPolicyToGoal, listPolicies, payPremium, proposePolicy, requestReferral } from "./insurance.service";

export const insuranceRouter = Router();

insuranceRouter.use(requireAuth);

const policyTypeEnum = z.enum(["LIFE", "SAVINGS_PLAN", "LIFE_AND_SAVINGS"]);
const frequencyEnum = z.enum(["MONTHLY", "QUARTERLY", "ANNUALLY"]);

const proposeSchema = z.object({
  provider: z.string().min(2),
  policyType: policyTypeEnum,
  coverageAmountCents: z.number().int().positive(),
  premiumAmountCents: z.number().int().positive(),
  premiumFrequency: frequencyEnum.optional(),
  startDate: z.coerce.date().optional(),
  maturityDate: z.coerce.date().optional(),
});

insuranceRouter.get("/", async (req, res, next) => {
  try {
    res.json(await listPolicies(req.user!.sub));
  } catch (err) {
    next(err);
  }
});

insuranceRouter.post("/", async (req, res, next) => {
  try {
    const input = proposeSchema.parse(req.body);
    res.status(201).json(await proposePolicy(req.user!.sub, input));
  } catch (err) {
    next(err);
  }
});

// Phase 1: this is a lead handoff to the insurer, not a purchase — see the
// docblock in insurance.service.ts.
insuranceRouter.post("/:id/request-referral", async (req, res, next) => {
  try {
    res.json(await requestReferral(req.user!.sub, req.params.id));
  } catch (err) {
    next(err);
  }
});

const linkSchema = z.object({ goalId: z.string() });

insuranceRouter.post("/:id/link-goal", async (req, res, next) => {
  try {
    const { goalId } = linkSchema.parse(req.body);
    res.json(await linkPolicyToGoal(req.user!.sub, req.params.id, goalId));
  } catch (err) {
    next(err);
  }
});

insuranceRouter.post("/:id/pay-premium", async (req, res, next) => {
  try {
    res.status(201).json(await payPremium(req.user!.sub, req.params.id));
  } catch (err) {
    next(err);
  }
});
