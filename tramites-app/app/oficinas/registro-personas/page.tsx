"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, Suspense } from "react"
import { useToast } from "@/components/Toast"
import { PageNavbar } from "@/components/PageNavbar"

const LOCALIDADES_MISIONES = [
  "Alba Posse", "Almafuerte", "Apóstoles", "Aristóbulo del Valle", "Azara",
  "Bernardo de Irigoyen", "Campo Grande", "Campo Ramón", "Campo Viera",
  "Candelaria", "Capioví", "Cerro Azul", "Colonia Aurora", "Colonia Delicia",
  "Colonia Victoria", "Colonia Wanda", "Comandante Andresito", "Concepción de la Sierra",
  "Corpus", "Dos de Mayo", "El Soberbio", "Eldorado", "Garuhapé", "Garupá",
  "Gobernador Roca", "Guaraní", "Iguazú", "Jardín América", "Leandro N. Alem",
  "Loreto", "Montecarlo", "Oberá", "Posadas", "Puerto Esperanza", "Puerto Iguazú",
  "Puerto Rico", "Ruiz de Montoya", "San Antonio", "San Ignacio", "San Javier",
  "San Pedro", "San Vicente", "Santa Ana", "Santo Pipó", "Wanda"
].sort()

const inputClass = "w-full min-w-0 max-w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm box-border"
const labelClass = "block text-sm font-medium text-gray-700 mb-1"

function PersonaFields({ label, dniVal, setDniVal, sexoVal, setSexoVal, nombreCompletoVal, setNombreCompletoVal, fechaNacVal, setFechaNacVal }: {
  label: string
  dniVal: string; setDniVal: (v: string) => void
  sexoVal: string; setSexoVal: (v: string) => void
  nombreCompletoVal: string; setNombreCompletoVal: (v: string) => void
  fechaNacVal: string; setFechaNacVal: (v: string) => void
}) {
  return (
    <div className="space-y-3 min-w-0">
      {label && <h3 className="font-semibold text-gray-900 border-b pb-2">{label}</h3>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>DNI</label>
          <input type="text" value={dniVal} onChange={(e) => setDniVal(e.target.value)} className={inputClass} required maxLength={10} />
        </div>
        <div>
          <label className={labelClass}>Sexo</label>
          <select value={sexoVal} onChange={(e) => setSexoVal(e.target.value)} className={inputClass} required>
            <option value="">Seleccione</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>
      </div>
      <div>
        <label className={labelClass}>Apellido y nombre</label>
        <input type="text" value={nombreCompletoVal} onChange={(e) => setNombreCompletoVal(e.target.value)} className={inputClass} required />
      </div>
      <div>
        <label className={labelClass}>Fecha de nacimiento</label>
        <input type="date" value={fechaNacVal} onChange={(e) => setFechaNacVal(e.target.value)} className={inputClass} required />
      </div>
    </div>
  )
}

const PARTIDAS = [
  { id: "nacimiento", nombre: "Partida de Nacimiento" },
  { id: "matrimonio", nombre: "Partida de Matrimonio" },
  { id: "defuncion", nombre: "Partida de Defunción" },
]

export default function RegistroPersonas() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center"><p className="text-gray-600">Cargando...</p></div>}>
      <RegistroPersonasContent />
    </Suspense>
  )
}

function RegistroPersonasContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()
  const returnUrl = searchParams.get("returnUrl") ?? undefined
  const [selectedPartida, setSelectedPartida] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [dni, setDni] = useState("")
  const [sexo, setSexo] = useState("")
  const [nombreCompleto, setNombreCompleto] = useState("")
  const [fechaNacimiento, setFechaNacimiento] = useState("")
  const [ciudadNacimiento, setCiudadNacimiento] = useState("")
  const [fechaDefuncion, setFechaDefuncion] = useState("")
  const [codigoPais, setCodigoPais] = useState("+54")
  const [customCodigoPais, setCustomCodigoPais] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [email, setEmail] = useState("")

  const [dni2, setDni2] = useState("")
  const [sexo2, setSexo2] = useState("")
  const [nombreCompleto2, setNombreCompleto2] = useState("")
  const [fechaNacimiento2, setFechaNacimiento2] = useState("")

  const [fechaMatrimonio, setFechaMatrimonio] = useState("")
  const [ciudadMatrimonio, setCiudadMatrimonio] = useState("")
  const [divorciados, setDivorciados] = useState(false)

  const isLoggedIn = status === "authenticated" && session?.user?.email

  const resetForm = () => {
    setDni(""); setSexo(""); setNombreCompleto("")
    setFechaNacimiento(""); setCiudadNacimiento(""); setFechaDefuncion("")
    setDni2(""); setSexo2(""); setNombreCompleto2("")
    setFechaNacimiento2(""); setFechaMatrimonio(""); setCiudadMatrimonio("")
    setDivorciados(false); setCodigoPais("+54"); setCustomCodigoPais(""); setWhatsapp(""); setEmail("")
  }

  // Función para separar apellido y nombre
  const separarNombre = (nombreCompleto: string) => {
    const partes = nombreCompleto.trim().split(" ")
    if (partes.length === 1) {
      return { apellido: partes[0], nombres: "-" }
    }
    return { apellido: partes[0], nombres: partes.slice(1).join(" ") }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPartida) return
    if (codigoPais === "otro" && !customCodigoPais.trim()) {
      toast.showError("Ingresá el código de país (ej. +49)")
      return
    }

    setLoading(true)

    try {
      const { apellido, nombres } = separarNombre(nombreCompleto)

      const prefijo = codigoPais === "otro"
        ? (customCodigoPais.trim().replace(/^(\d+)$/, "+$1") || "+")
        : codigoPais
      const body: Record<string, unknown> = {
        tipoPartida: selectedPartida,
        dni, sexo, nombres, apellido, fechaNacimiento, ciudadNacimiento,
        whatsapp: `${prefijo}${whatsapp.replace(/\D/g, "")}`,
        email: isLoggedIn ? undefined : email,
      }

      if (selectedPartida === "defuncion") {
        body.fechaDefuncion = fechaDefuncion
      }

      if (selectedPartida === "matrimonio") {
        const persona2 = separarNombre(nombreCompleto2)
        body.dni2 = dni2
        body.sexo2 = sexo2
        body.nombres2 = persona2.nombres
        body.apellido2 = persona2.apellido
        body.fechaNacimiento2 = fechaNacimiento2
        body.fechaMatrimonio = fechaMatrimonio
        body.ciudadMatrimonio = ciudadMatrimonio
        body.divorciados = divorciados
      }

      const res = await fetch("/api/partidas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.showError(data.error || "Error al crear la solicitud")
        return
      }

      if (returnUrl) {
        const params = new URLSearchParams({ creado: "1", tramiteId: data.tramiteId })
        if (data.initPoint) params.set("initPoint", data.initPoint)
        router.push(returnUrl + (returnUrl.includes("?") ? "&" : "?") + params.toString())
      } else if (data.initPoint) {
        window.location.href = data.initPoint
      } else {
        router.push(`/mis-tramites/${data.tramiteId}`)
      }
    } catch (error) {
      console.error(error)
      toast.showError("Error al procesar la solicitud")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <PageNavbar backHref={returnUrl ? `/?returnUrl=${encodeURIComponent(returnUrl)}` : "/"} />

      {/* Main */}
      <main className="w-full max-w-2xl mx-auto px-5 sm:px-6 py-5 sm:py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] min-w-0 overflow-hidden">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Solicitar Partida</h2>
            <p className="text-sm text-gray-600">Seleccioná el tipo de partida y completá los datos</p>
          </div>

          <div className="p-4 min-w-0">
            {/* Tipo de partida */}
            <div className="mb-6 min-w-0">
              <label className={labelClass}>Tipo de partida</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                {PARTIDAS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setSelectedPartida(p.id); resetForm() }}
                    className={`min-h-[44px] p-3 border rounded-lg text-sm text-left transition-colors ${selectedPartida === p.id
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-300 hover:border-gray-400 text-gray-700"
                      }`}
                  >
                    {p.nombre}
                  </button>
                ))}
              </div>
            </div>

            {/* Formulario */}
            {selectedPartida && (
              <form onSubmit={handleSubmit} className="space-y-6 w-full min-w-0 max-w-full overflow-hidden">
                {/* Nacimiento */}
                {selectedPartida === "nacimiento" && (
                  <>
                    <PersonaFields
                      label=""
                      dniVal={dni} setDniVal={setDni}
                      sexoVal={sexo} setSexoVal={setSexo}
                      nombreCompletoVal={nombreCompleto} setNombreCompletoVal={setNombreCompleto}
                      fechaNacVal={fechaNacimiento} setFechaNacVal={setFechaNacimiento}
                    />
                    <div className="min-w-0 overflow-hidden">
                      <label className={labelClass}>Ciudad de nacimiento</label>
                      <select value={ciudadNacimiento} onChange={(e) => setCiudadNacimiento(e.target.value)} className={inputClass} required>
                        <option value="">Seleccione localidad</option>
                        {LOCALIDADES_MISIONES.map((loc) => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Defunción */}
                {selectedPartida === "defuncion" && (
                  <>
                    <PersonaFields
                      label=""
                      dniVal={dni} setDniVal={setDni}
                      sexoVal={sexo} setSexoVal={setSexo}
                      nombreCompletoVal={nombreCompleto} setNombreCompletoVal={setNombreCompleto}
                      fechaNacVal={fechaNacimiento} setFechaNacVal={setFechaNacimiento}
                    />
                    <div className="min-w-0 overflow-hidden">
                      <label className={labelClass}>Ciudad</label>
                      <select value={ciudadNacimiento} onChange={(e) => setCiudadNacimiento(e.target.value)} className={inputClass} required>
                        <option value="">Seleccione localidad</option>
                        {LOCALIDADES_MISIONES.map((loc) => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Fecha de defunción</label>
                      <input type="date" value={fechaDefuncion} onChange={(e) => setFechaDefuncion(e.target.value)} className={inputClass} required />
                    </div>
                  </>
                )}

                {/* Matrimonio */}
                {selectedPartida === "matrimonio" && (
                  <>
                    <PersonaFields
                      label="Primera persona"
                      dniVal={dni} setDniVal={setDni}
                      sexoVal={sexo} setSexoVal={setSexo}
                      nombreCompletoVal={nombreCompleto} setNombreCompletoVal={setNombreCompleto}
                      fechaNacVal={fechaNacimiento} setFechaNacVal={setFechaNacimiento}
                    />

                    <div className="border-t pt-4">
                      <PersonaFields
                        label="Segunda persona"
                        dniVal={dni2} setDniVal={setDni2}
                        sexoVal={sexo2} setSexoVal={setSexo2}
                        nombreCompletoVal={nombreCompleto2} setNombreCompletoVal={setNombreCompleto2}
                        fechaNacVal={fechaNacimiento2} setFechaNacVal={setFechaNacimiento2}
                      />
                    </div>

                    <div className="border-t pt-4 space-y-3">
                      <h3 className="font-semibold text-gray-900">Datos del matrimonio</h3>
                      <div>
                        <label className={labelClass}>Fecha de matrimonio</label>
                        <input type="date" value={fechaMatrimonio} onChange={(e) => setFechaMatrimonio(e.target.value)} className={inputClass} required />
                      </div>
                      <div className="min-w-0 overflow-hidden">
                        <label className={labelClass}>Ciudad</label>
                        <select value={ciudadMatrimonio} onChange={(e) => setCiudadMatrimonio(e.target.value)} className={inputClass} required>
                          <option value="">Seleccione localidad</option>
                          {LOCALIDADES_MISIONES.map((loc) => (
                            <option key={loc} value={loc}>{loc}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="divorciados"
                          checked={divorciados}
                          onChange={(e) => setDivorciados(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <label htmlFor="divorciados" className="text-sm text-gray-700">
                          Divorciados
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {/* WhatsApp: código de país seleccionable y número */}
                <div className="w-full min-w-0">
                  <label className={labelClass}>WhatsApp de contacto</label>
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
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="flex-1 min-w-0 w-full px-3 py-2.5 border-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 text-sm"
                      placeholder="11 1234-5678"
                      required
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Ingresá código de área sin 0 + número sin 15. Ej: 11 1234 5678. Si tu país no está en la lista, elegí &quot;Otro&quot; e ingresá el código (ej. +49).</p>
                </div>

                {/* Email - solo si no está logueado */}
                {!isLoggedIn && (
                  <div>
                    <label className={labelClass}>Email de contacto</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                      required
                      placeholder="tu@email.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">Te enviaremos información sobre tu trámite a este email</p>
                  </div>
                )}

                {/* Monto y submit */}
                <div className="pt-4">
                  <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Monto a pagar:</span>
                      <span className="text-lg sm:text-xl font-semibold text-gray-900">
                        ${(20000).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-3 sm:py-2 bg-blue-600 text-white text-sm sm:text-base rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Procesando..." : "Continuar al pago"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-4">
          <p className="text-center text-gray-500 text-sm">
            © 2024 Trámites Misiones - Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  )
}
