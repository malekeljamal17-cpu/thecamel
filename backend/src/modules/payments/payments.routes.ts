import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { FEATURES } from "../../config/features";
import { HttpError } from "../../middleware/errorHandler";
import { addPaymentMethod, depositFunds, listPaymentMethods, withdrawFunds } from "./payments.service";

export const paymentsRouter = Router();

paymentsRouter.use(requireAuth);

// Phase 1 ships with no wallet: Camel Finance doesn't hold customer funds
// until a licensed banking/e-wallet partner is integrated (see
// docs/PHASED-LAUNCH.md). These two routes are the actual custody
// boundary, so they're the ones gated — adding a payment method label is
// harmless metadata and stays available.
function requireWalletEnabled(_req: unknown, _res: unknown, next: (err?: unknown) => void) {
  if (!FEATURES.walletEnabled) {
    next(new HttpError(403, "Wallet top-ups aren't live yet — Camel Finance is launching with a licensed banking partner first. Check back soon."));
    return;
  }
  next();
}

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

paymentsRouter.post("/deposit", requireWalletEnabled, async (req, res, next) => {
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

paymentsRouter.post("/withdraw", requireWalletEnabled, async (req, res, next) => {
  try {
    const input = withdrawSchema.parse(req.body);
    res.status(201).json(await withdrawFunds(req.user!.sub, input));
  } catch (err) {
    next(err);
  }
});
