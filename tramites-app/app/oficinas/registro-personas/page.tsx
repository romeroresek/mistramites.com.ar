"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"

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

const inputClass = "w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
const labelClass = "block text-sm font-medium text-gray-700 mb-1"

function PersonaFields({ label, dniVal, setDniVal, sexoVal, setSexoVal, nombresVal, setNombresVal, apellidoVal, setApellidoVal, fechaNacVal, setFechaNacVal }: {
  label: string
  dniVal: string; setDniVal: (v: string) => void
  sexoVal: string; setSexoVal: (v: string) => void
  nombresVal: string; setNombresVal: (v: string) => void
  apellidoVal: string; setApellidoVal: (v: string) => void
  fechaNacVal: string; setFechaNacVal: (v: string) => void
}) {
  return (
    <div className="space-y-3">
      {label && <h3 className="font-semibold text-gray-900 border-b pb-2">{label}</h3>}
      <div className="grid grid-cols-2 gap-3">
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
        <label className={labelClass}>Apellido</label>
        <input type="text" value={apellidoVal} onChange={(e) => setApellidoVal(e.target.value)} className={inputClass} required />
      </div>
      <div>
        <label className={labelClass}>Nombres</label>
        <input type="text" value={nombresVal} onChange={(e) => setNombresVal(e.target.value)} className={inputClass} required />
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
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedPartida, setSelectedPartida] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [dni, setDni] = useState("")
  const [sexo, setSexo] = useState("")
  const [nombres, setNombres] = useState("")
  const [apellido, setApellido] = useState("")
  const [fechaNacimiento, setFechaNacimiento] = useState("")
  const [ciudadNacimiento, setCiudadNacimiento] = useState("")
  const [fechaDefuncion, setFechaDefuncion] = useState("")

  const [dni2, setDni2] = useState("")
  const [sexo2, setSexo2] = useState("")
  const [nombres2, setNombres2] = useState("")
  const [apellido2, setApellido2] = useState("")
  const [fechaNacimiento2, setFechaNacimiento2] = useState("")

  const [fechaMatrimonio, setFechaMatrimonio] = useState("")
  const [ciudadMatrimonio, setCiudadMatrimonio] = useState("")
  const [divorciados, setDivorciados] = useState(false)

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    )
  }

  const resetForm = () => {
    setDni(""); setSexo(""); setNombres(""); setApellido("")
    setFechaNacimiento(""); setCiudadNacimiento(""); setFechaDefuncion("")
    setDni2(""); setSexo2(""); setNombres2(""); setApellido2("")
    setFechaNacimiento2(""); setFechaMatrimonio(""); setCiudadMatrimonio("")
    setDivorciados(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPartida) return

    setLoading(true)

    try {
      const body: any = {
        tipoPartida: selectedPartida,
        dni, sexo, nombres, apellido, fechaNacimiento, ciudadNacimiento,
      }

      if (selectedPartida === "defuncion") {
        body.fechaDefuncion = fechaDefuncion
      }

      if (selectedPartida === "matrimonio") {
        body.dni2 = dni2
        body.sexo2 = sexo2
        body.nombres2 = nombres2
        body.apellido2 = apellido2
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
        alert(data.error || "Error al crear la solicitud")
        return
      }

      if (data.initPoint) {
        window.location.href = data.initPoint
      } else {
        router.push(`/mis-tramites/${data.tramiteId}`)
      }
    } catch (error) {
      console.error(error)
      alert("Error al procesar la solicitud")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex h-14 items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="font-semibold text-gray-900">Registro de las Personas</h1>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-200 rounded">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Solicitar Partida</h2>
            <p className="text-sm text-gray-600">Seleccioná el tipo de partida y completá los datos</p>
          </div>

          <div className="p-4">
            {/* Tipo de partida */}
            <div className="mb-6">
              <label className={labelClass}>Tipo de partida</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                {PARTIDAS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setSelectedPartida(p.id); resetForm() }}
                    className={`p-3 border rounded text-sm text-left transition-colors ${
                      selectedPartida === p.id
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
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nacimiento */}
                {selectedPartida === "nacimiento" && (
                  <>
                    <PersonaFields
                      label=""
                      dniVal={dni} setDniVal={setDni}
                      sexoVal={sexo} setSexoVal={setSexo}
                      nombresVal={nombres} setNombresVal={setNombres}
                      apellidoVal={apellido} setApellidoVal={setApellido}
                      fechaNacVal={fechaNacimiento} setFechaNacVal={setFechaNacimiento}
                    />
                    <div>
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
                      nombresVal={nombres} setNombresVal={setNombres}
                      apellidoVal={apellido} setApellidoVal={setApellido}
                      fechaNacVal={fechaNacimiento} setFechaNacVal={setFechaNacimiento}
                    />
                    <div>
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
                      nombresVal={nombres} setNombresVal={setNombres}
                      apellidoVal={apellido} setApellidoVal={setApellido}
                      fechaNacVal={fechaNacimiento} setFechaNacVal={setFechaNacimiento}
                    />

                    <div className="border-t pt-4">
                      <PersonaFields
                        label="Segunda persona"
                        dniVal={dni2} setDniVal={setDni2}
                        sexoVal={sexo2} setSexoVal={setSexo2}
                        nombresVal={nombres2} setNombresVal={setNombres2}
                        apellidoVal={apellido2} setApellidoVal={setApellido2}
                        fechaNacVal={fechaNacimiento2} setFechaNacVal={setFechaNacimiento2}
                      />
                    </div>

                    <div className="border-t pt-4 space-y-3">
                      <h3 className="font-semibold text-gray-900">Datos del matrimonio</h3>
                      <div>
                        <label className={labelClass}>Fecha de matrimonio</label>
                        <input type="date" value={fechaMatrimonio} onChange={(e) => setFechaMatrimonio(e.target.value)} className={inputClass} required />
                      </div>
                      <div>
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

                {/* Monto y submit */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-700">Monto a pagar:</span>
                    <span className="text-xl font-semibold text-gray-900">$20.000,00</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-center text-gray-500 text-sm">
            © 2024 MisTrámites - Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  )
}
