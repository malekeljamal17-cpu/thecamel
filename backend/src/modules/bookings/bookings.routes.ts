import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { cancelBooking, confirmBooking, createBooking, listAdvisors, listAvailableSlots, listBookings } from "./bookings.service";

export const bookingsRouter = Router();

bookingsRouter.use(requireAuth);

bookingsRouter.get("/advisors", async (_req, res, next) => {
  try {
    res.json(await listAdvisors());
  } catch (err) {
    next(err);
  }
});

bookingsRouter.get("/advisors/:advisorId/slots", async (req, res, next) => {
  try {
    const date = z.string().parse(req.query.date);
    res.json(await listAvailableSlots(req.params.advisorId, date));
  } catch (err) {
    next(err);
  }
});

bookingsRouter.get("/", async (req, res, next) => {
  try {
    res.json(await listBookings(req.user!.sub));
  } catch (err) {
    next(err);
  }
});

const createBookingSchema = z.object({
  advisorId: z.string(),
  scheduledAt: z.coerce.date(),
  durationMinutes: z.union([z.literal(15), z.literal(30), z.literal(60)]).default(30),
  topic: z.string().min(2),
});

bookingsRouter.post("/", async (req, res, next) => {
  try {
    const input = createBookingSchema.parse(req.body);
    res.status(201).json(await createBooking(req.user!.sub, input));
  } catch (err) {
    next(err);
  }
});

bookingsRouter.post("/:id/confirm", async (req, res, next) => {
  try {
    res.json(await confirmBooking(req.user!.sub, req.params.id));
  } catch (err) {
    next(err);
  }
});

bookingsRouter.post("/:id/cancel", async (req, res, next) => {
  try {
    res.json(await cancelBooking(req.user!.sub, req.params.id));
  } catch (err) {
    next(err);
  }
});
