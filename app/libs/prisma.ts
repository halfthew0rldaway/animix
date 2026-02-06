import { PrismaClient } from "@prisma/client";

const useDatabase = process.env.USE_DATABASE === "true";

type GlobalPrisma = typeof globalThis & { prisma?: PrismaClient };

let prisma: PrismaClient | null = null;
if (useDatabase) {
  const globalForPrisma = globalThis as GlobalPrisma;
  prisma = globalForPrisma.prisma ?? new PrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }
}

export { prisma, useDatabase };
