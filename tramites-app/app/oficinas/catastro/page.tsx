"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { useToast } from "@/components/Toast"
import { PageNavbar } from "@/components/PageNavbar"

const DEPARTAMENTOS = [
  "Posadas",
  "Apóstoles",
  "Candelaria",
  "Capital",
  "Cainguás",
  "Concepción",
  "Eldorado",
  "General Manuel Belgrano",
  "Guaraní",
  "Iguazú",
  "Leandro N. Alem",
  "Libertador General San Martín",
  "Montecarlo",
  "Oberá",
  "San Ignacio",
  "San Javier",
  "San Pedro",
  "25 de Mayo",
]

const MONTO_INFORME = 40000

export default function Catastro() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()
  const returnUrl = searchParams.get("returnUrl") ?? undefined
  const [loading, setLoading] = useState(false)

  // Datos del Solicitante
  const [email, setEmail] = useState("")
  const [codigoPais, setCodigoPais] = useState("+54")
  const [customCodigoPais, setCustomCodigoPais] = useState("")
  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState("")

  // Datos del Inmueble
  const [titular, setTitular] = useState("")
  const [partidaInmobiliaria, setPartidaInmobiliaria] = useState("")
  const [lugar, setLugar] = useState("Posadas")

  // Estado para el selector de lugares
  const [showLugares, setShowLugares] = useState(false)
  const [searchLugar, setSearchLugar] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLugares(false)
        setSearchLugar("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredLugares = DEPARTAMENTOS.filter(dep =>
    dep.toLowerCase().includes(searchLugar.toLowerCase())
  )

  const isLoggedIn = !!session?.user?.email
  const prefijoWhatsapp = codigoPais === "otro"
    ? (customCodigoPais.trim().replace(/^(\d+)$/, "+$1") || "+")
    : codigoPais
  const whatsappCompleto = `${prefijoWhatsapp}${telefonoWhatsapp.replace(/\D/g, "")}`

  const buildDescription = () => {
    const lines = [
      `WhatsApp: ${whatsappCompleto}`,
      `Titular: ${titular}`,
      `Partida Inmobiliaria: ${partidaInmobiliaria}`,
      `Lugar: ${lugar}`,
    ]
    return lines.join("\n")
  }

  const isFormValid = () => {
    if (!telefonoWhatsapp || !titular || !partidaInmobiliaria) return false
    if (!isLoggedIn && !email) return false
    if (codigoPais === "otro" && !customCodigoPais.trim()) return false
    return true
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
          oficina: "Catastro",
          tipoTramite: "Informe Catastral",
          descripcion: buildDescription(),
          monto: MONTO_INFORME,
          whatsapp: whatsappCompleto,
          email: isLoggedIn ? undefined : email,
        }),
      })

      if (!res.ok) throw new Error("Error al crear trámite")

      const data = await res.json()
      if (returnUrl) {
        const params = new URLSearchParams({ creado: "1", tramiteId: data.tramiteId })
        if (data.initPoint) params.set("initPoint", data.initPoint)
        router.push(returnUrl + (returnUrl.includes("?") ? "&" : "?") + params.toString())
      } else if (data.initPoint) {
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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <PageNavbar backHref={returnUrl ? `/?returnUrl=${encodeURIComponent(returnUrl)}` : "/"} />

      {/* Main Content */}
      <main className="w-full max-w-2xl mx-auto px-5 sm:px-6 py-5 sm:py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="bg-white border border-gray-200 rounded">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Informe Catastral</h1>
            <p className="text-gray-600 text-xs sm:text-sm">Completá los datos para solicitar tu informe</p>
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
                  <div className="flex items-stretch w-full min-w-0 rounded-lg border border-gray-300 overflow-hidden bg-white">
                    <select
                      value={codigoPais}
                      onChange={(e) => setCodigoPais(e.target.value)}
                      className="appearance-none bg-gray-100 text-gray-700 text-sm px-2 py-2.5 border-r border-gray-300 shrink-0 focus:outline-none cursor-pointer"
                    >
                      <option value="+54">🇦🇷 +54</option>
                      <option value="+55">🇧🇷 +55</option>
                      <option value="+56">🇨🇱 +56</option>
                      <option value="+57">🇨🇴 +57</option>
                      <option value="+58">🇻🇪 +58</option>
                      <option value="+51">🇵🇪 +51</option>
                      <option value="+595">🇵🇾 +595</option>
                      <option value="+598">🇺🇾 +598</option>
                      <option value="+591">🇧🇴 +591</option>
                      <option value="+593">🇪🇨 +593</option>
                      <option value="+52">🇲🇽 +52</option>
                      <option value="+34">🇪🇸 +34</option>
                      <option value="+39">🇮🇹 +39</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="otro">Otro</option>
                    </select>
                    {codigoPais === "otro" && (
                      <input
                        type="text"
                        value={customCodigoPais}
                        onChange={(e) => setCustomCodigoPais(e.target.value)}
                        placeholder="+XXX"
                        className="w-20 min-w-0 px-2 py-2.5 border-r border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                        aria-label="Código de país"
                      />
                    )}
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
                    Ingresá código de área sin 0 + número sin 15. Ej: 11 1234-5678. Si tu país no está, elegí &quot;Otro&quot; e ingresá el código (ej. +49).
                  </p>
                </div>
              </div>
            </div>

            {/* Datos del Inmueble */}
            <div className="mb-5 sm:mb-6">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">
                Datos del Inmueble
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                    Titular
                  </label>
                  <input
                    type="text"
                    value={titular}
                    onChange={(e) => setTitular(e.target.value)}
                    className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                    Partida Inmobiliaria
                  </label>
                  <input
                    type="text"
                    value={partidaInmobiliaria}
                    onChange={(e) => setPartidaInmobiliaria(e.target.value)}
                    className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div ref={dropdownRef} className="relative">
                  <label className="block text-xs sm:text-sm text-gray-600 mb-1">
                    Lugar
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowLugares(!showLugares)}
                    className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white text-left flex justify-between items-center"
                  >
                    <span>{lugar}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-gray-400 transition-transform ${showLugares ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  {showLugares && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg">
                      {/* Campo de búsqueda */}
                      <div className="p-2 border-b border-gray-200">
                        <input
                          type="text"
                          placeholder="Buscar lugar..."
                          value={searchLugar}
                          onChange={(e) => setSearchLugar(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                          autoFocus
                        />
                      </div>
                      {/* Lista de lugares con scroll */}
                      <div className="max-h-48 overflow-y-auto">
                        {filteredLugares.length > 0 ? (
                          filteredLugares.map((dep) => (
                            <button
                              key={dep}
                              type="button"
                              onClick={() => {
                                setLugar(dep)
                                setShowLugares(false)
                                setSearchLugar("")
                              }}
                              className={`w-full px-3 py-2.5 text-left text-sm hover:bg-blue-50 ${
                                lugar === dep ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-700"
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

            {/* Resumen y botón */}
            <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monto a pagar:</span>
                <span className="text-lg sm:text-xl font-semibold text-gray-900">
                  ${MONTO_INFORME.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
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
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-4">
          <p className="text-center text-gray-500 text-xs sm:text-sm">
            © 2024 Trámites Misiones - Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  )
}
