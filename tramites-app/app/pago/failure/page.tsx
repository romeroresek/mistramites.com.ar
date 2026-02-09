"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function PagoFailurePage() {
  const searchParams = useSearchParams()
  const externalReference = searchParams.get("external_reference")

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
            <h1 className="text-xl font-semibold text-gray-900">Pago Rechazado</h1>
            <p className="text-gray-600 text-sm">No pudimos procesar tu pago</p>
          </div>

          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-left">
              <p className="text-sm font-medium text-red-800 mb-2">Posibles causas:</p>
              <ul className="text-sm text-red-700 space-y-1">
                <li>- Fondos insuficientes</li>
                <li>- Datos de tarjeta incorrectos</li>
                <li>- Límite de compra excedido</li>
              </ul>
            </div>

            <p className="text-gray-600 text-sm mb-6">
              Verificá los datos de tu tarjeta e intentá nuevamente.
            </p>

            <div className="space-y-2">
              {externalReference && (
                <Link
                  href={`/mis-tramites/${externalReference}`}
                  className="block w-full px-4 py-2 bg-blue-600 text-white text-center rounded hover:bg-blue-700"
                >
                  Intentar de nuevo
                </Link>
              )}
              <Link
                href="/mis-tramites"
                className="block w-full px-4 py-2 border border-gray-300 text-gray-700 text-center rounded hover:bg-gray-50"
              >
                Ver mis trámites
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
