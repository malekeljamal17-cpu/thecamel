import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { deleteAccount, exportMyData, getCurrentUser, login, signup, submitKyc } from "./auth.service";

export const authRouter = Router();

const signupSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  password: z.string().min(8),
  phone: z.string().optional(),
  // Law 81/2018's declaration-exemption (Art. 94) turns on this consent
  // existing — see docs/PRIVACY-AUDIT.md. Must be explicitly true, not
  // just truthy/omitted.
  privacyConsent: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Privacy Policy to create an account." }),
  }),
});

authRouter.post("/signup", async (req, res, next) => {
  try {
    const input = signupSchema.parse(req.body);
    const result = await signup(input);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await login(input);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    res.json(await getCurrentUser(req.user!.sub));
  } catch (err) {
    next(err);
  }
});

authRouter.post("/kyc/submit", requireAuth, async (req, res, next) => {
  try {
    const user = await submitKyc(req.user!.sub);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Law 81/2018, Art. 99 — the user's own copy of everything the app holds on them.
authRouter.get("/me/export", requireAuth, async (req, res, next) => {
  try {
    res.json(await exportMyData(req.user!.sub));
  } catch (err) {
    next(err);
  }
});

// Law 81/2018, Art. 101 — permanently deletes the account and every row it owns.
authRouter.delete("/me", requireAuth, async (req, res, next) => {
  try {
    await deleteAccount(req.user!.sub);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
