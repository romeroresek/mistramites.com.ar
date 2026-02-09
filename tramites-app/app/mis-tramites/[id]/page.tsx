"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface Tramite {
  id: string
  oficina: string
  tipoTramite: string
  estado: string
  descripcion: string | null
  monto: number
  createdAt: string
  updatedAt: string
  pago?: {
    id: string
    estado: string
    mercadopagoId: string | null
  }
}

const estadoColors: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  en_proceso: "bg-blue-100 text-blue-800",
  completado: "bg-green-100 text-green-800",
  rechazado: "bg-red-100 text-red-800",
}

const estadoLabels: Record<string, string> = {
  pendiente: "Pendiente",
  en_proceso: "En Proceso",
  completado: "Completado",
  rechazado: "Rechazado",
}

export default function TramiteDetalle() {
  const { data: session, status } = useSession()
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
        // Si el pago está pendiente y ya se inició un pago en MP, verificar el estado
        if (data && data.pago?.estado === "pendiente" && data.pago?.mercadopagoId) {
          fetch("/api/mercadopago/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tramiteId: data.id }),
          })
            .then((res) => res.json())
            .then((verifyData) => {
              if (verifyData.pagoEstado === "confirmado") {
                // Recargar el trámite para mostrar el estado actualizado
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

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!tramite) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Trámite no encontrado</CardTitle>
            <CardDescription>El trámite que buscas no existe o no tienes acceso.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/mis-tramites">
              <Button variant="outline" className="w-full">Volver a mis trámites</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center">
          <Link href="/mis-tramites">
            <Button variant="ghost" className="gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Volver
            </Button>
          </Link>
        </div>
      </header>

      <main className="container py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{tramite.tipoTramite}</CardTitle>
                <CardDescription className="text-base mt-1">{tramite.oficina}</CardDescription>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${estadoColors[tramite.estado]}`}>
                {estadoLabels[tramite.estado]}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {tramite.descripcion && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Descripción</h3>
                <p className="text-foreground">{tramite.descripcion}</p>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Monto</h3>
                <p className="text-2xl font-bold">${tramite.monto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Estado del Pago</h3>
                <p className={`text-lg font-semibold ${tramite.pago?.estado === "confirmado" ? "text-green-600" : "text-yellow-600"}`}>
                  {tramite.pago?.estado === "confirmado" ? "Pagado" : "Pendiente"}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Fecha de creación:</span>
                <p className="font-medium">{new Date(tramite.createdAt).toLocaleDateString("es-AR", {
                  day: "2-digit", month: "long", year: "numeric"
                })}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Última actualización:</span>
                <p className="font-medium">{new Date(tramite.updatedAt).toLocaleDateString("es-AR", {
                  day: "2-digit", month: "long", year: "numeric"
                })}</p>
              </div>
            </div>

            {tramite.pago?.estado !== "confirmado" && (
              <>
                <Separator />
                <Button
                  onClick={handlePagar}
                  disabled={processingPayment}
                  className="w-full h-12 text-base"
                >
                  {processingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                        <line x1="1" y1="10" x2="23" y2="10"/>
                      </svg>
                      Pagar con Mercado Pago
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
