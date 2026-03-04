"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Check } from "lucide-react"

function SuccessContent() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get("payment_id")

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded text-center">
          <div className="p-6 border-b border-gray-200 bg-green-50">
            <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Pago Exitoso</h1>
            <p className="text-gray-600 text-sm">Tu transacción se completó correctamente</p>
          </div>

          <div className="p-6">
            {paymentId && (
              <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
                <p className="text-xs text-gray-500">ID de pago</p>
                <p className="font-mono text-sm text-gray-700">{paymentId}</p>
              </div>
            )}

            <p className="text-gray-600 text-sm mb-6">
              Recibirás un correo de confirmación con los detalles de tu trámite cuando esté completado.
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

export default function PagoSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
