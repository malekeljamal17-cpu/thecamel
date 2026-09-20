import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { BADGE_CATALOG } from "../src/modules/gamification/badges";
import { ADVISOR_CATALOG } from "../src/modules/bookings/advisors";

const prisma = new PrismaClient();

async function main() {
  for (const badge of BADGE_CATALOG) {
    await prisma.badge.upsert({
      where: { code: badge.code },
      update: badge,
      create: badge,
    });
  }

  for (const advisor of ADVISOR_CATALOG) {
    const existing = await prisma.advisor.findFirst({ where: { name: advisor.name } });
    if (!existing) await prisma.advisor.create({ data: advisor });
  }

  const demoEmail = "demo@camelfinance.app";
  const existingDemo = await prisma.user.findUnique({ where: { email: demoEmail } });
  if (!existingDemo) {
    const passwordHash = await bcrypt.hash("password123", 10);
    await prisma.user.create({
      data: {
        email: demoEmail,
        fullName: "Demo User",
        kycStatus: "VERIFIED",
        passwordHash,
        points: 120,
        level: 2,
        wallet: { create: { balanceCents: 25_000, currency: "USD" } },
        goals: {
          create: [
            {
              name: "Emergency Fund",
              category: "EMERGENCY_FUND",
              targetAmountCents: 300_000,
              currentAmountCents: 80_000,
              targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180),
            },
            {
              name: "Retirement Nest Egg",
              category: "RETIREMENT",
              targetAmountCents: 5_000_000,
              currentAmountCents: 150_000,
            },
          ],
        },
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
