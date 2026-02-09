"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function PagoSuccessPage() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get("payment_id")

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
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Pago Exitoso</h1>
              <p className="text-emerald-100">Tu transacción se completó correctamente</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 -mt-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto w-24 h-24 bg-emerald-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
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
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-2">Tu pago fue procesado</h2>
            <p className="text-slate-500 mb-6">
              Recibirás un correo de confirmación con los detalles de tu trámite.
            </p>

            {paymentId && (
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-slate-500">ID de pago</p>
                <p className="font-mono text-slate-700">{paymentId}</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Link href="/mis-tramites">
                <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
                  Ver mis trámites
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full h-12 border-2 border-slate-200 rounded-xl hover:bg-slate-50">
                  Volver al inicio
                </Button>
              </Link>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="mt-6 flex gap-3 justify-center">
            <div className="bg-emerald-400 rounded-xl px-4 py-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <span className="text-white text-sm font-medium">Pago seguro</span>
            </div>
            <div className="bg-sky-400 rounded-xl px-4 py-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="text-white text-sm font-medium">Trámite en proceso</span>
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
