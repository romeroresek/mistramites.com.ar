"use client"

import React from "react"
import Link from "next/link"
import { MessageCircle, MoreVertical, Upload, Pencil, Trash2, Link as LinkIcon } from "lucide-react"
import { formatDateAR, formatDateTimeAR } from "@/lib/utils"
import type { Tramite } from "./types"
import { tieneLinkPago, getWhatsappNumber } from "./types"

interface TramiteRowProps {
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

export const TramiteRow = React.memo(function TramiteRow({
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
}: TramiteRowProps) {
  return (
    <tr className="hover:bg-gray-50/60 transition-colors">
      <td className="px-3 py-2">
        <div className="font-medium text-gray-900 text-sm leading-tight">{tramite.user?.name ?? "Invitado"}</div>
        <div className="text-gray-400 text-xs truncate max-w-[180px]">{tramite.user?.email ?? tramite.guestEmail}</div>
        {getWhatsappNumber(tramite) && (
          <button
            onClick={() => onOpenWhatsapp(tramite)}
            className="text-green-600 hover:text-green-700 text-xs flex items-center gap-1 mt-0.5"
          >
            <MessageCircle className="w-3 h-3" />
            {getWhatsappNumber(tramite)}
          </button>
        )}
      </td>
      <td className="px-3 py-2">
        <div className="text-gray-900 text-sm leading-tight">{tramite.tipoTramite}</div>
        <div className="text-gray-400 text-xs">{formatDateTimeAR(tramite.createdAt)}</div>
      </td>
      <td className="px-3 py-2">
        {tramite.partida ? (
          <div className="text-xs space-y-0.5">
            <div className="text-gray-900 font-medium">
              {tramite.partida.apellido}, {tramite.partida.nombres}{" "}
              {tramite.partida.sexo && <span className="text-gray-500 font-normal">({tramite.partida.sexo})</span>}
            </div>
            {tramite.partida.dni && <div className="text-gray-500">DNI: {tramite.partida.dni}</div>}
            {tramite.partida.fechaNacimiento && (
              <div className="text-gray-500">Nac: {formatDateAR(tramite.partida.fechaNacimiento)}</div>
            )}
            {tramite.partida.ciudadNacimiento && <div className="text-gray-400">{tramite.partida.ciudadNacimiento}</div>}
          </div>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        )}
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1.5 flex-wrap">
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
        {tieneLinkPago(tramite) && !tramite.pago?.paymentId && (
          <button
            onClick={() => onCopiarLinkPago(tramite.id)}
            className="block text-[10px] text-blue-600 hover:text-blue-700 mt-0.5"
          >
            <LinkIcon className="w-3 h-3 inline mr-0.5" />
            Copiar link
          </button>
        )}
      </td>
      <td className="px-3 py-2">
        {tramite.pago?.paymentId ? (
          <div className="text-xs space-y-0.5">
            <div className="text-gray-900 font-medium">#{tramite.pago.paymentId}</div>
            {tramite.pago.payerName && <div className="text-gray-600">{tramite.pago.payerName}</div>}
            {tramite.pago.payerEmail && <div className="text-gray-500 truncate max-w-[160px]">{tramite.pago.payerEmail}</div>}
            {tramite.pago.payerDni && <div className="text-gray-400">DNI: {tramite.pago.payerDni}</div>}
            {tramite.pago.paymentMethod && <div className="text-gray-400 capitalize">{tramite.pago.paymentMethod}</div>}
            {tramite.pago.paymentDate && (
              <div className="text-gray-400">{formatDateTimeAR(tramite.pago.paymentDate)}</div>
            )}
          </div>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        )}
      </td>
      <td className="px-3 py-2">
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
      </td>
      <td className="px-3 py-2">
        {editingObsId === tramite.id ? (
          <div className="flex flex-col gap-1">
            <textarea
              value={editingObsValue}
              onChange={(e) => onSetEditingObs(tramite.id, e.target.value)}
              rows={2}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs resize-y focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-1">
              <button
                onClick={() => onSaveObservaciones(tramite.id)}
                disabled={savingObs}
                className="px-2 py-0.5 bg-blue-600 text-white text-[10px] rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {savingObs ? "..." : "Guardar"}
              </button>
              <button
                onClick={() => onSetEditingObs(null, "")}
                disabled={savingObs}
                className="px-2 py-0.5 text-gray-600 text-[10px] border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onSetEditingObs(tramite.id, tramite.observaciones || "")}
            className="text-left text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 rounded px-2 py-1 w-full min-h-[24px]"
            title="Click para editar observaciones"
          >
            {tramite.observaciones || "\u00A0"}
          </button>
        )}
      </td>
      <td className="px-3 py-2">
        <div className="relative flex justify-center" data-action-menu>
          <button
            onClick={() => onSetActionMenu(actionMenuId === tramite.id ? null : tramite.id)}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Acciones"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {actionMenuId === tramite.id && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[160px]">
              <button
                onClick={() => { onOpenUpload(tramite); onSetActionMenu(null) }}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 ${tramite.archivoUrl ? "text-green-600" : "text-gray-700"}`}
              >
                <Upload className="w-4 h-4" />
                {tramite.archivoUrl ? "Documento cargado" : "Subir documento"}
              </button>
              <Link
                href={`/admin/tramites/${tramite.id}`}
                onClick={() => onSetActionMenu(null)}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 flex items-center gap-2 hover:bg-gray-50"
              >
                <Pencil className="w-4 h-4" />
                Ver detalle
              </Link>
              <button
                onClick={() => { onSetDeleteId(tramite.id); onSetActionMenu(null) }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 flex items-center gap-2 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
})
