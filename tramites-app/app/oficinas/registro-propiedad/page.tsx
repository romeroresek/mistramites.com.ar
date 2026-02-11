"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"

const TRAMITES = [
  { id: "f3-titularidad", nombre: "F3- Búsqueda de Titularidad", monto: 50000 },
  { id: "f4-dominio", nombre: "F4- Condiciones de Dominio", monto: 50000 },
  { id: "f5-inhibiciones", nombre: "F5- Inhibiciones", monto: 50000 },
]

const DEPARTAMENTOS = [
  "Posadas",
  "Oberá",
  "Eldorado",
  "Iguazú",
  "Apóstoles",
  "Leandro N. Alem",
  "San Pedro",
  "Montecarlo",
  "Jardín América",
  "Puerto Rico",
]

export default function RegistroPropiedad() {
  const { status } = useSession()
  const router = useRouter()
  const [selectedTramite, setSelectedTramite] = useState("")
  const [loading, setLoading] = useState(false)

  // Datos del Solicitante (común a todos)
  const [whatsappSolicitante, setWhatsappSolicitante] = useState("")

  // Datos para F3 y F5 (persona)
  const [nombrePersona, setNombrePersona] = useState("")
  const [dniPersona, setDniPersona] = useState("")

  // Datos para F4 (inmueble)
  const [matricula, setMatricula] = useState("")
  const [tomoInscripcion, setTomoInscripcion] = useState("")
  const [folioInscripcion, setFolioInscripcion] = useState("")
  const [fincaInscripcion, setFincaInscripcion] = useState("")
  const [departamento, setDepartamento] = useState("Posadas")

  // Estado para el selector de departamentos
  const [showDepartamentos, setShowDepartamentos] = useState(false)
  const [searchDepartamento, setSearchDepartamento] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDepartamentos(false)
        setSearchDepartamento("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredDepartamentos = DEPARTAMENTOS.filter(dep =>
    dep.toLowerCase().includes(searchDepartamento.toLowerCase())
  )

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  const tramiteSeleccionado = TRAMITES.find((t) => t.id === selectedTramite)

  const buildDescription = () => {
    let desc = `DATOS DEL SOLICITANTE:\n`
    desc += `- WhatsApp: ${whatsappSolicitante}\n\n`

    if (selectedTramite === "f3-titularidad" || selectedTramite === "f5-inhibiciones") {
      desc += `DATOS DE LA PERSONA:\n`
      desc += `- Nombre: ${nombrePersona}\n`
      desc += `- DNI/CUIT: ${dniPersona}\n`
    }

    if (selectedTramite === "f4-dominio") {
      desc += `DATOS DEL INMUEBLE:\n`
      desc += `- Matrícula (Folio Real): ${matricula || "No especificada"}\n`
      if (tomoInscripcion) desc += `- Tomo Inscripción: ${tomoInscripcion}\n`
      if (folioInscripcion) desc += `- Folio Inscripción: ${folioInscripcion}\n`
      if (fincaInscripcion) desc += `- Finca Inscripción: ${fincaInscripcion}\n`
      desc += `- Departamento: ${departamento}\n`
    }

    return desc
  }

  const isFormValid = () => {
    if (!whatsappSolicitante) return false

    if (selectedTramite === "f3-titularidad" || selectedTramite === "f5-inhibiciones") {
      if (!nombrePersona || !dniPersona) return false
    }

    if (selectedTramite === "f4-dominio") {
      if (!matricula && !tomoInscripcion) return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTramite || !isFormValid()) return

    setLoading(true)

    try {
      const res = await fetch("/api/tramites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oficina: "Registro Propiedad Inmueble",
          tipoTramite: tramiteSeleccionado!.nombre,
          descripcion: buildDescription(),
          monto: tramiteSeleccionado!.monto,
          whatsapp: whatsappSolicitante,
        }),
      })

      if (!res.ok) throw new Error("Error al crear trámite")

      const tramite = await res.json()
      router.push(`/pago/${tramite.id}`)
    } catch (error) {
      console.error(error)
      alert("Error al crear el trámite")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setWhatsappSolicitante("")
    setNombrePersona("")
    setDniPersona("")
    setMatricula("")
    setTomoInscripcion("")
    setFolioInscripcion("")
    setFincaInscripcion("")
    setDepartamento("Posadas")
    setShowDepartamentos(false)
    setSearchDepartamento("")
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
              <Image src="/icon.png" alt="TramitesMisiones" width={32} height={32} className="w-8 h-8" />
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
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Registro Propiedad Inmueble</h1>
            <p className="text-gray-600 text-xs sm:text-sm">Seleccioná el trámite que necesitás realizar</p>
          </div>

          {/* Selector de trámites */}
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              {TRAMITES.map((tramite) => (
                <button
                  key={tramite.id}
                  onClick={() => {
                    setSelectedTramite(tramite.id)
                    resetForm()
                  }}
                  className={`p-3 border rounded text-sm text-left transition-colors ${
                    selectedTramite === tramite.id
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-300 hover:border-gray-400 text-gray-700"
                  }`}
                >
                  {tramite.nombre}
                </button>
              ))}
            </div>
          </div>

          {selectedTramite && (
            <form onSubmit={handleSubmit} className="p-3 sm:p-4">
              {/* Datos del Solicitante - Común a todos */}
              <div className="mb-5 sm:mb-6">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">
                  Datos del Solicitante
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                      WhatsApp del Solicitante
                    </label>
                    <input
                      type="tel"
                      value={whatsappSolicitante}
                      onChange={(e) => setWhatsappSolicitante(e.target.value)}
                      className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Datos específicos según trámite */}
              {(selectedTramite === "f3-titularidad" || selectedTramite === "f5-inhibiciones") && (
                <div className="mb-5 sm:mb-6">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">
                    Datos de la Persona
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                        Apellido y Nombre de la Persona
                      </label>
                      <input
                        type="text"
                        value={nombrePersona}
                        onChange={(e) => setNombrePersona(e.target.value)}
                        className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                        DNI/CUIT de la Persona
                      </label>
                      <input
                        type="text"
                        value={dniPersona}
                        onChange={(e) => setDniPersona(e.target.value)}
                        className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedTramite === "f4-dominio" && (
                <div className="mb-5 sm:mb-6">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">
                    Datos del Inmueble
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                        Matrícula del Inmueble (Folio Real)
                      </label>
                      <input
                        type="text"
                        value={matricula}
                        onChange={(e) => setMatricula(e.target.value)}
                        className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                        Tomo Inscripción
                        <span className="block text-gray-400 text-xs mt-0.5">(Opcional si no tenés matrícula)</span>
                      </label>
                      <input
                        type="text"
                        value={tomoInscripcion}
                        onChange={(e) => setTomoInscripcion(e.target.value)}
                        className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                        Folio Inscripción
                        <span className="block text-gray-400 text-xs mt-0.5">(Opcional si no tenés matrícula)</span>
                      </label>
                      <input
                        type="text"
                        value={folioInscripcion}
                        onChange={(e) => setFolioInscripcion(e.target.value)}
                        className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                        Finca Inscripción
                        <span className="block text-gray-400 text-xs mt-0.5">(Opcional si no tenés matrícula)</span>
                      </label>
                      <input
                        type="text"
                        value={fincaInscripcion}
                        onChange={(e) => setFincaInscripcion(e.target.value)}
                        className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div ref={dropdownRef} className="relative">
                      <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                        Departamento del Inmueble
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowDepartamentos(!showDepartamentos)}
                        className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white text-left flex justify-between items-center"
                      >
                        <span>{departamento}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-gray-400 transition-transform ${showDepartamentos ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </button>

                      {showDepartamentos && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg">
                          {/* Campo de búsqueda */}
                          <div className="p-2 border-b border-gray-200">
                            <input
                              type="text"
                              placeholder="Buscar departamento..."
                              value={searchDepartamento}
                              onChange={(e) => setSearchDepartamento(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                              autoFocus
                            />
                          </div>
                          {/* Lista de departamentos con scroll */}
                          <div className="max-h-48 overflow-y-auto">
                            {filteredDepartamentos.length > 0 ? (
                              filteredDepartamentos.map((dep) => (
                                <button
                                  key={dep}
                                  type="button"
                                  onClick={() => {
                                    setDepartamento(dep)
                                    setShowDepartamentos(false)
                                    setSearchDepartamento("")
                                  }}
                                  className={`w-full px-3 py-2.5 text-left text-sm hover:bg-blue-50 ${
                                    departamento === dep ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-700"
                                  }`}
                                >
                                  {dep}
                                </button>
                              ))
                            ) : (
                              <p className="px-3 py-2 text-sm text-gray-500">No se encontraron resultados</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Resumen y botón */}
              <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Monto a pagar:</span>
                  <span className="text-lg sm:text-xl font-semibold text-gray-900">
                    ${tramiteSeleccionado!.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
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
          )}

          {!selectedTramite && (
            <div className="p-6 sm:p-8 text-center text-gray-500 text-sm">
              Seleccioná un trámite para continuar
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-center text-gray-500 text-sm">
            © 2024 TramitesMisiones - Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  )
}
