import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// Forzar renderizado dinámico (no pre-renderizar durante build)
export const dynamic = 'force-dynamic'

export async function GET() {
  const results: Record<string, number> = {}
  const startTotal = performance.now()

  // Test 1: Ping simple (sin DB)
  const pingStart = performance.now()
  results.ping_ms = Math.round(performance.now() - pingStart)

  // Test 2: Conexión a DB (primera query)
  const dbConnectStart = performance.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    results.db_connect_ms = Math.round(performance.now() - dbConnectStart)
  } catch {
    results.db_connect_error = -1
  }

  // Test 3: Query simple (count users)
  const queryStart = performance.now()
  try {
    await prisma.user.count()
    results.db_query_simple_ms = Math.round(performance.now() - queryStart)
  } catch {
    results.db_query_simple_error = -1
  }

  // Test 4: Query con índice (findUnique por email)
  const queryIndexStart = performance.now()
  try {
    await prisma.user.findUnique({
      where: { email: "test@test.com" },
      select: { id: true },
    })
    results.db_query_indexed_ms = Math.round(performance.now() - queryIndexStart)
  } catch {
    results.db_query_indexed_error = -1
  }

  // Test 5: bcrypt compare (simula login)
  const bcryptStart = performance.now()
  const testHash = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy" // hash de "password"
  await bcrypt.compare("wrongpassword", testHash)
  results.bcrypt_compare_ms = Math.round(performance.now() - bcryptStart)

  // Test 6: Query compleja (join)
  const complexStart = performance.now()
  try {
    await prisma.tramite.findFirst({
      include: { user: true, pago: true },
    })
    results.db_query_complex_ms = Math.round(performance.now() - complexStart)
  } catch {
    results.db_query_complex_error = -1
  }

  results.total_ms = Math.round(performance.now() - startTotal)

  // Umbrales para análisis (ms)
  const DB_LENTO = 800
  const DB_ACEPTABLE = 300
  const BCRYPT_NORMAL_MAX = 350
  const TOTAL_LENTO = 2000
  const TOTAL_ACEPTABLE = 800

  const dbConnect = results.db_connect_ms ?? 0
  const total = results.total_ms
  const bcryptMs = results.bcrypt_compare_ms ?? 0

  const analysis = {
    conexion_db:
      dbConnect >= DB_LENTO
        ? `Lento (${dbConnect}ms) — cold start DB o pooler lejano`
        : dbConnect >= DB_ACEPTABLE
          ? `Aceptable (${dbConnect}ms)`
          : `Rápido (${dbConnect}ms)`,
    bcrypt:
      bcryptMs > BCRYPT_NORMAL_MAX
        ? `Lento (${bcryptMs}ms) — normal en CPU limitada`
        : `OK (${bcryptMs}ms)`,
    total:
      total >= TOTAL_LENTO
        ? `Lento (${total}ms) — revisar conexión DB y/o cold start`
        : total >= TOTAL_ACEPTABLE
          ? `Aceptable (${total}ms)`
          : `Rápido (${total}ms)`,
    recomendacion:
      total >= TOTAL_LENTO || dbConnect >= DB_LENTO
        ? "Usar connection pooler en DATABASE_URL; considerar warm-up (cron) si es serverless."
        : null,
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    results,
    analysis,
  })
}
