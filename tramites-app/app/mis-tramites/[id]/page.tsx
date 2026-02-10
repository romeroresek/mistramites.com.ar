"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"

interface Tramite {
  id: string
  oficina: string
  tipoTramite: string
  estado: string
  descripcion: string | null
  monto: number
  archivoUrl: string | null
  createdAt: string
  updatedAt: string
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

export default function TramiteDetalle() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [tramite, setTramite] = useState<Tramite | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingPayment, setProcessingPayment] = useState(false)

  const fetchTramite = async () => {
    try {
      const res = await fetch(`/api/tramites/${params.id}`)
      if (!res.ok) throw new Error("Trámite no encontrado")
      const data = await res.json()
      setTramite(data)
      return data
    } catch (error) {
      console.error(error)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated" && params.id) {
      fetchTramite().then((data) => {
        if (data && data.pago?.estado === "pendiente" && data.pago?.mercadopagoId) {
          fetch("/api/mercadopago/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tramiteId: data.id }),
          })
            .then((res) => res.json())
            .then((verifyData) => {
              if (verifyData.pagoEstado === "confirmado") {
                fetchTramite()
              }
            })
            .catch((err) => console.error("Error verificando pago:", err))
        }
      })
    }
  }, [status, router, params.id])

  const handlePagar = async () => {
    if (!tramite) return
    setProcessingPayment(true)

    try {
      const res = await fetch("/api/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tramiteId: tramite.id }),
      })

      const data = await res.json()

      if (data.initPoint) {
        window.location.href = data.initPoint
      } else {
        alert("Error al procesar el pago")
      }
    } catch (error) {
      console.error(error)
      alert("Error al procesar el pago")
    } finally {
      setProcessingPayment(false)
    }
  }

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case "completado": return "Completado"
      case "en_proceso": return "En proceso"
      case "rechazado": return "Rechazado"
      default: return "Pendiente"
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    )
  }

  if (!tramite) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded p-6 max-w-md w-full text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Trámite no encontrado</h2>
          <p className="text-gray-600 text-sm mb-4">El trámite que buscas no existe o no tienes acceso.</p>
          <Link
            href="/mis-tramites"
            className="inline-block px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
          >
            Volver a mis trámites
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex h-14 items-center justify-between">
            <Link href="/mis-tramites" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span className="text-xs sm:text-sm">Volver</span>
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <Image src="/icon.png" alt="TramitesMisiones" width={32} height={32} className="w-8 h-8" />
              <span className="font-semibold text-gray-800 hidden sm:inline">TramitesMisiones</span>
            </Link>
            <Link href="/api/auth/signout" className="text-red-600 hover:text-red-800 text-xs sm:text-sm">
              Salir
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <h1 className="text-lg sm:text-2xl font-semibold text-gray-900 mb-4">Detalle del trámite</h1>

        <div className="bg-white border border-gray-200 rounded">
          {/* Header */}
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-gray-900">{tramite.tipoTramite}</h2>
                <p className="text-sm text-gray-600">{tramite.oficina}</p>
              </div>
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded whitespace-nowrap">
                {getEstadoLabel(tramite.estado)}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="p-3 sm:p-4">
            {tramite.descripcion && (
              <div className="mb-4">
                <label className="text-xs text-gray-500">Descripción</label>
                <p className="text-sm text-gray-900">{tramite.descripcion}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
              <div>
                <label className="text-xs text-gray-500">Monto</label>
                <p className="text-base sm:text-lg font-semibold text-gray-900">
                  ${tramite.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Estado del Pago</label>
                <p className={`text-sm font-semibold ${tramite.pago?.estado === "confirmado" ? "text-green-600" : "text-yellow-600"}`}>
                  {tramite.pago?.estado === "confirmado" ? "Pagado" : "Pendiente"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 text-sm">
              <div>
                <label className="text-xs text-gray-500">Fecha de creación</label>
                <p className="text-sm text-gray-900">
                  {new Date(tramite.createdAt).toLocaleDateString("es-AR")}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500">Última actualización</label>
                <p className="text-sm text-gray-900">
                  {new Date(tramite.updatedAt).toLocaleDateString("es-AR")}
                </p>
              </div>
            </div>

            {tramite.pago?.estado !== "confirmado" && (
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handlePagar}
                  disabled={processingPayment}
                  className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingPayment ? "Procesando..." : "Pagar con Mercado Pago"}
                </button>
              </div>
            )}

            {tramite.archivoUrl && (
              <div className="pt-4 border-t border-gray-200 mt-4">
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1zm0 2h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1zm0 2h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1 0-1z"/>
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Documento disponible</p>
                      <p className="text-xs text-gray-500">Tu trámite está listo para descargar</p>
                    </div>
                  </div>
                  <a
                    href={tramite.archivoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Descargar
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Datos de la partida */}
        {tramite.partida && (
          <div className="bg-white border border-gray-200 rounded mt-4">
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Datos de la solicitud</h3>
            </div>
            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div>
                  <label className="text-xs text-gray-500">DNI</label>
                  <p className="text-sm font-medium text-gray-900">{tramite.partida.dni}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Sexo</label>
                  <p className="text-sm font-medium text-gray-900">{tramite.partida.sexo === "M" ? "Masculino" : "Femenino"}</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-gray-500">Nombre completo</label>
                  <p className="text-sm font-medium text-gray-900">{tramite.partida.apellido} {tramite.partida.nombres}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Fecha de nacimiento</label>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(tramite.partida.fechaNacimiento).toLocaleDateString("es-AR")}
                  </p>
                </div>
                {tramite.partida.ciudadNacimiento && (
                  <div>
                    <label className="text-xs text-gray-500">Ciudad de nacimiento</label>
                    <p className="text-sm font-medium text-gray-900">{tramite.partida.ciudadNacimiento}</p>
                  </div>
                )}
                {tramite.partida.fechaDefuncion && (
                  <div>
                    <label className="text-xs text-gray-500">Fecha de defunción</label>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(tramite.partida.fechaDefuncion).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                )}
              </div>

              {/* Segunda persona (matrimonio) */}
              {tramite.partida.tipoPartida === "matrimonio" && tramite.partida.dni2 && (
                <>
                  <hr className="my-4 border-gray-200" />
                  <h4 className="font-medium text-gray-900 mb-3 text-sm">Segunda persona</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                    <div>
                      <label className="text-xs text-gray-500">DNI</label>
                      <p className="text-sm font-medium text-gray-900">{tramite.partida.dni2}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Sexo</label>
                      <p className="text-sm font-medium text-gray-900">{tramite.partida.sexo2 === "M" ? "Masculino" : "Femenino"}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-gray-500">Nombre completo</label>
                      <p className="text-sm font-medium text-gray-900">{tramite.partida.apellido2} {tramite.partida.nombres2}</p>
                    </div>
                    {tramite.partida.fechaNacimiento2 && (
                      <div>
                        <label className="text-xs text-gray-500">Fecha de nacimiento</label>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(tramite.partida.fechaNacimiento2).toLocaleDateString("es-AR")}
                        </p>
                      </div>
                    )}
                  </div>

                  <hr className="my-4 border-gray-200" />
                  <h4 className="font-medium text-gray-900 mb-3 text-sm">Datos del matrimonio</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                    {tramite.partida.fechaMatrimonio && (
                      <div>
                        <label className="text-xs text-gray-500">Fecha de matrimonio</label>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(tramite.partida.fechaMatrimonio).toLocaleDateString("es-AR")}
                        </p>
                      </div>
                    )}
                    {tramite.partida.ciudadMatrimonio && (
                      <div>
                        <label className="text-xs text-gray-500">Ciudad</label>
                        <p className="text-sm font-medium text-gray-900">{tramite.partida.ciudadMatrimonio}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-xs text-gray-500">Divorciados</label>
                      <p className="text-sm font-medium text-gray-900">{tramite.partida.divorciados ? "Sí" : "No"}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
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
