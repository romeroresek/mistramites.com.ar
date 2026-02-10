import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const MONTO_PARTIDA = 20000

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await req.json()
    const { tipoPartida, dni, sexo, nombres, apellido, fechaNacimiento, ciudadNacimiento,
      fechaDefuncion, dni2, sexo2, nombres2, apellido2, fechaNacimiento2,
      fechaMatrimonio, ciudadMatrimonio, divorciados } = body

    if (!tipoPartida || !dni || !sexo || !nombres || !apellido || !fechaNacimiento) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const tipoNombre = tipoPartida === "nacimiento" ? "Partida de Nacimiento"
      : tipoPartida === "matrimonio" ? "Partida de Matrimonio"
      : "Partida de Defunción"

    // Crear tramite + partida + pago en una transacción
    const tramite = await prisma.$transaction(async (tx) => {
      const tramite = await tx.tramite.create({
        data: {
          userId: user.id,
          oficina: "Registro de las Personas",
          tipoTramite: tipoNombre,
          descripcion: `Solicitud de ${tipoNombre}`,
          monto: MONTO_PARTIDA,
          estado: "pendiente",
        },
      })

      await tx.partida.create({
        data: {
          tramiteId: tramite.id,
          tipoPartida,
          dni,
          sexo,
          nombres,
          apellido,
          fechaNacimiento: new Date(fechaNacimiento),
          ciudadNacimiento: ciudadNacimiento || null,
          fechaDefuncion: fechaDefuncion ? new Date(fechaDefuncion) : null,
          dni2: dni2 || null,
          sexo2: sexo2 || null,
          nombres2: nombres2 || null,
          apellido2: apellido2 || null,
          fechaNacimiento2: fechaNacimiento2 ? new Date(fechaNacimiento2) : null,
          fechaMatrimonio: fechaMatrimonio ? new Date(fechaMatrimonio) : null,
          ciudadMatrimonio: ciudadMatrimonio || null,
          divorciados: divorciados || false,
        },
      })

      await tx.pago.create({
        data: {
          tramiteId: tramite.id,
          userId: user.id,
          monto: MONTO_PARTIDA,
          estado: "pendiente",
        },
      })

      return tramite
    })

    // Crear preferencia de Mercado Pago
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const webhookUrl = process.env.WEBHOOK_URL

    const preferenceBody: any = {
      items: [
        {
          id: tramite.id,
          title: `${tipoNombre} - Registro de las Personas`,
          quantity: 1,
          unit_price: MONTO_PARTIDA,
          currency_id: "ARS",
        },
      ],
      payer: {
        email: user.email || undefined,
        name: user.name || undefined,
      },
      external_reference: tramite.id,
      back_urls: {
        success: `${baseUrl}/mis-tramites`,
        failure: `${baseUrl}/mis-tramites`,
        pending: `${baseUrl}/mis-tramites`,
      },
    }

    if (webhookUrl) {
      preferenceBody.notification_url = `${webhookUrl}/api/mercadopago/webhook`
    }

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preferenceBody),
    })

    const result = await mpResponse.json()

    if (!mpResponse.ok) {
      console.error("Mercado Pago API Error:", JSON.stringify(result))
      // Igual devolvemos el tramite, el usuario puede pagar desde mis-tramites
      return NextResponse.json({ tramiteId: tramite.id, initPoint: null })
    }

    // Guardar el mercadopagoId en el pago
    await prisma.pago.update({
      where: { tramiteId: tramite.id },
      data: { mercadopagoId: result.id },
    })

    return NextResponse.json({
      tramiteId: tramite.id,
      initPoint: result.init_point,
    })
  } catch (error: any) {
    console.error("Error creando partida:", error?.message)
    return NextResponse.json({ error: "Error al crear la solicitud" }, { status: 500 })
  }
}
