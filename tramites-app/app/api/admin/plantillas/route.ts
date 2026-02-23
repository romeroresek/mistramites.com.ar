import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Plantillas por defecto
const plantillasDefecto = [
  {
    clave: "tramiteListo",
    nombre: "Trámite listo",
    mensaje: "Hola {nombre}! Tu {tipo} ya está lista para descargar. Ingresá a tu cuenta en mistramites.com.ar para obtenerla.",
  },
  {
    clave: "enProceso",
    nombre: "En proceso",
    mensaje: "Hola {nombre}! Tu solicitud de {tipo} está siendo procesada. Te avisaremos cuando esté lista.",
  },
  {
    clave: "requiereInfo",
    nombre: "Requiere información",
    mensaje: "Hola {nombre}! Necesitamos información adicional para procesar tu trámite. Por favor respondé este mensaje.",
  },
  {
    clave: "recordatorioPago",
    nombre: "Recordatorio de pago",
    mensaje: "Hola {nombre}! Te recordamos que tu solicitud de {tipo} tiene un pago pendiente de ${monto}. Podés pagarlo desde acá: {linkPago}",
  },
  {
    clave: "rechazo",
    nombre: "Problema/Rechazo",
    mensaje: "Hola {nombre}! Lamentamos informarte que hubo un problema con tu solicitud de {tipo}. Por favor contactanos para más información.",
  },
  {
    clave: "confirmacionRecepcion",
    nombre: "Confirmación de recepción",
    mensaje: "Hola {nombre}! Confirmamos que recibimos tu solicitud de {tipo}. Te notificaremos cuando tengamos novedades.",
  },
]

// GET: obtener todas las plantillas
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Obtener plantillas de la BD
    let plantillas = await prisma.plantillaMensaje.findMany({
      orderBy: { createdAt: "asc" },
    })

    // Si no hay plantillas, crear las por defecto
    if (plantillas.length === 0) {
      await prisma.plantillaMensaje.createMany({
        data: plantillasDefecto,
      })
      plantillas = await prisma.plantillaMensaje.findMany({
        orderBy: { createdAt: "asc" },
      })
    }

    return NextResponse.json(plantillas)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al obtener plantillas" }, { status: 500 })
  }
}

// POST: crear una nueva plantilla
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await req.json()
    const { nombre, mensaje, clave } = body

    if (!nombre || !mensaje) {
      return NextResponse.json({ error: "Nombre y mensaje son requeridos" }, { status: 400 })
    }

    // Generar clave única si no se proporciona
    const claveNueva = clave || `custom_${Date.now()}`

    const plantilla = await prisma.plantillaMensaje.create({
      data: {
        clave: claveNueva,
        nombre,
        mensaje,
        activo: true,
      },
    })

    return NextResponse.json(plantilla)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al crear plantilla" }, { status: 500 })
  }
}

// PUT: actualizar una plantilla
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await req.json()
    const { id, nombre, mensaje, activo } = body

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    const plantilla = await prisma.plantillaMensaje.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(mensaje !== undefined && { mensaje }),
        ...(activo !== undefined && { activo }),
      },
    })

    return NextResponse.json(plantilla)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al actualizar plantilla" }, { status: 500 })
  }
}
