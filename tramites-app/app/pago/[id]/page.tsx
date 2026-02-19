"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { PageNavbar } from "@/components/PageNavbar"

export default function PagoPage() {
  const { status } = useSession()
  const router = useRouter()
  const params = useParams()
  const tramiteId = params.id as string

  const [loading, setLoading] = useState(true)
  const [initPoint, setInitPoint] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated" && tramiteId) {
      fetch("/api/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tramiteId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error)
          } else {
            setInitPoint(data.initPoint)
          }
          setLoading(false)
        })
        .catch((err) => {
          console.error(err)
          setError("Error al procesar el pago")
          setLoading(false)
        })
    }
  }, [status, tramiteId, router])

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white border border-gray-200 rounded text-center">
            <div className="p-6 border-b border-gray-200 bg-red-50">
              <div className="mx-auto w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Error</h1>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-6">{error}</p>
              <Link
                href="/mis-tramites"
                className="block w-full px-4 py-2 border border-gray-300 text-gray-700 text-center rounded hover:bg-gray-50"
              >
                Volver a mis trámites
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <PageNavbar backHref="/mis-tramites" />

      {/* Main Content */}
      <main className="w-full max-w-md mx-auto px-5 sm:px-6 py-5 sm:py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="bg-white border border-gray-200 rounded text-center">
          <div className="p-6 border-b border-gray-200 bg-blue-50">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Completar Pago</h1>
          </div>

          <div className="p-6">
            <p className="text-gray-600 text-sm mb-6">
              Serás redirigido a Mercado Pago para completar el pago de forma segura.
            </p>

            {initPoint ? (
              <a
                href={initPoint}
                className="block w-full px-4 py-3 bg-blue-600 text-white text-center rounded hover:bg-blue-700"
              >
                Ir a pagar con Mercado Pago
              </a>
            ) : (
              <p className="text-gray-500 text-sm">Preparando el pago...</p>
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
