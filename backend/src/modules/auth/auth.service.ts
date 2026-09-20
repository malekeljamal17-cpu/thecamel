import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { signAuthToken } from "../../lib/jwt";
import { HttpError } from "../../middleware/errorHandler";
import { awardBadge, awardPoints } from "../gamification/gamification.service";

export async function signup(input: { email: string; fullName: string; password: string; phone?: string }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new HttpError(409, "An account with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      fullName: input.fullName,
      phone: input.phone,
      passwordHash,
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
