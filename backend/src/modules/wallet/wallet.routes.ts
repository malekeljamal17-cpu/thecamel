import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { getTransactionHistory, getWalletSummary } from "./wallet.service";

export const walletRouter = Router();

walletRouter.use(requireAuth);

walletRouter.get("/", async (req, res, next) => {
  try {
    res.json(await getWalletSummary(req.user!.sub));
  } catch (err) {
    next(err);
  }
});

walletRouter.get("/transactions", async (req, res, next) => {
  try {
    res.json(await getTransactionHistory(req.user!.sub));
  } catch (err) {
    next(err);
  }
});
