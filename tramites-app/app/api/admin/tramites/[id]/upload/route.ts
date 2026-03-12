import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { prisma } from "@/lib/prisma"
import { logActivity, ActivityType } from "@/lib/activityLog"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    const tramite = await prisma.tramite.findUnique({
      where: { id },
    })

    if (!tramite) {
      return NextResponse.json({ error: "Trámite no encontrado" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No se envió archivo" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Solo se permiten archivos PDF" }, { status: 400 })
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "El archivo no puede superar los 10 MB" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = `tramites/${id}/${Date.now()}.pdf`

    const { error: uploadError } = await supabaseAdmin.storage
      .from("documentos")
      .upload(fileName, buffer, {
        cacheControl: "31536000",
        contentType: "application/pdf",
        upsert: false,
      })

    if (uploadError) {
      console.error("Error uploading to Supabase:", uploadError)
      return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 })
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("documentos")
      .getPublicUrl(fileName)

    const updatedTramite = await prisma.tramite.update({
      where: { id },
      data: { archivoUrl: urlData.publicUrl },
    })

    // Registrar actividad
    await logActivity({
      tipo: ActivityType.ADMIN_ARCHIVO_SUBIDO,
      accion: `Archivo subido: ${file.name}`,
      userId: (session.user as { id?: string }).id,
      userEmail: session.user?.email,
      userName: session.user?.name,
      tramiteId: id,
      metadata: { fileName: file.name, fileSize: file.size },
    })

    return NextResponse.json({
      success: true,
      archivoUrl: updatedTramite.archivoUrl
    })
  } catch (error) {
    console.error("Error en upload:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    const tramite = await prisma.tramite.findUnique({
      where: { id },
    })

    if (!tramite || !tramite.archivoUrl) {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 })
    }

    // Extract file path from URL
    const urlParts = tramite.archivoUrl.split("/documentos/")
    if (urlParts.length > 1) {
      const filePath = urlParts[1]
      await supabaseAdmin.storage.from("documentos").remove([filePath])
    }

    await prisma.tramite.update({
      where: { id },
      data: { archivoUrl: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error en delete:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
