import Link from "next/link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "MisTramites | Tramites Digitales en Misiones",
  description: "Solicita partidas, informes de inmuebles y apostillas de forma 100% online en la Provincia de Misiones.",
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img src="/icon-192x192.png" alt="MisTramites" className="w-8 h-8" />
              <span className="font-semibold text-gray-800 hidden sm:inline">MisTramites</span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <a href="#partidas" className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm">Partidas</a>
              <a href="#inmuebles" className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm">Inmuebles</a>
              <a href="#apostillas" className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm">Apostillas</a>
              <Link href="/login" className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700">
                Acceso Clientes
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Hero */}
        <div className="mb-6 sm:mb-10">
          <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">Tramites Digitales</h1>
          <p className="text-gray-600 text-sm">Provincia de Misiones - Solicita tus tramites 100% online</p>
        </div>

        {/* SECCION PARTIDAS */}
        <section id="partidas" className="mb-6 sm:mb-10">
          <div className="bg-white border border-gray-200 rounded">
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Actas con Legalizacion Digital</h2>
              <p className="text-xs sm:text-sm text-gray-600">Solicitud de Actas Legalizadas en la Provincia de Misiones</p>
            </div>
            <div className="p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-600 mb-4">
                Obtencion de actas de nacimiento, matrimonio y defuncion, mediante solicitud a traves del formulario.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <Link href="/oficinas/registro-personas">
                  <div className="border border-gray-200 rounded p-3 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">Actas Legalizadas</h3>
                    <p className="text-xs text-gray-600">Busqueda y legalizacion digital de actas de Nacimiento, Matrimonio y Defuncion con validez nacional.</p>
                  </div>
                </Link>
                <Link href="/oficinas/apostillas">
                  <div className="border border-gray-200 rounded p-3 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">Apostillado de la Haya</h3>
                    <p className="text-xs text-gray-600">Apostilla de actas con validez internacional. Envio en PDF con firma digital.</p>
                  </div>
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/oficinas/registro-personas" className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700">
                  Solicitar Partida
                </Link>
                <Link href="/oficinas/apostillas" className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 text-xs sm:text-sm rounded hover:bg-gray-50">
                  Solicitar Apostilla
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECCION INMUEBLES */}
        <section id="inmuebles" className="mb-6 sm:mb-10">
          <div className="bg-white border border-gray-200 rounded">
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Informes Digitales - Inmuebles</h2>
              <p className="text-xs sm:text-sm text-gray-600">Solicitud de Informes Catastrales e Informes Registro de Inmuebles</p>
            </div>
            <div className="p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-600 mb-4">
                Obtencion de Informes Catastrales e Informes Registro de Inmuebles de la Provincia de Misiones.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <Link href="/oficinas/registro-propiedad">
                  <div className="border border-gray-200 rounded p-3 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">Informes Registro de Inmuebles</h3>
                    <p className="text-xs text-gray-600">Informe de dominio e inhibicion con firma digital.</p>
                  </div>
                </Link>
                <Link href="/oficinas/catastro">
                  <div className="border border-gray-200 rounded p-3 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">Informes Catastrales</h3>
                    <p className="text-xs text-gray-600">Apto para situaciones. Formato PDF con validez nacional.</p>
                  </div>
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/oficinas/registro-propiedad" className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700">
                  Registro Inmuebles
                </Link>
                <Link href="/oficinas/catastro" className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 text-xs sm:text-sm rounded hover:bg-gray-50">
                  Solicitar Catastral
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECCION APOSTILLAS */}
        <section id="apostillas" className="mb-6 sm:mb-10">
          <div className="bg-white border border-gray-200 rounded">
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Apostillado Digital</h2>
              <p className="text-xs sm:text-sm text-gray-600">Solicitud de Apostilla/Legalizacion para documentos publicos</p>
            </div>
            <div className="p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-600 mb-4">
                Este tramite permite solicitar a distancia la Apostilla o Legalizacion de documentos publicos para ser presentados en el exterior, sin la necesidad de gestionar turnos.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="border border-gray-200 rounded p-3">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">Apostillado de la Haya</h3>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Actas de Nacimiento, Matrimonio, Defuncion</li>
                    <li>• Antecedentes Penales</li>
                    <li>• Validez Internacional</li>
                    <li>• Envio en PDF con firma digital</li>
                  </ul>
                </div>
              </div>
              <Link href="/oficinas/apostillas" className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700">
                Solicitar Apostilla
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="bg-white border border-gray-200 rounded">
          <div className="p-3 sm:p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Comenzar ahora</h2>
          </div>
          <div className="p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              Accede a tu cuenta para gestionar tus tramites o contactanos por WhatsApp.
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Link href="/login" className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700">
                Acceso Clientes
              </Link>
              <a href="https://wa.me/543764889861" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 text-xs sm:text-sm rounded hover:bg-gray-50">
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-center text-gray-500 text-xs sm:text-sm">
            © 2024 MisTramites - Todos los derechos reservados - Posadas, Misiones
          </p>
        </div>
      </footer>
    </div>
  )
}
