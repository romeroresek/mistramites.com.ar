"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function PagoFailurePage() {
  const searchParams = useSearchParams()
  const externalReference = searchParams.get("external_reference")

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center">
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
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Pago Rechazado</h1>
              <p className="text-red-100">No pudimos procesar tu pago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 -mt-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto w-24 h-24 bg-red-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-12 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-2">El pago no pudo completarse</h2>
            <p className="text-slate-500 mb-6">
              Verificá los datos de tu tarjeta e intentá nuevamente. Si el problema persiste, contactá con tu banco.
            </p>

            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm font-medium text-red-800 mb-2">Posibles causas:</p>
              <ul className="text-sm text-red-700 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                  Fondos insuficientes
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                  Datos de tarjeta incorrectos
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                  Límite de compra excedido
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              {externalReference && (
                <Link href={`/mis-tramites/${externalReference}`}>
                  <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                    Intentar de nuevo
                  </Button>
                </Link>
              )}
              <Link href="/mis-tramites">
                <Button variant="outline" className="w-full h-12 border-2 border-slate-200 rounded-xl hover:bg-slate-50">
                  Ver mis trámites
                </Button>
              </Link>
            </div>
          </div>
        </div>
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
