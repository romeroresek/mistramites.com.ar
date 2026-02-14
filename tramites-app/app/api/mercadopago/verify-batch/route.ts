import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function verifyTramitePayment(tramiteId: string) {
  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/search?external_reference=${tramiteId}&sort=date_created&criteria=desc&limit=1`,
    {
      headers: {
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
    }
  )
  const searchData = await response.json()
  if (!searchData.results?.length) return null
  return searchData.results[0]
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await req.json()
    const { tramiteIds } = body as { tramiteIds: string[] }

    if (!Array.isArray(tramiteIds) || tramiteIds.length === 0) {
      return NextResponse.json({ updated: false, results: [] })
    }

    // Limitar a 20 trámites por request
    const ids = tramiteIds.slice(0, 20)

    // Verificar todos en paralelo
    const results = await Promise.all(
      ids.map(async (tramiteId) => {
        try {
          const paymentData = await verifyTramitePayment(tramiteId)
          if (!paymentData?.external_reference) return { tramiteId, updated: false }

          let pagoEstado = "pendiente"
          let tramiteEstado = "pendiente"
          switch (paymentData.status) {
            case "approved":
              pagoEstado = "confirmado"
              tramiteEstado = "en_proceso"
              break
            case "rejected":
            case "cancelled":
              pagoEstado = "rechazado"
              break
          }

          const payer = paymentData.payer
          const payerEmail = payer?.email || null
          const payerName = payer?.first_name && payer?.last_name
            ? `${payer.first_name} ${payer.last_name}`
            : payer?.first_name || null
          const payerDni = payer?.identification?.number || null
          const paymentMethod = paymentData.payment_method_id || null
          const paymentDate = paymentData.date_approved ? new Date(paymentData.date_approved) : null

          await prisma.pago.update({
            where: { tramiteId },
            data: {
              estado: pagoEstado,
              paymentId: String(paymentData.id),
              payerEmail,
              payerName,
              payerDni,
              paymentMethod,
              paymentDate,
            },
          })

          if (paymentData.status === "approved") {
            await prisma.tramite.update({
              where: { id: tramiteId },
              data: { estado: tramiteEstado },
            })
          }

          return { tramiteId, updated: true, pagoEstado }
        } catch {
          return { tramiteId, updated: false }
        }
      })
    )

    const anyUpdated = results.some((r) => r.updated)
    return NextResponse.json({ updated: anyUpdated, results })
  } catch (error: unknown) {
    console.error("Error verify-batch:", error)
    return NextResponse.json({ error: "Error al verificar pagos" }, { status: 500 })
  }
}
