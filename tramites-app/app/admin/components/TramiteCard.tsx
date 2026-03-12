"use client"

import React from "react"
import Link from "next/link"
import { MessageCircle, MoreVertical, Upload, StickyNote, Pencil, Trash2, LinkIcon } from "lucide-react"
import { formatDateAR, formatDateTimeAR } from "@/lib/utils"
import type { Tramite } from "./types"
import { tieneLinkPago, getWhatsappNumber } from "./types"

interface TramiteCardProps {
  tramite: Tramite
  editingObsId: string | null
  editingObsValue: string
  savingObs: boolean
  actionMenuId: string | null
  onOpenWhatsapp: (tramite: Tramite) => void
  onUpdateStatus: (tramiteId: string, field: "estado" | "pagoEstado", value: string) => void
  onSaveObservaciones: (tramiteId: string) => void
  onCopiarLinkPago: (tramiteId: string) => void
  onOpenUpload: (tramite: Tramite) => void
  onSetDeleteId: (id: string) => void
  onSetEditingObs: (id: string | null, value: string) => void
  onSetActionMenu: (id: string | null) => void
}

export const TramiteCard = React.memo(function TramiteCard({
  tramite,
  editingObsId,
  editingObsValue,
  savingObs,
  actionMenuId,
  onOpenWhatsapp,
  onUpdateStatus,
  onSaveObservaciones,
  onCopiarLinkPago,
  onOpenUpload,
  onSetDeleteId,
  onSetEditingObs,
  onSetActionMenu,
}: TramiteCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Usuario */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 text-sm truncate">{tramite.user?.name ?? "Invitado"}</p>
          <p className="text-gray-400 text-xs truncate">{tramite.user?.email ?? tramite.guestEmail}</p>
          {getWhatsappNumber(tramite) && (
            <button
              onClick={() => onOpenWhatsapp(tramite)}
              className="text-green-600 hover:text-green-700 text-xs flex items-center gap-1 mt-0.5"
            >
              <MessageCircle className="w-3 h-3" />
              {getWhatsappNumber(tramite)}
            </button>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-gray-900 text-sm">{tramite.tipoTramite}</p>
          <p className="text-gray-400 text-xs">{formatDateTimeAR(tramite.createdAt)}</p>
        </div>
      </div>

      {/* Detalle (Partida) */}
      {tramite.partida && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <p className="text-gray-900 text-sm font-medium">
            {tramite.partida.apellido}, {tramite.partida.nombres}
            {tramite.partida.sexo && <span className="text-gray-500 font-normal"> ({tramite.partida.sexo})</span>}
          </p>
          {tramite.partida.dni && <p className="text-gray-500 text-xs">DNI: {tramite.partida.dni}</p>}
          {tramite.partida.fechaNacimiento && (
            <p className="text-gray-500 text-xs">Nac: {formatDateAR(tramite.partida.fechaNacimiento)}</p>
          )}
          {tramite.partida.ciudadNacimiento && <p className="text-gray-400 text-xs">{tramite.partida.ciudadNacimiento}</p>}
        </div>
      )}

      {/* Estados */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs">Pago:</span>
          <select
            value={tramite.pago?.estado || "pendiente"}
            onChange={(e) => onUpdateStatus(tramite.id, "pagoEstado", e.target.value)}
            className={`px-2 py-0.5 rounded text-xs border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-offset-0 ${
              tramite.pago?.estado === "confirmado"
                ? "bg-green-100 text-green-700 focus:ring-green-300"
                : tramite.pago?.estado === "devuelto"
                  ? "bg-gray-100 text-gray-700 focus:ring-gray-300"
                  : "bg-yellow-100 text-yellow-700 focus:ring-yellow-300"
            }`}
          >
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">Pagado</option>
            <option value="devuelto">Devuelto</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs">Estado:</span>
          <select
            value={tramite.estado === "listo" ? "completado" : tramite.estado}
            onChange={(e) => onUpdateStatus(tramite.id, "estado", e.target.value)}
            className={`px-2 py-0.5 rounded text-xs border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-offset-0 ${
              tramite.estado === "listo" || tramite.estado === "completado"
                ? "bg-green-100 text-green-700 focus:ring-green-300"
                : tramite.estado === "rechazado"
                  ? "bg-red-100 text-red-700 focus:ring-red-300"
                  : tramite.estado === "cancelado"
                    ? "bg-gray-100 text-gray-700 focus:ring-gray-300"
                    : tramite.estado === "en_proceso"
                      ? "bg-blue-100 text-blue-700 focus:ring-blue-300"
                      : "bg-yellow-100 text-yellow-700 focus:ring-yellow-300"
            }`}
          >
            <option value="pendiente">Pendiente</option>
            <option value="en_proceso">En proceso</option>
            <option value="completado">Completado</option>
            <option value="rechazado">Rechazado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Observaciones */}
      {(editingObsId === tramite.id || tramite.observaciones) && (
        <div className="mb-3">
          {editingObsId === tramite.id ? (
            <div className="flex flex-col gap-1">
              <textarea
                value={editingObsValue}
                onChange={(e) => onSetEditingObs(tramite.id, e.target.value)}
                rows={2}
                placeholder="Observaciones..."
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs resize-y focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onSaveObservaciones(tramite.id)}
                  disabled={savingObs}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingObs ? "..." : "Guardar"}
                </button>
                <button
                  onClick={() => onSetEditingObs(null, "")}
                  disabled={savingObs}
                  className="px-3 py-1 text-gray-600 text-xs border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => onSetEditingObs(tramite.id, tramite.observaciones || "")}
              className="text-left text-xs text-gray-600 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 w-full"
            >
              {tramite.observaciones}
            </button>
          )}
        </div>
      )}

      {/* Link de pago */}
      {tieneLinkPago(tramite) && !tramite.pago?.paymentId && (
        <button
          onClick={() => onCopiarLinkPago(tramite.id)}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-3"
        >
          <LinkIcon className="w-3 h-3" />
          Copiar link de pago
        </button>
      )}

      {/* Detalles MercadoPago */}
      {tramite.pago?.paymentId && (
        <div className="bg-blue-50 rounded-lg p-3 mb-3">
          <p className="text-blue-800 text-xs font-medium mb-1">MercadoPago #{tramite.pago.paymentId}</p>
          <div className="text-xs space-y-0.5">
            {tramite.pago.payerName && <p className="text-blue-700">{tramite.pago.payerName}</p>}
            {tramite.pago.payerEmail && <p className="text-blue-600">{tramite.pago.payerEmail}</p>}
            {tramite.pago.payerDni && <p className="text-blue-500">DNI: {tramite.pago.payerDni}</p>}
            {tramite.pago.paymentMethod && <p className="text-blue-500 capitalize">{tramite.pago.paymentMethod}</p>}
            {tramite.pago.paymentDate && (
              <p className="text-blue-400">{formatDateTimeAR(tramite.pago.paymentDate)}</p>
            )}
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center justify-end pt-2 border-t border-gray-100">
        <div className="relative" data-action-menu>
          <button
            onClick={() => onSetActionMenu(actionMenuId === tramite.id ? null : tramite.id)}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Acciones"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {actionMenuId === tramite.id && (
            <div className="absolute right-0 bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[160px]">
              <button
                onClick={() => { onOpenUpload(tramite); onSetActionMenu(null) }}
                className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-gray-50 ${tramite.archivoUrl ? "text-green-600" : "text-gray-700"}`}
              >
                <Upload className="w-4 h-4" />
                {tramite.archivoUrl ? "Documento cargado" : "Subir documento"}
              </button>
              <button
                onClick={() => {
                  onSetEditingObs(tramite.id, tramite.observaciones || "")
                  onSetActionMenu(null)
                }}
                className="w-full px-3 py-2.5 text-left text-sm text-gray-700 flex items-center gap-2 hover:bg-gray-50"
              >
                <StickyNote className="w-4 h-4" />
                Observaciones
              </button>
              <Link
                href={`/admin/tramites/${tramite.id}`}
                onClick={() => onSetActionMenu(null)}
                className="w-full px-3 py-2.5 text-left text-sm text-gray-700 flex items-center gap-2 hover:bg-gray-50"
              >
                <Pencil className="w-4 h-4" />
                Ver detalle
              </Link>
              <button
                onClick={() => { onSetDeleteId(tramite.id); onSetActionMenu(null) }}
                className="w-full px-3 py-2.5 text-left text-sm text-red-600 flex items-center gap-2 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
