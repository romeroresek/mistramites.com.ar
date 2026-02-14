import { NextResponse } from "next/server"

/**
 * Ping mínimo: no importa Prisma ni bcrypt.
 * Sirve para medir cold start del servidor sin latencia de DB.
 * Comparar con /api/debug/speed-test para ver cuánto aporta la DB.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    t: Date.now(),
    iso: new Date().toISOString(),
  })
}
