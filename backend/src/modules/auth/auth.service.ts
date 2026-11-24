import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { signAuthToken } from "../../lib/jwt";
import { HttpError } from "../../middleware/errorHandler";
import { awardBadge, awardPoints } from "../gamification/gamification.service";

export async function signup(input: { email: string; fullName: string; password: string; phone?: string; privacyConsent: true }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new HttpError(409, "An account with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      fullName: input.fullName,
      phone: input.phone,
      passwordHash,
      privacyConsentAt: new Date(),
      wallet: { create: { balanceCents: 0, currency: "USD" } },
    },
  });

  await awardPoints(user.id, 20, "Account created");

  return {
    token: signAuthToken({ sub: user.id, email: user.email }),
    user: toPublicUser(user),
  };
}

export async function login(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw new HttpError(401, "Invalid email or password");

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new HttpError(401, "Invalid email or password");

  return {
    token: signAuthToken({ sub: user.id, email: user.email }),
    user: toPublicUser(user),
  };
}

/**
 * In production this triggers a real KYC flow (ID document capture + liveness
 * check via a vendor such as Sumsub/Onfido, required by BDL/AML regulation
 * for any regulated financial service in Lebanon). Here it's a manual
 * self-attestation stub so the rest of the app has a KYC gate to build
 * against.
 */
export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return toPublicUser(user);
}

export async function submitKyc(userId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { kycStatus: "VERIFIED" },
  });

  await awardBadge(userId, "FIRST_STEP");

  return toPublicUser(user);
}

/**
 * Law 81/2018, Art. 99 (access). Returns everything the app holds on this
 * user, excluding passwordHash, in one JSON document. Deliberately a plain
 * object rather than anything paginated/streamed — if this account's data
 * ever gets big enough that this endpoint is a problem, that's a signal to
 * revisit retention (docs/PRIVACY-AUDIT.md), not to add pagination here.
 */
export async function exportMyData(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      wallet: { include: { transactions: { orderBy: { createdAt: "desc" } } } },
      paymentMethods: true,
      goals: { include: { linkedPolicy: true } },
      policies: true,
      bookings: { include: { advisor: true } },
      userBadges: { include: { badge: true } },
      pointsLedger: { orderBy: { createdAt: "desc" } },
    },
  });

  const { passwordHash, ...safeUser } = user;
  return { exportedAt: new Date().toISOString(), account: safeUser };
}

/**
 * Law 81/2018, Art. 101 (erasure). Deletes every row this account owns.
 * Deletion order matters — a row has to go before anything with a foreign
 * key still pointing at it — so this walks the dependency graph leaves
 * first, inside one transaction so a failure partway through never leaves
 * the account half-deleted. Shared rows the account merely references
 * (Advisor, Badge) are untouched.
 */
export async function deleteAccount(userId: string) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });

  await prisma.$transaction([
    prisma.pointsEntry.deleteMany({ where: { userId } }),
    prisma.userBadge.deleteMany({ where: { userId } }),
    prisma.paymentMethod.deleteMany({ where: { userId } }),
    ...(wallet ? [prisma.transaction.deleteMany({ where: { walletId: wallet.id } })] : []),
    prisma.insurancePolicy.deleteMany({ where: { userId } }),
    prisma.booking.deleteMany({ where: { userId } }),
    prisma.goal.deleteMany({ where: { userId } }),
    ...(wallet ? [prisma.wallet.delete({ where: { id: wallet.id } })] : []),
    prisma.user.delete({ where: { id: userId } }),
  ]);
}

function toPublicUser(user: {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  kycStatus: string;
  tier: string;
}) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    kycStatus: user.kycStatus,
    tier: user.tier,
  };
}
