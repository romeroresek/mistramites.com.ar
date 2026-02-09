"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface Tramite {
  id: string
  oficina: string
  tipoTramite: string
  estado: string
  monto: number
  createdAt: string
  pago?: {
    estado: string
    mercadopagoId: string | null
  }
}

const estadoConfig: Record<string, { bg: string; text: string; label: string }> = {
  completado: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Completado" },
  en_proceso: { bg: "bg-sky-100", text: "text-sky-700", label: "En proceso" },
  rechazado: { bg: "bg-red-100", text: "text-red-700", label: "Rechazado" },
  pendiente: { bg: "bg-amber-100", text: "text-amber-700", label: "Pendiente" },
}

export default function MisTramites() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tramites, setTramites] = useState<Tramite[]>([])
  const [loading, setLoading] = useState(true)
  const verifiedRef = useRef(false)

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const fetchTramites = async (): Promise<Tramite[]> => {
    try {
      const res = await fetch("/api/tramites")
      const data = await res.json()
      setTramites(data)
      return data
    } catch (error) {
      console.error(error)
      return []
    } finally {
      setLoading(false)
    }
  }

  // Verificar pagos pendientes que ya tienen mercadopagoId (se inició el pago en MP)
  const verifyPendingPayments = async (tramitesList: Tramite[]) => {
    const pendientes = tramitesList.filter(
      (t) => t.pago?.estado === "pendiente" && t.pago?.mercadopagoId
    )

    if (pendientes.length === 0) return

    let updated = false
    for (const tramite of pendientes) {
      try {
        const res = await fetch("/api/mercadopago/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tramiteId: tramite.id }),
        })
        const data = await res.json()
        if (data.pagoEstado === "confirmado") {
          updated = true
        }
      } catch (err) {
        console.error("Error verificando pago:", err)
      }
    }

    // Si algún pago se actualizó, recargar la lista
    if (updated) {
      await fetchTramites()
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated") {
      const paymentId = searchParams.get("payment_id")

      if (paymentId && !verifiedRef.current) {
        // Viene de Mercado Pago con payment_id en la URL
        verifiedRef.current = true
        fetch("/api/mercadopago/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId }),
        })
          .then(() => fetchTramites())
          .then(() => router.replace("/mis-tramites"))
          .catch((error) => {
            console.error("Error verificando pago:", error)
            fetchTramites()
          })
      } else {
        // Carga normal: buscar trámites y verificar pagos pendientes
        fetchTramites().then((data) => verifyPendingPayments(data))
      }
    }
  }, [status, router, searchParams])

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600">Cargando tus trámites...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6 text-white"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div>
                  <span className="font-bold text-xl text-slate-800">MisTrámites</span>
                  <span className="hidden sm:inline text-sm text-slate-500 ml-2">Servicios Online</span>
                </div>
              </Link>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 ring-2 ring-slate-200">
                    <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                    <AvatarFallback className="bg-blue-600 text-white">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/">Inicio</Link>
                </DropdownMenuItem>
                {session?.user?.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Panel Admin</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/api/auth/signout" className="text-red-600">
                    Cerrar sesión
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path d="M9 14l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Mis Trámites</h1>
              <p className="text-orange-100">Seguí el estado de todas tus gestiones</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {tramites.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="mx-auto w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No tenés trámites registrados</h3>
            <p className="text-slate-500 mb-6">Comenzá a gestionar tus trámites de forma digital</p>
            <Link href="/">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl">
                Iniciar un trámite
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {tramites.map((tramite) => {
              const estado = estadoConfig[tramite.estado] || estadoConfig.pendiente
              return (
                <div key={tramite.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-amber-400 rounded-xl p-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">{tramite.tipoTramite}</h3>
                        <p className="text-slate-500 text-sm">{tramite.oficina}</p>
                        <p className="text-slate-400 text-xs mt-1">
                          Creado: {new Date(tramite.createdAt).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric"
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${estado.bg} ${estado.text}`}>
                        {estado.label}
                      </span>

                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                        tramite.pago?.estado === "confirmado"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {tramite.pago?.estado === "confirmado" ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            Pagado
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            Pago pendiente
                          </>
                        )}
                      </span>

                      <span className="text-lg font-bold text-slate-800">
                        ${tramite.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                    <Link href={`/mis-tramites/${tramite.id}`}>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6">
                        Ver detalles
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-4 h-4 text-white"
                >
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
