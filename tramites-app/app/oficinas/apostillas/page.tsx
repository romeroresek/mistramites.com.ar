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

const CODIGOS_PAIS = [
  { codigo: "+54", pais: "Argentina", placeholder: "11 1234-5678" },
  { codigo: "+595", pais: "Paraguay", placeholder: "981 123456" },
  { codigo: "+598", pais: "Uruguay", placeholder: "99 123 456" },
  { codigo: "+55", pais: "Brasil", placeholder: "11 91234-5678" },
  { codigo: "+56", pais: "Chile", placeholder: "9 1234 5678" },
  { codigo: "+57", pais: "Colombia", placeholder: "300 1234567" },
  { codigo: "+51", pais: "Perú", placeholder: "912 345 678" },
  { codigo: "+591", pais: "Bolivia", placeholder: "71234567" },
  { codigo: "+58", pais: "Venezuela", placeholder: "412 1234567" },
  { codigo: "+52", pais: "México", placeholder: "55 1234 5678" },
  { codigo: "+1", pais: "USA/Canadá", placeholder: "555 123 4567" },
  { codigo: "+34", pais: "España", placeholder: "612 345 678" },
  { codigo: "+39", pais: "Italia", placeholder: "312 345 6789" },
  { codigo: "+49", pais: "Alemania", placeholder: "151 1234 5678" },
  { codigo: "+33", pais: "Francia", placeholder: "6 12 34 56 78" },
  { codigo: "+44", pais: "Reino Unido", placeholder: "7911 123456" },
]

export default function Apostillas() {
  const { data: session } = useSession()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Campos del formulario
  const [email, setEmail] = useState("")
  const [codigoPais, setCodigoPais] = useState("+54")
  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState("")
  const [nombreDocumento, setNombreDocumento] = useState("")
  const [tipoDocumento, setTipoDocumento] = useState("")
  const [archivo, setArchivo] = useState<File | null>(null)

  const isLoggedIn = !!session?.user?.email

  const whatsappCompleto = `${codigoPais}${telefonoWhatsapp.replace(/\D/g, "")}`

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
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
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
      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="bg-white border border-gray-200 rounded">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Apostilla de Documento Público</h1>
            <p className="text-gray-600 text-xs sm:text-sm">Completá los datos para apostillar tu documento</p>
          </div>

          <form onSubmit={handleSubmit} className="p-3 sm:p-4">
            {/* Datos del Solicitante */}
            <div className="mb-5 sm:mb-6">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">
                Datos del Solicitante
              </h3>
              <div className="space-y-3 sm:space-y-4">
                {!isLoggedIn && (
                  <div>
                    <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                    WhatsApp del Solicitante
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={codigoPais}
                      onChange={(e) => setCodigoPais(e.target.value)}
                      className="px-2 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
                    >
                      {CODIGOS_PAIS.map((pais) => (
                        <option key={pais.codigo} value={pais.codigo}>
                          {pais.codigo} {pais.pais}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={telefonoWhatsapp}
                      onChange={(e) => setTelefonoWhatsapp(e.target.value)}
                      className="flex-1 px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      placeholder={CODIGOS_PAIS.find(p => p.codigo === codigoPais)?.placeholder || "Ej: 11 1234-5678"}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Ingresá código de área sin 0 + número sin 15. Ej: 11 1234-5678
                  </p>
                </div>
              </div>
            </div>

            {/* Datos del Documento */}
            <div className="mb-5 sm:mb-6">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">
                Datos del documento a Apostillar
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                    Apellido y Nombre según figuran en el documento a Apostillar
                  </label>
                  <input
                    type="text"
                    value={nombreDocumento}
                    onChange={(e) => setNombreDocumento(e.target.value)}
                    className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                    Tipo de documento a Apostillar
                  </label>
                  <select
                    value={tipoDocumento}
                    onChange={(e) => setTipoDocumento(e.target.value)}
                    className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
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

                <div>
                  <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                    Adjuntar documento
                  </label>
                  <div className="flex items-center gap-2">
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
                      className="px-4 py-2.5 sm:py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Seleccionar archivo
                    </button>
                    <span className="text-sm text-gray-500 truncate flex-1">
                      {archivo ? archivo.name : "Sin archivos seleccionados"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG o PNG</p>
                </div>
              </div>
            </div>

            {/* Resumen y botón */}
            <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monto a pagar:</span>
                <span className="text-lg sm:text-xl font-semibold text-gray-900">
                  ${MONTO_APOSTILLA.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isFormValid() || loading}
              className="w-full px-4 py-3 sm:py-2 bg-blue-600 text-white text-sm sm:text-base rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
