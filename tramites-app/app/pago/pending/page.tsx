"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function PendingContent() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get("payment_id")

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded text-center">
          <div className="p-6 border-b border-gray-200 bg-yellow-50">
            <div className="mx-auto w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Pago Pendiente</h1>
            <p className="text-gray-600 text-sm">Tu pago está siendo procesado</p>
          </div>

          <div className="p-6">
            {paymentId && (
              <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
                <p className="text-xs text-gray-500">ID de pago</p>
                <p className="font-mono text-sm text-gray-700">{paymentId}</p>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 text-left">
              <p className="text-sm font-medium text-yellow-800 mb-2">Si elegiste pagar en efectivo:</p>
              <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                <li>Acercate a un punto de pago</li>
                <li>Presentá el código de pago</li>
                <li>Una vez acreditado, tu trámite será procesado</li>
              </ol>
            </div>

            <p className="text-gray-600 text-sm mb-6">
              Te notificaremos cuando se complete el proceso.
            </p>

            <div className="space-y-2">
              <Link
                href="/mis-tramites"
                className="block w-full px-4 py-2 bg-blue-600 text-white text-center rounded hover:bg-blue-700"
              >
                Ver mis trámites
              </Link>
              <Link
                href="/"
                className="block w-full px-4 py-2 border border-gray-300 text-gray-700 text-center rounded hover:bg-gray-50"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PagoPendingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    }>
      <PendingContent />
    </Suspense>
  )
}
