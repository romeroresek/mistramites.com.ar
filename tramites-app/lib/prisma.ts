import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    // Optimización: no conectar hasta la primera query
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// En desarrollo, reusar la conexión entre hot reloads
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Opcional: pre-conectar para evitar latencia en primera query
// prisma.$connect()
