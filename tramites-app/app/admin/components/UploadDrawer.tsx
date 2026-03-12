"use client"

import React, { useState } from "react"
import { Upload } from "lucide-react"
import { useToast } from "@/components/Toast"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer"
import type { Tramite } from "./types"

interface UploadDrawerProps {
  tramite: Tramite | null
  onClose: () => void
  onUploaded: () => void
}

export function UploadDrawer({ tramite, onClose, onUploaded }: UploadDrawerProps) {
  const toast = useToast()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !tramite) return

    if (file.type !== "application/pdf") {
      setUploadError("Solo se permiten archivos PDF")
      return
    }

    setUploading(true)
    setUploadError("")

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch(`/api/admin/tramites/${tramite.id}/upload`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        toast.showSuccess("Archivo subido correctamente")
        onClose()
        onUploaded()
      } else {
        setUploadError(data.error || "Error al subir archivo")
      }
    } catch {
      setUploadError("Error al subir archivo")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Drawer
      open={!!tramite}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
          setUploadError("")
        }
      }}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Subir documento</DrawerTitle>
          {tramite && (
            <DrawerDescription>
              Para: {tramite.partida?.nombres} {tramite.partida?.apellido} - {tramite.tipoTramite}
            </DrawerDescription>
          )}
        </DrawerHeader>
        <div className="px-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 mb-3">
              {uploading ? "Subiendo archivo..." : "Subir archivo PDF para el usuario"}
            </p>
            {uploadError && <p className="text-sm text-red-600 mb-3">{uploadError}</p>}
            <label className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg cursor-pointer hover:bg-blue-700">
              {uploading ? "Subiendo..." : "Seleccionar PDF"}
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>
        <DrawerFooter>
          <button
            onClick={onClose}
            disabled={uploading}
            className="min-h-[44px] px-4 py-3 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
