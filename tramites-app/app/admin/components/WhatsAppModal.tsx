"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { MessageCircle, PlusCircle, Pencil } from "lucide-react"
import { generateWhatsAppLink } from "@/lib/contactTemplates"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import type { Tramite, Plantilla } from "./types"
import { getLinkPagoUrl, getWhatsappNumber } from "./types"

interface WhatsAppModalProps {
  tramite: Tramite | null
  plantillas: Plantilla[]
  isMobile: boolean
  onClose: () => void
}

export function WhatsAppModal({ tramite, plantillas, isMobile, onClose }: WhatsAppModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [editandoPlantillaId, setEditandoPlantillaId] = useState<string | null>(null)
  const [editMensaje, setEditMensaje] = useState("")
  const [savingPlantilla, setSavingPlantilla] = useState(false)
  const [whatsappLinkPago, setWhatsappLinkPago] = useState<string | null>(null)
  const [localPlantillas, setLocalPlantillas] = useState(plantillas)

  useEffect(() => {
    setLocalPlantillas(plantillas)
  }, [plantillas])

  useEffect(() => {
    if (!tramite) return
    setEditandoPlantillaId(null)
    setWhatsappLinkPago(getLinkPagoUrl(tramite) || null)
    if (localPlantillas.length > 0) {
      setSelectedTemplate(localPlantillas.find((p) => p.clave === "recordatorioPago")?.clave || localPlantillas[0].clave)
    }
  }, [tramite, localPlantillas])

  const plantillaSeleccionada = localPlantillas.find((p) => p.clave === selectedTemplate)

  const generarMensaje = (plantillaClave: string, t: Tramite): string => {
    const plantilla = localPlantillas.find((p) => p.clave === plantillaClave)
    if (!plantilla) return ""

    const formatFecha = (fecha: string | null | undefined): string => {
      if (!fecha) return ""
      try {
        return new Date(fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
      } catch {
        return ""
      }
    }

    const baseUrl = "https://tramitesmisiones.com.ar"
    const variables: Record<string, string> = {
      nombre: t.partida?.nombres || t.user?.name || "Usuario",
      apellido: t.partida?.apellido || "",
      nombreCompleto: t.partida ? `${t.partida.nombres} ${t.partida.apellido}`.trim() : t.user?.name || "Usuario",
      dni: t.partida?.dni || "",
      sexo: t.partida?.sexo || "",
      fechaNacimiento: formatFecha(t.partida?.fechaNacimiento),
      ciudadNacimiento: t.partida?.ciudadNacimiento || "",
      tipo: t.tipoTramite,
      monto: t.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 }),
      linkPago: whatsappLinkPago || getLinkPagoUrl(t),
      email: t.guestEmail || t.user?.email || "",
      whatsapp: t.whatsapp || t.partida?.whatsapp || "",
      fecha: formatFecha(t.createdAt),
      linkSitio: baseUrl,
      linkMisTramites: `${baseUrl}/mis-tramites`,
      linkActas: `${baseUrl}/actas`,
      linkApostilla: `${baseUrl}/apostilla`,
      linkInmuebles: `${baseUrl}/inmuebles`,
    }

    let mensaje = plantilla.mensaje
    for (const [key, value] of Object.entries(variables)) {
      mensaje = mensaje.replace(new RegExp(`\\{${key}\\}`, "g"), value)
    }
    return mensaje
  }

  const iniciarEdicionPlantilla = () => {
    if (plantillaSeleccionada) {
      setEditandoPlantillaId(plantillaSeleccionada.id)
      setEditMensaje(plantillaSeleccionada.mensaje)
    }
  }

  const cancelarEdicionPlantilla = () => {
    setEditandoPlantillaId(null)
    setEditMensaje("")
  }

  const guardarPlantilla = async () => {
    if (!plantillaSeleccionada || plantillaSeleccionada.id !== editandoPlantillaId) return
    setSavingPlantilla(true)
    try {
      const res = await fetch("/api/admin/plantillas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: plantillaSeleccionada.id,
          nombre: plantillaSeleccionada.nombre,
          mensaje: editMensaje,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setLocalPlantillas((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        setEditandoPlantillaId(null)
        setEditMensaje("")
      }
    } catch (error) {
      console.error(error)
    } finally {
      setSavingPlantilla(false)
    }
  }

  const handleClose = () => {
    setEditandoPlantillaId(null)
    setWhatsappLinkPago(null)
    onClose()
  }

  const whatsappNumber = tramite ? getWhatsappNumber(tramite) : null

  const content = tramite && localPlantillas.length > 0 ? (
    editandoPlantillaId ? (
      <div className="mb-3">
        <label className="text-gray-500 text-sm block mb-1">Editar mensaje de la plantilla &quot;{plantillaSeleccionada?.nombre}&quot;</label>
        <p className="text-xs text-gray-400 mb-1">Variables: {"{nombre}"}, {"{apellido}"}, {"{nombreCompleto}"}, {"{dni}"}, {"{fechaNacimiento}"}, {"{ciudadNacimiento}"}, {"{tipo}"}, {"{monto}"}, {"{linkPago}"}, {"{fecha}"}</p>
        <textarea
          value={editMensaje}
          onChange={(e) => setEditMensaje(e.target.value)}
          rows={4}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-y"
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={guardarPlantilla}
            disabled={savingPlantilla}
            className="min-h-[44px] px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {savingPlantilla ? "Guardando..." : "Guardar"}
          </button>
          <button
            onClick={cancelarEdicionPlantilla}
            disabled={savingPlantilla}
            className="min-h-[44px] px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    ) : (
      <>
        <div className="mb-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <label className="text-gray-500 text-sm">Plantilla</label>
            <div className="flex items-center gap-1">
              <Link
                href="/admin/plantillas"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50"
                title="Agregar plantilla"
                aria-label="Agregar plantilla"
              >
                <PlusCircle className="w-4 h-4" />
              </Link>
              {selectedTemplate !== "_blank" && (
                <button
                  type="button"
                  onClick={iniciarEdicionPlantilla}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                  title="Editar plantilla"
                  aria-label="Editar plantilla"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
          >
            <option value="_blank">Sin mensaje (abrir chat vacío)</option>
            {localPlantillas.map((p) => (
              <option key={p.clave} value={p.clave}>{p.nombre}</option>
            ))}
          </select>
        </div>
        {selectedTemplate !== "_blank" && (
          <div>
            <label className="text-gray-500 text-sm block mb-1">Vista previa</label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 max-h-40 overflow-y-auto">
              {generarMensaje(selectedTemplate, tramite)}
            </div>
          </div>
        )}
      </>
    )
  ) : (
    <p className="text-sm text-gray-500">Cargando plantillas...</p>
  )

  const whatsappLink = tramite && whatsappNumber
    ? generateWhatsAppLink(
        whatsappNumber,
        selectedTemplate === "_blank" ? "" : generarMensaje(selectedTemplate, tramite)
      )
    : "#"

  const headerExtra = tramite && whatsappNumber && (
    <a
      href={generateWhatsAppLink(whatsappNumber, "")}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClose}
      className="inline-flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full hover:bg-green-700"
      title="Abrir chat vacío"
      aria-label="Abrir WhatsApp sin mensaje"
    >
      <MessageCircle className="w-4 h-4" />
    </a>
  )

  if (isMobile) {
    return (
      <Drawer open={!!tramite} onOpenChange={(open) => { if (!open) handleClose() }}>
        <DrawerContent>
          <DrawerHeader>
            <div className="flex items-center justify-between gap-2">
              <DrawerTitle>Enviar WhatsApp</DrawerTitle>
              {headerExtra}
            </div>
            {tramite && (
              <DrawerDescription>
                Para: {tramite.partida?.nombres || tramite.user?.name || "Usuario"} - {whatsappNumber}
              </DrawerDescription>
            )}
          </DrawerHeader>
          <div className="px-4">{content}</div>
          <DrawerFooter>
            {tramite && whatsappNumber && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClose}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 active:bg-green-800"
              >
                <MessageCircle className="w-5 h-5" />
                {selectedTemplate === "_blank" ? "Abrir WhatsApp" : "Enviar por WhatsApp"}
              </a>
            )}
            <button
              onClick={handleClose}
              className="min-h-[44px] px-4 py-3 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={!!tramite} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <DialogTitle>Enviar WhatsApp</DialogTitle>
            {headerExtra}
          </div>
          {tramite && (
            <DialogDescription>
              Para: {tramite.partida?.nombres || tramite.user?.name || "Usuario"} - {whatsappNumber}
            </DialogDescription>
          )}
        </DialogHeader>
        <div>{content}</div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 order-2 sm:order-1"
          >
            Cancelar
          </button>
          {tramite && whatsappNumber && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClose}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 order-1 sm:order-2"
            >
              <MessageCircle className="w-4 h-4" />
              {selectedTemplate === "_blank" ? "Abrir WhatsApp" : "Enviar por WhatsApp"}
            </a>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
