import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { getCurrentUser, login, signup, submitKyc } from "./auth.service";

export const authRouter = Router();

const signupSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  password: z.string().min(8),
  phone: z.string().optional(),
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
