import { prisma } from "../../lib/prisma";
import { HttpError } from "../../middleware/errorHandler";
import { FEATURES } from "../../config/features";
import { computePremiumSessionFee } from "../fees/fee.service";
import { awardBadge, awardPoints, recordActivity } from "../gamification/gamification.service";
import { adjustWalletBalance, getWalletByUserId } from "../wallet/wallet.service";
import { CardAdapter } from "../payments/adapters/card.adapter";

const cardAdapter = new CardAdapter();

const BUSINESS_HOURS = { startHour: 9, endHour: 17 }; // 9am–5pm, Beirut time is assumed app-side
const SLOT_MINUTES = 30;

export async function listAdvisors() {
  return prisma.advisor.findMany();
}

export async function listAvailableSlots(advisorId: string, dateIso: string) {
  const advisor = await prisma.advisor.findUnique({ where: { id: advisorId } });
  if (!advisor) throw new HttpError(404, "Advisor not found");

  const day = new Date(dateIso);
  if (Number.isNaN(day.getTime())) throw new HttpError(400, "Invalid date");

  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);

  const existingBookings = await prisma.booking.findMany({
    where: {
      advisorId,
      scheduledAt: { gte: dayStart, lte: dayEnd },
      status: { in: ["REQUESTED", "CONFIRMED"] },
    },
  });
  const takenTimes = new Set(existingBookings.map((b) => b.scheduledAt.toISOString()));

  const slots: string[] = [];
  for (let hour = BUSINESS_HOURS.startHour; hour < BUSINESS_HOURS.endHour; hour++) {
    for (let minute = 0; minute < 60; minute += SLOT_MINUTES) {
      const slot = new Date(day);
      slot.setHours(hour, minute, 0, 0);
      if (slot.getTime() < Date.now()) continue;
      if (!takenTimes.has(slot.toISOString())) slots.push(slot.toISOString());
    }
  }

  return slots;
}

export async function createBooking(userId: string, input: { advisorId: string; scheduledAt: Date; durationMinutes: number; topic: string }) {
  const advisor = await prisma.advisor.findUnique({ where: { id: input.advisorId } });
  if (!advisor) throw new HttpError(404, "Advisor not found");

  if (input.scheduledAt.getTime() < Date.now()) throw new HttpError(400, "Cannot book a slot in the past");

  const conflict = await prisma.booking.findFirst({
    where: { advisorId: input.advisorId, scheduledAt: input.scheduledAt, status: { in: ["REQUESTED", "CONFIRMED"] } },
  });
  if (conflict) throw new HttpError(409, "That slot was just taken — please pick another");

  const feeQuote = computePremiumSessionFee(input.durationMinutes);

  const booking = await prisma.booking.create({
    data: {
      userId,
      advisorId: input.advisorId,
      scheduledAt: input.scheduledAt,
      durationMinutes: input.durationMinutes,
      topic: input.topic,
      feeCents: feeQuote.feeCents,
      status: "REQUESTED",
    },
  });

  await recordActivity(userId);

  return booking;
}

export async function confirmBooking(userId: string, bookingId: string, cardDetails?: Record<string, string>) {
  const booking = await getOwnedBooking(userId, bookingId);
  if (booking.status !== "REQUESTED") throw new HttpError(400, `Booking is already ${booking.status.toLowerCase()}`);

  const wallet = await getWalletByUserId(userId);

  if (FEATURES.walletEnabled) {
    // Phase 2: fund it from the (partner-held) wallet balance, same as any
    // other wallet debit.
    if (wallet.balanceCents < booking.feeCents) throw new HttpError(400, "Insufficient balance to confirm coaching session");
    await adjustWalletBalance(wallet.id, -booking.feeCents);

    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: "PREMIUM_SESSION",
        provider: "INTERNAL",
        amountCents: booking.feeCents,
        feeCents: booking.feeCents,
        currency: wallet.currency,
        status: "COMPLETED",
        interactionLevel: "PREMIUM_HUMAN",
        bookingId: booking.id,
      },
    });
  } else {
    // Phase 1: no wallet to debit, so the coaching-session fee is a direct,
    // one-off card charge — ordinary merchant payment processing, which
    // (unlike holding a customer balance) doesn't require an e-money
    // license. See docs/PHASED-LAUNCH.md.
    const result = await cardAdapter.charge({
      amountCents: booking.feeCents,
      currency: wallet.currency,
      reference: booking.id,
      payerDetails: cardDetails ?? {},
    });
    if (!result.success) throw new HttpError(402, result.failureReason ?? "Card payment failed");

    await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: "PREMIUM_SESSION",
        provider: "CARD",
        amountCents: booking.feeCents,
        feeCents: 0,
        currency: wallet.currency,
        status: "COMPLETED",
        interactionLevel: "PREMIUM_HUMAN",
        bookingId: booking.id,
        externalRef: result.externalRef,
        metadata: JSON.stringify(result.rawResponse),
      },
    });
  }

  const confirmed = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CONFIRMED", meetingLink: `https://meet.camelfinance.app/session/${booking.id}` },
  });

  await awardBadge(userId, "PREMIUM_MEMBER");
  await awardPoints(userId, 25, "Booked a coaching session");
  await recordActivity(userId);

  return confirmed;
}

export async function cancelBooking(userId: string, bookingId: string) {
  const booking = await getOwnedBooking(userId, bookingId);
  if (booking.status === "CANCELLED" || booking.status === "COMPLETED") {
    throw new HttpError(400, `Booking is already ${booking.status.toLowerCase()}`);
  }

  if (booking.status === "CONFIRMED") {
    if (FEATURES.walletEnabled) {
      const wallet = await getWalletByUserId(userId);
      await adjustWalletBalance(wallet.id, booking.feeCents); // refund the session fee
    }
    // Phase 1: the fee was a direct card charge, not a wallet credit, so
    // there's no balance to refund here — a real cancellation would call
    // the card processor's refund API, which isn't modeled in the mock
    // adapter yet.
  }

  return prisma.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED" } });
}

export async function listBookings(userId: string) {
  return prisma.booking.findMany({ where: { userId }, include: { advisor: true }, orderBy: { scheduledAt: "asc" } });
}

async function getOwnedBooking(userId: string, bookingId: string) {
  const booking = await prisma.booking.findFirst({ where: { id: bookingId, userId } });
  if (!booking) throw new HttpError(404, "Booking not found");
  return booking;
}
