"use client"

import { useSession } from "next-auth/react"
import { useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useToast } from "@/components/Toast"

const TIPOS_DOCUMENTO = [
  "Partida de Registro civil",
  "Certificado de antecedentes Penales",
  "Certificado legalidad licencia de conducir",
  "Escritura",
  "Estatuto societario",
  "Poder notarial",
  "Sentencia Judicial",
  "Título Educativo",
  "Otro",
]

const MONTO_APOSTILLA = 40000

export default function Apostillas() {
  const { data: session } = useSession()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Campos del formulario
  const [email, setEmail] = useState("")
  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState("")
  const [nombreDocumento, setNombreDocumento] = useState("")
  const [tipoDocumento, setTipoDocumento] = useState("")
  const [archivo, setArchivo] = useState<File | null>(null)

  const isLoggedIn = !!session?.user?.email

  const whatsappCompleto = `+54${telefonoWhatsapp.replace(/\D/g, "")}`

  const buildDescription = () => {
    const lines = [
      `WhatsApp: ${whatsappCompleto}`,
      `Nombre en documento: ${nombreDocumento}`,
      `Tipo de documento: ${tipoDocumento}`,
    ]
    return lines.join("\n")
  }

  const isFormValid = () => {
    if (!telefonoWhatsapp || !nombreDocumento || !tipoDocumento || !archivo) return false
    if (!isLoggedIn && !email) return false
    return true
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setArchivo(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid()) return

    setLoading(true)

    try {
      const res = await fetch("/api/tramites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oficina: "Apostillas",
          tipoTramite: `Apostilla - ${tipoDocumento}`,
          descripcion: buildDescription(),
          monto: MONTO_APOSTILLA,
          whatsapp: whatsappCompleto,
          email: isLoggedIn ? undefined : email,
        }),
      })

      if (!res.ok) throw new Error("Error al crear trámite")

      const data = await res.json()

      // Subir archivo si existe
      if (archivo && data.tramiteId) {
        const formData = new FormData()
        formData.append("file", archivo)
        formData.append("tramiteId", data.tramiteId)

        await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
      }

      // Redirigir a Mercado Pago
      if (data.initPoint) {
        window.location.href = data.initPoint
      } else {
        toast.showError(data?.error || "Error al procesar el pago")
      }
    } catch (error) {
      console.error(error)
      toast.showError("Error al crear el trámite")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 min-h-[44px] text-gray-600 hover:text-gray-900 rounded-lg px-2 -ml-2 hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Volver
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <Image src="/icon-192x192.png" alt="TramitesMisiones" width={32} height={32} className="w-8 h-8" />
              <span className="font-semibold text-gray-800">TramitesMisiones</span>
            </Link>
            <div className="w-16"></div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-5 sm:py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] min-w-0">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl sm:text-xl font-semibold text-gray-900">Apostilla de Documento Público</h1>
            <p className="text-gray-600 text-sm mt-0.5">Completá los datos para apostillar tu documento</p>
          </div>

          <form onSubmit={handleSubmit} className="p-4 min-w-0">
            {/* Datos del Solicitante */}
            <div className="mb-5 sm:mb-6 min-w-0">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">
                Datos del Solicitante
              </h3>
              <div className="space-y-4">
                {!isLoggedIn && (
                  <div className="min-w-0">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full min-w-0 px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp del Solicitante</label>
                  <div className="flex items-stretch w-full min-w-0 rounded-lg border border-gray-300 overflow-hidden bg-white">
                    <span className="inline-flex items-center px-3 py-2.5 bg-gray-100 text-gray-700 text-sm border-r border-gray-300 shrink-0">+54</span>
                    <input
                      type="tel"
                      value={telefonoWhatsapp}
                      onChange={(e) => setTelefonoWhatsapp(e.target.value)}
                      className="flex-1 min-w-0 w-full px-3 py-2.5 border-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 text-sm"
                      placeholder="11 1234-5678"
                      required
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Ingresá código de área sin 0 + número sin 15. Ej: 11 1234 5678
                  </p>
                </div>
              </div>
            </div>

            {/* Datos del Documento */}
            <div className="mb-5 sm:mb-6 min-w-0">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">
                Datos del documento a Apostillar
              </h3>
              <div className="space-y-4">
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido y Nombre según figuran en el documento a Apostillar
                  </label>
                  <input
                    type="text"
                    value={nombreDocumento}
                    onChange={(e) => setNombreDocumento(e.target.value)}
                    className="w-full min-w-0 px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de documento a Apostillar
                  </label>
                  <select
                    value={tipoDocumento}
                    onChange={(e) => setTipoDocumento(e.target.value)}
                    className="w-full min-w-0 px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {TIPOS_DOCUMENTO.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-0">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adjuntar documento</label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="min-h-[44px] shrink-0 inline-flex items-center justify-center px-4 py-2.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 active:bg-gray-100"
                    >
                      Seleccionar archivo
                    </button>
                    <span className="text-sm text-gray-500 truncate min-w-0">
                      {archivo ? archivo.name : "Sin archivos seleccionados"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">PDF, JPG o PNG</p>
                </div>
              </div>
            </div>

            {/* Resumen y botón */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 min-w-0">
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm text-gray-600">Monto a pagar:</span>
                <span className="text-lg sm:text-xl font-semibold text-gray-900">
                  ${MONTO_APOSTILLA.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isFormValid() || loading}
              className="w-full min-h-[44px] px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Procesando..." : "Continuar al pago"}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-center text-gray-500 text-xs sm:text-sm">
            © 2024 TramitesMisiones - Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  )
}
