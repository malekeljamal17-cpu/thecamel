import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { addPaymentMethod, depositFunds, listPaymentMethods, withdrawFunds } from "./payments.service";

export const paymentsRouter = Router();

paymentsRouter.use(requireAuth);

const providerEnum = z.enum(["CARD", "WISH_MONEY", "OMT", "INTERNAL"]);

paymentsRouter.get("/methods", async (req, res, next) => {
  try {
    res.json(await listPaymentMethods(req.user!.sub));
  } catch (err) {
    next(err);
  }
});

const addMethodSchema = z.object({
  provider: providerEnum,
  label: z.string().min(2),
  details: z.record(z.string()),
  isDefault: z.boolean().optional(),
});

paymentsRouter.post("/methods", async (req, res, next) => {
  try {
    const input = addMethodSchema.parse(req.body);
    res.status(201).json(await addPaymentMethod(req.user!.sub, input));
  } catch (err) {
    next(err);
  }
});

const depositSchema = z.object({
  provider: providerEnum,
  amountCents: z.number().int().positive(),
  currency: z.string().optional(),
  payerDetails: z.record(z.string()).optional(),
});

paymentsRouter.post("/deposit", async (req, res, next) => {
  try {
    const input = depositSchema.parse(req.body);
    res.status(201).json(await depositFunds(req.user!.sub, input));
  } catch (err) {
    next(err);
  }
});

const withdrawSchema = z.object({
  provider: providerEnum,
  amountCents: z.number().int().positive(),
  currency: z.string().optional(),
  payoutDetails: z.record(z.string()).optional(),
});

paymentsRouter.post("/withdraw", async (req, res, next) => {
  try {
    const input = withdrawSchema.parse(req.body);
    res.status(201).json(await withdrawFunds(req.user!.sub, input));
  } catch (err) {
    next(err);
  }
});
