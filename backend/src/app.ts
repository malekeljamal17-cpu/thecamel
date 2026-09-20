import cors from "cors";
import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authRouter } from "./modules/auth/auth.routes";
import { walletRouter } from "./modules/wallet/wallet.routes";
import { paymentsRouter } from "./modules/payments/payments.routes";
import { gamificationRouter } from "./modules/gamification/gamification.routes";
import { goalsRouter } from "./modules/goals/goals.routes";
import { insuranceRouter } from "./modules/insurance/insurance.routes";
import { bookingsRouter } from "./modules/bookings/bookings.routes";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/auth", authRouter);
  app.use("/wallet", walletRouter);
  app.use("/payments", paymentsRouter);
  app.use("/gamification", gamificationRouter);
  app.use("/goals", goalsRouter);
  app.use("/insurance", insuranceRouter);
  app.use("/bookings", bookingsRouter);
  app.use("/dashboard", dashboardRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
