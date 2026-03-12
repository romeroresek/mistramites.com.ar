"use client"

import React, { useState, useEffect, useRef } from "react"
import { useToast } from "@/components/Toast"
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
import { getLinkPagoUrl, type Tramite } from "./types"

interface ClienteDataModalProps {
  tramiteId: string | null
  initialPaymentLink: string | null
  initialTramite?: Tramite | null
  isMobile: boolean
  onClose: () => void
  onSaved: () => void
}

export function ClienteDataModal({
  tramiteId,
  initialPaymentLink,
  initialTramite = null,
  isMobile,
  onClose,
  onSaved,
}: ClienteDataModalProps) {
  const toast = useToast()
  const [form, setForm] = useState({ email: "", whatsapp: "" })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [paymentLink, setPaymentLink] = useState<string | null>(initialPaymentLink)
  const [copiedLink, setCopiedLink] = useState(false)
  const formEditado = useRef(false)

  useEffect(() => {
    setPaymentLink(initialPaymentLink || (initialTramite ? getLinkPagoUrl(initialTramite) : null))
  }, [initialPaymentLink, initialTramite])

  useEffect(() => {
    if (!tramiteId) return
    formEditado.current = false
    if (initialTramite?.id === tramiteId) {
      setForm({
        email: initialTramite.guestEmail || initialTramite.user?.email || "",
        whatsapp: initialTramite.whatsapp || initialTramite.partida?.whatsapp || "",
      })
      setPaymentLink((prev) => prev || getLinkPagoUrl(initialTramite) || null)
      setLoading(false)
      return
    }

    setLoading(true)
    fetch(`/api/admin/tramites/${tramiteId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((t: Tramite | null) => {
        if (t && !formEditado.current) {
          setForm({
            email: t.guestEmail || t.user?.email || "",
            whatsapp: t.whatsapp || t.partida?.whatsapp || "",
          })
          setPaymentLink((prev) => prev || getLinkPagoUrl(t) || null)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tramiteId, initialTramite])

  const guardar = async () => {
    if (!tramiteId) return
    setSaving(true)
    const email = form.email?.trim() || null
    try {
      const res = await fetch(`/api/admin/tramites/${tramiteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestEmail: email }),
      })
      if (res.ok) {
        onSaved()
        onClose()
        toast.showSuccess("Datos del cliente guardados")
      } else {
        const err = await res.json().catch(() => ({}))
        toast.showError(err?.error || "No se pudieron guardar los datos")
      }
    } catch (error) {
      console.error(error)
      toast.showError("Error al guardar. Intentá de nuevo.")
    } finally {
      setSaving(false)
    }
  }

  const copiarLink = () => {
    if (!paymentLink) return
    navigator.clipboard.writeText(paymentLink).then(() => {
      setCopiedLink(true)
      toast.showSuccess("Link copiado al portapapeles")
      setTimeout(() => setCopiedLink(false), 2000)
    })
  }

  const handleClose = () => {
    setCopiedLink(false)
    onClose()
  }

  const formContent = loading ? (
    <p className="text-sm text-gray-500 py-4">Cargando...</p>
  ) : (
    <div className="space-y-4">
      <div>
        <label htmlFor={`creado-email-${isMobile ? "m" : "d"}`} className="text-gray-700 text-sm block mb-1">
          Email del cliente
        </label>
        <input
          id={`creado-email-${isMobile ? "m" : "d"}`}
          type="email"
          value={form.email}
          onChange={(e) => {
            formEditado.current = true
            setForm((f) => ({ ...f, email: e.target.value }))
          }}
          placeholder="cliente@ejemplo.com"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
        />
      </div>
      {paymentLink && (
        <div>
          <label className="text-gray-700 text-sm block mb-1">Link de pago (MercadoPago)</label>
          <div className="flex gap-2">
            <input
              readOnly
              value={paymentLink}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 truncate"
              title={paymentLink}
            />
            <button
              type="button"
              onClick={copiarLink}
              className="min-h-[44px] px-3 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 shrink-0"
            >
              {copiedLink ? "Copiado" : "Copiar"}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Enviá este link al cliente por WhatsApp para que pueda pagar.</p>
        </div>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={!!tramiteId} onOpenChange={(open) => { if (!open) handleClose() }}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Datos del cliente</DrawerTitle>
            <DrawerDescription>
              Completá el email del cliente para que pueda iniciar sesión. El link de pago podés copiarlo abajo y enviarlo por el medio que prefieras.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4">{formContent}</div>
          <DrawerFooter>
            <button
              onClick={guardar}
              disabled={loading || saving}
              className="min-h-[44px] px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar y cerrar"}
            </button>
            <button
              onClick={handleClose}
              disabled={saving}
              className="min-h-[44px] px-4 py-3 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cerrar
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={!!tramiteId} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Datos del cliente</DialogTitle>
          <DialogDescription>
            Completá el email del cliente para que pueda iniciar sesión. El link de pago podés copiarlo abajo y enviarlo por el medio que prefieras.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">{formContent}</div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <button
            onClick={handleClose}
            disabled={saving}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 order-2 sm:order-1"
          >
            Cerrar
          </button>
          <button
            onClick={guardar}
            disabled={loading || saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 order-1 sm:order-2"
          >
            {saving ? "Guardando..." : "Guardar y cerrar"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
