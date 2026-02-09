"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"

const LOCALIDADES_MISIONES = [
  "Alba Posse",
  "Almafuerte",
  "Apóstoles",
  "Aristóbulo del Valle",
  "Arroyo del Medio",
  "Azara",
  "Bernardo de Irigoyen",
  "Bonpland",
  "Campo Grande",
  "Campo Ramón",
  "Campo Viera",
  "Candelaria",
  "Capioví",
  "Caraguatay",
  "Cerro Azul",
  "Cerro Corá",
  "Colonia Alberdi",
  "Colonia Aurora",
  "Colonia Delicia",
  "Colonia Polana",
  "Colonia Victoria",
  "Colonia Wanda",
  "Comandante Andresito",
  "Concepción de la Sierra",
  "Corpus",
  "Dos Arroyos",
  "Dos de Mayo",
  "El Alcázar",
  "El Soberbio",
  "Eldorado",
  "Fachinal",
  "Garuhapé",
  "Garupá",
  "Gobernador López",
  "Gobernador Roca",
  "Guaraní",
  "Iguazú",
  "Itacaruaré",
  "Jardín América",
  "Leandro N. Alem",
  "Loreto",
  "Los Helechos",
  "Mártires",
  "Mojón Grande",
  "Montecarlo",
  "9 de Julio",
  "Oberá",
  "Panambí",
  "Posadas",
  "Profundidad",
  "Puerto Esperanza",
  "Puerto Iguazú",
  "Puerto Leoni",
  "Puerto Libertad",
  "Puerto Piray",
  "Puerto Rico",
  "Ruiz de Montoya",
  "San Antonio",
  "San Ignacio",
  "San Javier",
  "San José",
  "San Martín",
  "San Pedro",
  "San Vicente",
  "Santa Ana",
  "Santa María",
  "Santo Pipó",
  "Tres Capones",
  "25 de Mayo",
  "Wanda",
].sort()

const inputClass = "w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white text-slate-800"
const labelClass = "block text-sm font-semibold text-slate-700 mb-1.5"
const selectClass = "w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white text-slate-800 appearance-none"

function PersonaFields({ dniVal, setDniVal, sexoVal, setSexoVal, nombresVal, setNombresVal, apellidoVal, setApellidoVal, fechaNacVal, setFechaNacVal, label }: {
  label: string
  dniVal: string; setDniVal: (v: string) => void
  sexoVal: string; setSexoVal: (v: string) => void
  nombresVal: string; setNombresVal: (v: string) => void
  apellidoVal: string; setApellidoVal: (v: string) => void
  fechaNacVal: string; setFechaNacVal: (v: string) => void
}) {
  return (
    <div className="space-y-4">
      {label && <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">{label}</h3>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>DNI</label>
          <input type="text" value={dniVal} onChange={(e) => setDniVal(e.target.value)} placeholder="Ej: 30790468" className={inputClass} required maxLength={10} />
        </div>
        <div>
          <label className={labelClass}>Sexo</label>
          <select value={sexoVal} onChange={(e) => setSexoVal(e.target.value)} className={selectClass} required>
            <option value="">Seleccione sexo</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>
      </div>
      <div>
        <label className={labelClass}>Apellido</label>
        <input type="text" value={apellidoVal} onChange={(e) => setApellidoVal(e.target.value)} placeholder="Apellido" className={inputClass} required />
      </div>
      <div>
        <label className={labelClass}>Nombres</label>
        <input type="text" value={nombresVal} onChange={(e) => setNombresVal(e.target.value)} placeholder="Nombres" className={inputClass} required />
      </div>
      <div>
        <label className={labelClass}>Fecha de nacimiento</label>
        <input type="date" value={fechaNacVal} onChange={(e) => setFechaNacVal(e.target.value)} className={inputClass} required />
      </div>
    </div>
  )
}

const PARTIDAS = [
  {
    id: "nacimiento",
    nombre: "Partida de Nacimiento",
    descripcion: "Solicitud de copia de partida de nacimiento",
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: "matrimonio",
    nombre: "Partida de Matrimonio",
    descripcion: "Solicitud de copia de partida de matrimonio",
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    id: "defuncion",
    nombre: "Partida de Defunción",
    descripcion: "Solicitud de copia de partida de defunción",
    icono: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
]

export default function RegistroPersonas() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedPartida, setSelectedPartida] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Nacimiento / Defunción fields
  const [dni, setDni] = useState("")
  const [sexo, setSexo] = useState("")
  const [nombres, setNombres] = useState("")
  const [apellido, setApellido] = useState("")
  const [fechaNacimiento, setFechaNacimiento] = useState("")
  const [ciudadNacimiento, setCiudadNacimiento] = useState("")
  const [fechaDefuncion, setFechaDefuncion] = useState("")

  // Matrimonio - Persona 2
  const [dni2, setDni2] = useState("")
  const [sexo2, setSexo2] = useState("")
  const [nombres2, setNombres2] = useState("")
  const [apellido2, setApellido2] = useState("")
  const [fechaNacimiento2, setFechaNacimiento2] = useState("")

  // Matrimonio datos
  const [fechaMatrimonio, setFechaMatrimonio] = useState("")
  const [ciudadMatrimonio, setCiudadMatrimonio] = useState("")
  const [divorciados, setDivorciados] = useState(false)

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
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
        dni,
        sexo,
        nombres,
        apellido,
        fechaNacimiento,
        ciudadNacimiento,
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-4">
            <Link href="/" className="text-slate-500 hover:text-slate-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-slate-800">Registro de las Personas</h1>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-bold">Partidas</h2>
              <p className="text-pink-100">Seleccioná el tipo de partida que deseás tramitar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Paso 1: Selección de tipo de partida */}
        <div className="grid gap-4 mb-8">
          {PARTIDAS.map((partida) => (
            <button
              key={partida.id}
              onClick={() => { setSelectedPartida(partida.id); resetForm() }}
              className={`w-full text-left bg-white rounded-2xl shadow-sm border-2 p-6 hover:shadow-md transition-all ${
                selectedPartida === partida.id
                  ? "border-pink-500 ring-2 ring-pink-200"
                  : "border-slate-100 hover:border-slate-200"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`rounded-xl p-3 flex-shrink-0 ${
                  selectedPartida === partida.id
                    ? "bg-pink-500 text-white"
                    : "bg-pink-100 text-pink-600"
                }`}>
                  {partida.icono}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800">{partida.nombre}</h3>
                  <p className="text-slate-500 text-sm">{partida.descripcion}</p>
                </div>
                {selectedPartida === partida.id && (
                  <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Paso 2: Formulario según tipo de partida */}
        {selectedPartida && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 space-y-6">
            <h2 className="text-xl font-bold text-slate-800">
              {PARTIDAS.find(p => p.id === selectedPartida)?.nombre}
            </h2>

            {/* Partida de Nacimiento */}
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
                  <select value={ciudadNacimiento} onChange={(e) => setCiudadNacimiento(e.target.value)} className={selectClass} required>
                    <option value="">Seleccione localidad</option>
                    {LOCALIDADES_MISIONES.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Partida de Defunción */}
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
                  <label className={labelClass}>Ciudad de nacimiento o defunción</label>
                  <select value={ciudadNacimiento} onChange={(e) => setCiudadNacimiento(e.target.value)} className={selectClass} required>
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

            {/* Partida de Matrimonio */}
            {selectedPartida === "matrimonio" && (
              <>
                <PersonaFields
                  label="Datos de la primera persona"
                  dniVal={dni} setDniVal={setDni}
                  sexoVal={sexo} setSexoVal={setSexo}
                  nombresVal={nombres} setNombresVal={setNombres}
                  apellidoVal={apellido} setApellidoVal={setApellido}
                  fechaNacVal={fechaNacimiento} setFechaNacVal={setFechaNacimiento}
                />

                <div className="border-t border-slate-200 pt-6">
                  <PersonaFields
                    label="Datos de la segunda persona"
                    dniVal={dni2} setDniVal={setDni2}
                    sexoVal={sexo2} setSexoVal={setSexo2}
                    nombresVal={nombres2} setNombresVal={setNombres2}
                    apellidoVal={apellido2} setApellidoVal={setApellido2}
                    fechaNacVal={fechaNacimiento2} setFechaNacVal={setFechaNacimiento2}
                  />
                </div>

                <div className="border-t border-slate-200 pt-6 space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">Datos del matrimonio</h3>
                  <div>
                    <label className={labelClass}>Fecha de matrimonio</label>
                    <input type="date" value={fechaMatrimonio} onChange={(e) => setFechaMatrimonio(e.target.value)} className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>Ciudad en donde se realizó el matrimonio</label>
                    <select value={ciudadMatrimonio} onChange={(e) => setCiudadMatrimonio(e.target.value)} className={selectClass} required>
                      <option value="">Seleccione localidad</option>
                      {LOCALIDADES_MISIONES.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="divorciados"
                      checked={divorciados}
                      onChange={(e) => setDivorciados(e.target.checked)}
                      className="w-4 h-4 text-pink-600 border-slate-300 rounded focus:ring-pink-500"
                    />
                    <label htmlFor="divorciados" className="text-sm text-slate-700">
                      Marcar si una o ambas personas están divorciadas
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Monto y botón */}
            <div className="border-t border-slate-200 pt-6 space-y-4">
              <div className="bg-pink-50 rounded-xl p-4 flex items-center justify-between">
                <span className="text-slate-700 font-medium">Monto a pagar:</span>
                <span className="text-2xl font-bold text-pink-600">$20.000,00</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 px-6 rounded-xl transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                      <line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    Continuar al pago
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-white">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <span className="font-semibold">MisTrámites</span>
            </div>
            <p className="text-slate-400 text-sm">
              © 2024 Todos los derechos reservados
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
