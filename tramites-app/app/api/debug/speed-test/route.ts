import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

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
  } catch (e) {
    results.db_connect_error = -1
  }

  // Test 3: Query simple (count users)
  const queryStart = performance.now()
  try {
    await prisma.user.count()
    results.db_query_simple_ms = Math.round(performance.now() - queryStart)
  } catch (e) {
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
  } catch (e) {
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
  } catch (e) {
    results.db_query_complex_error = -1
  }

  results.total_ms = Math.round(performance.now() - startTotal)

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    results,
    analysis: {
      db_latency: results.db_connect_ms > 500 ? "LENTO (cold start?)" : "OK",
      bcrypt: results.bcrypt_compare_ms > 200 ? "Normal (100-300ms esperado)" : "Rápido",
      overall: results.total_ms > 1000 ? "Revisar conexión DB" : "OK",
    },
  })
}
