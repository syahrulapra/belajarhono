import { PrismaClient } from "@prisma/client"

const globalForPrisma: typeof globalThis & { prisma?: PrismaClient } = global;

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['error']
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}