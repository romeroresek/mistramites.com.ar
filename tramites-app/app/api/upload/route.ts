import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
]

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    const formData = await request.formData()
    const file = formData.get("file") as File
    const tramiteId = formData.get("tramiteId") as string

    if (!file) {
      return NextResponse.json({ error: "No se envió archivo" }, { status: 400 })
    }

    if (!tramiteId) {
      return NextResponse.json({ error: "tramiteId requerido" }, { status: 400 })
    }

    // Verificar que el trámite existe y pertenece al usuario (logueado o invitado)
    const tramite = await prisma.tramite.findFirst({
      where: session?.user?.email
        ? { id: tramiteId, user: { email: session.user.email } }
        : { id: tramiteId, userId: null }, // invitado: tramite sin usuario registrado
    })

    if (!tramite) {
      return NextResponse.json({ error: "Trámite no encontrado" }, { status: 404 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Solo se permiten archivos PDF, JPG o PNG" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const extension = file.name.split(".").pop() || "pdf"
    const fileName = `solicitudes/${tramiteId}/${Date.now()}.${extension}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from("documentos")
      .upload(fileName, buffer, {
        cacheControl: "31536000",
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Error uploading to Supabase:", uploadError)
      return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 })
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("documentos")
      .getPublicUrl(fileName)

    await prisma.tramite.update({
      where: { id: tramiteId },
      data: { archivoUrl: urlData.publicUrl },
    })

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
    })
  } catch (error) {
    console.error("Error en upload:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
