"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

interface Tramite {
  id: string
  oficina: string
  tipoTramite: string
  estado: string
  descripcion: string | null
  monto: number
  createdAt: string
  updatedAt: string
  user: { name: string; email: string }
  pago?: {
    id: string
    estado: string
    mercadopagoId: string | null
  }
  partida?: {
    tipoPartida: string
    dni: string
    sexo: string
    nombres: string
    apellido: string
    fechaNacimiento: string
    ciudadNacimiento: string | null
    fechaDefuncion: string | null
    dni2: string | null
    sexo2: string | null
    nombres2: string | null
    apellido2: string | null
    fechaNacimiento2: string | null
    fechaMatrimonio: string | null
    ciudadMatrimonio: string | null
    divorciados: boolean
  }
}

const estadoOptions = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_proceso", label: "En proceso" },
  { value: "completado", label: "Completado" },
  { value: "rechazado", label: "Rechazado" },
]

export default function AdminTramiteDetalle() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [tramite, setTramite] = useState<Tramite | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const fetchTramite = async () => {
    try {
      const res = await fetch(`/api/admin/tramites/${params.id}`)
      if (!res.ok) throw new Error("No encontrado")
      const data = await res.json()
      setTramite(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") { router.push("/login"); return }
    if (session?.user?.role !== "admin") { router.push("/"); return }

    fetchTramite().then(() => {
      // Verificar pago si está pendiente
      fetch("/api/mercadopago/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tramiteId: params.id }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.pagoEstado === "confirmado") fetchTramite()
        })
        .catch(() => {})
    })
  }, [status, session, router, params.id])

  const handleEstadoChange = async (nuevoEstado: string) => {
    if (!tramite) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/tramites/${tramite.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      if (res.ok) {
        const data = await res.json()
        setTramite(data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  if (!tramite) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Trámite no encontrado</h2>
          <Link href="/admin" className="text-indigo-600 hover:text-indigo-800 font-semibold">
            Volver al panel
          </Link>
        </div>
      </div>
    )
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center gap-4">
          <Link href="/admin" className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Detalle del trámite</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Info general */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{tramite.tipoTramite}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Oficina:</span>
              <p className="font-semibold text-gray-900">{tramite.oficina}</p>
            </div>
            <div>
              <span className="text-gray-500">Usuario:</span>
              <p className="font-semibold text-gray-900">{tramite.user.name}</p>
              <p className="text-gray-600">{tramite.user.email}</p>
            </div>
            <div>
              <span className="text-gray-500">Monto:</span>
              <p className="font-bold text-gray-900 text-lg">
                ${tramite.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Pago:</span>
              <p className={`font-semibold ${tramite.pago?.estado === "confirmado" ? "text-green-600" : "text-yellow-600"}`}>
                {tramite.pago?.estado === "confirmado" ? "Pagado" : "Pago pendiente"}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Creado:</span>
              <p className="font-semibold text-gray-900">{formatDate(tramite.createdAt)}</p>
            </div>
            <div>
              <span className="text-gray-500">Actualizado:</span>
              <p className="font-semibold text-gray-900">{formatDate(tramite.updatedAt)}</p>
            </div>
          </div>

          {tramite.descripcion && (
            <div className="mt-4">
              <span className="text-gray-500 text-sm">Descripción:</span>
              <p className="text-gray-900">{tramite.descripcion}</p>
            </div>
          )}
        </div>

        {/* Estado del trámite */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Estado del trámite</h3>
          <div className="flex flex-wrap gap-2">
            {estadoOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleEstadoChange(opt.value)}
                disabled={updating || tramite.estado === opt.value}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  tramite.estado === opt.value
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } disabled:cursor-not-allowed`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Datos de la partida */}
        {tramite.partida && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Datos de la partida
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">DNI:</span>
                <p className="font-semibold text-gray-900">{tramite.partida.dni}</p>
              </div>
              <div>
                <span className="text-gray-500">Sexo:</span>
                <p className="font-semibold text-gray-900">{tramite.partida.sexo === "M" ? "Masculino" : "Femenino"}</p>
              </div>
              <div>
                <span className="text-gray-500">Apellido:</span>
                <p className="font-semibold text-gray-900">{tramite.partida.apellido}</p>
              </div>
              <div>
                <span className="text-gray-500">Nombres:</span>
                <p className="font-semibold text-gray-900">{tramite.partida.nombres}</p>
              </div>
              <div>
                <span className="text-gray-500">Fecha de nacimiento:</span>
                <p className="font-semibold text-gray-900">{formatDate(tramite.partida.fechaNacimiento)}</p>
              </div>
              {tramite.partida.ciudadNacimiento && (
                <div>
                  <span className="text-gray-500">Ciudad:</span>
                  <p className="font-semibold text-gray-900">{tramite.partida.ciudadNacimiento}</p>
                </div>
              )}
              {tramite.partida.fechaDefuncion && (
                <div>
                  <span className="text-gray-500">Fecha de defunción:</span>
                  <p className="font-semibold text-gray-900">{formatDate(tramite.partida.fechaDefuncion)}</p>
                </div>
              )}
            </div>

            {/* Persona 2 (matrimonio) */}
            {tramite.partida.tipoPartida === "matrimonio" && tramite.partida.dni2 && (
              <>
                <hr className="my-4" />
                <h4 className="font-bold text-gray-900 mb-3">Segunda persona</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">DNI:</span>
                    <p className="font-semibold text-gray-900">{tramite.partida.dni2}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Sexo:</span>
                    <p className="font-semibold text-gray-900">{tramite.partida.sexo2 === "M" ? "Masculino" : "Femenino"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Apellido:</span>
                    <p className="font-semibold text-gray-900">{tramite.partida.apellido2}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Nombres:</span>
                    <p className="font-semibold text-gray-900">{tramite.partida.nombres2}</p>
                  </div>
                  {tramite.partida.fechaNacimiento2 && (
                    <div>
                      <span className="text-gray-500">Fecha de nacimiento:</span>
                      <p className="font-semibold text-gray-900">{formatDate(tramite.partida.fechaNacimiento2)}</p>
                    </div>
                  )}
                </div>

                <hr className="my-4" />
                <h4 className="font-bold text-gray-900 mb-3">Datos del matrimonio</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {tramite.partida.fechaMatrimonio && (
                    <div>
                      <span className="text-gray-500">Fecha de matrimonio:</span>
                      <p className="font-semibold text-gray-900">{formatDate(tramite.partida.fechaMatrimonio)}</p>
                    </div>
                  )}
                  {tramite.partida.ciudadMatrimonio && (
                    <div>
                      <span className="text-gray-500">Ciudad:</span>
                      <p className="font-semibold text-gray-900">{tramite.partida.ciudadMatrimonio}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Divorciados:</span>
                    <p className="font-semibold text-gray-900">{tramite.partida.divorciados ? "Sí" : "No"}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
