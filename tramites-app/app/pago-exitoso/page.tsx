"use client"

import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { PageNavbar } from "@/components/PageNavbar"
import { Suspense } from "react"

function PagoExitosoContent() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const tramiteId = searchParams.get("tramiteId")
  const paymentStatus = searchParams.get("status")

  const isLoggedIn = status === "authenticated" && session?.user?.email
  const isFailure = paymentStatus === "failure"
  const isPending = paymentStatus === "pending"

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <PageNavbar backHref="/mis-tramites" />

      {/* Main */}
      <main className="w-full max-w-lg mx-auto px-5 sm:px-6 py-5 sm:py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="bg-white border border-gray-200 rounded p-6 text-center">
          {isFailure ? (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Pago no completado</h1>
              <p className="text-gray-600 mb-6">
                Hubo un problema con el pago. Podés intentar nuevamente.
              </p>
            </>
          ) : isPending ? (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-yellow-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Pago pendiente</h1>
              <p className="text-gray-600 mb-6">
                Tu pago está siendo procesado. Te notificaremos cuando se confirme.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">¡Trámite registrado!</h1>
              <p className="text-gray-600 mb-6">
                Tu solicitud fue recibida correctamente. Te contactaremos por WhatsApp para informarte sobre el estado de tu trámite.
              </p>
            </>
          )}

          {tramiteId && (
            <p className="text-sm text-gray-500 mb-6">
              Número de trámite: <span className="font-mono font-medium">{tramiteId.slice(-8).toUpperCase()}</span>
            </p>
          )}

          {isLoggedIn ? (
            <Link
              href="/mis-tramites"
              className="inline-block w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Ver mis trámites
            </Link>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Creá una cuenta para seguir el estado de tu trámite online
              </p>
              <Link
                href="/registro"
                className="inline-block w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Crear cuenta
              </Link>
              <Link
                href="/login"
                className="inline-block w-full px-4 py-3 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Ya tengo cuenta
              </Link>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
              Volver al inicio
            </Link>
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

export default function PagoExitoso() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    }>
      <PagoExitosoContent />
    </Suspense>
  )
}
