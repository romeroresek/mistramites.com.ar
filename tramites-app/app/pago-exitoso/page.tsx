"use client"

import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { PageNavbar } from "@/components/PageNavbar"
import { Suspense } from "react"
import { XCircle, AlertCircle, CheckCircle2, MessageCircle } from "lucide-react"

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
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Pago no completado</h1>
              <p className="text-gray-600 mb-6">
                Hubo un problema con el pago. Podés intentar nuevamente.
              </p>
            </>
          ) : isPending ? (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Pago pendiente</h1>
              <p className="text-gray-600 mb-6">
                Tu pago está siendo procesado. Te notificaremos cuando se confirme.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">¡Tu Trámite está en proceso!</h1>
              <p className="text-gray-600 mb-6">
                Tu solicitud y pago fue recibida correctamente y dependiendo del tipo de trámite tiene su demora. Te enviaremos un mensaje automático por WhatsApp cuando tu trámite este finalizado.
              </p>
            </>
          )}

          {tramiteId && (
            <p className="text-sm text-gray-500 mb-6">
              Número de trámite: <span className="font-mono font-medium">{tramiteId.slice(-8).toUpperCase()}</span>
            </p>
          )}

          <a
            href="https://wa.me/543764889861"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-green-700 hover:text-green-800 hover:underline"
          >
            <MessageCircle className="w-4 h-4" />
            Por consultas comunicate con nosotros
          </a>
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
