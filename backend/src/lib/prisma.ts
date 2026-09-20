import { PrismaClient } from "@prisma/client";

// Single shared client so we don't exhaust connections across hot reloads.
export const prisma = new PrismaClient();
