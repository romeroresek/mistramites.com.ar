"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"

export default function PagoPage() {
  const { data: session, status } = useSession()
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
      // Crear preferencia de pago en Mercado Pago
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
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <Link href="/mis-tramites" className="text-indigo-600 hover:text-indigo-800">
            Volver a mis trámites
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Completar Pago</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white p-8 rounded-lg shadow">
          <p className="text-gray-700 mb-6">
            Serás redirigido a Mercado Pago para completar el pago de forma segura.
          </p>

          {initPoint ? (
            <a
              href={initPoint}
              className="inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition"
            >
              Ir a pagar con Mercado Pago
            </a>
          ) : (
            <div className="text-center text-gray-600">
              <p>Preparando el pago...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
